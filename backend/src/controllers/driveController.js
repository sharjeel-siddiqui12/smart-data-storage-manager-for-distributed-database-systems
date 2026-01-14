import database from "../config/database.js";
import oracledb from "oracledb"; // Add this import

import { v4 as uuidv4 } from "uuid";

// Get all drives
export async function getAllDrives(req, res, next) {
  try {
    const result = await database.executeQuery(
      `SELECT * FROM drives ORDER BY drive_name`
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

// Get a single drive by ID
export async function getDriveById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await database.executeQuery(
      `SELECT * FROM drives WHERE drive_id = :id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Drive not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Create a new drive
export async function createDrive(req, res, next) {
  try {
    const {
      driveName,
      location,
      capacity,
      availableSpace,
      status,
      driveType,
      isBackup,
    } = req.body;

    // Validate required fields
    if (
      !driveName ||
      !location ||
      !capacity ||
      !availableSpace ||
      !status ||
      !driveType
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Generate drive ID
    const driveId = `DRIVE-${String(
      Math.floor(Math.random() * 1000000)
    ).padStart(6, "0")}`;

    const result = await database.executeQuery(
      `INSERT INTO drives (
        drive_id, drive_name, location, capacity, 
        available_space, status, drive_type, is_backup
      ) VALUES (
        :driveId, :driveName, :location, :capacity,
        :availableSpace, :status, :driveType, :isBackup
      ) RETURNING drive_id INTO :drivIdOut`,
      {
        driveId,
        driveName,
        location,
        capacity,
        availableSpace,
        status,
        driveType,
        isBackup: isBackup ? 1 : 0,
        drivIdOut: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
      }
    );

    res.status(201).json({
      message: "Drive created successfully",
      driveId: driveId,
    });
  } catch (error) {
    next(error);
  }
}

// Update a drive
export async function updateDrive(req, res, next) {
  try {
    const { id } = req.params;
    let {
      driveName,
      location,
      capacity,
      availableSpace,
      status,
      driveType,
      isBackup,
    } = req.body;

    // Convert string values to numbers and ensure they're valid
    capacity = Number(capacity);
    availableSpace = Number(availableSpace);

    // Validate values more thoroughly
    if (isNaN(capacity) || capacity <= 0) {
      return res.status(400).json({
        error: "Capacity must be a positive number",
      });
    }

    if (isNaN(availableSpace) || availableSpace < 0) {
      return res.status(400).json({
        error: "Available space cannot be negative",
      });
    }

    if (availableSpace > capacity) {
      return res.status(400).json({
        error: "Available space cannot exceed capacity",
      });
    }

    // Valid status values
    const validStatuses = [
      "HEALTHY",
      "WARNING",
      "DEGRADED",
      "CRITICAL",
      "FAILING",
      "FAILED",
      "MAINTENANCE",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid drive status",
      });
    }

    // Valid drive types
    const validDriveTypes = ["SSD", "HDD", "NVMe", "SATA", "SAS"];
    if (!validDriveTypes.includes(driveType)) {
      return res.status(400).json({
        error: "Invalid drive type",
      });
    }

    // Check if drive exists
    const checkResult = await database.executeQuery(
      `SELECT * FROM drives WHERE drive_id = :id`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Drive not found" });
    }

    // Get existing values for debugging
    console.log("Updating drive with values:", {
      id,
      driveName,
      location,
      capacity,
      availableSpace,
      status,
      driveType,
      isBackup,
    });

    // Update the drive
    await database.executeQuery(
      `UPDATE drives SET
        drive_name = :driveName,
        location = :location,
        capacity = :capacity,
        available_space = :availableSpace,
        status = :status,
        drive_type = :driveType,
        is_backup = :isBackup,
        updated_at = CURRENT_TIMESTAMP
      WHERE drive_id = :id`,
      {
        driveName,
        location,
        capacity,
        availableSpace,
        status,
        driveType,
        isBackup: isBackup ? 1 : 0,
        id,
      }
    );

    res.json({
      message: "Drive updated successfully",
    });
  } catch (error) {
    console.error("Error updating drive:", error);
    next(error);
  }
}
// Delete a drive
// Delete a drive
export async function deleteDrive(req, res, next) {
  try {
    const { id } = req.params;
    const { force } = req.query; // Add force parameter

    // Check if drive has any dependencies
    // Inside deleteDrive function
    const [chunksResult, replicasResult, metricsResult, redistributionResult] =
      await Promise.all([
        database.executeQuery(
          `SELECT COUNT(*) as chunk_count FROM data_chunks WHERE drive_id = :id`,
          [id]
        ),
        database.executeQuery(
          `SELECT COUNT(*) as replica_count FROM chunk_replicas WHERE drive_id = :id`,
          [id]
        ),
        database.executeQuery(
          `SELECT COUNT(*) as metrics_count FROM drive_metrics WHERE drive_id = :id`,
          [id]
        ),
        database.executeQuery(
          `SELECT COUNT(*) as log_count FROM redistribution_logs 
       WHERE source_drive_id = :id OR target_drive_id = :id`,
          [id, id] // Fixed: provide id twice for two bind placeholders
        ),
      ]);

    const dependencies = {
      chunks: chunksResult.rows[0].CHUNK_COUNT,
      replicas: replicasResult.rows[0].REPLICA_COUNT,
      metrics: metricsResult.rows[0].METRICS_COUNT,
      logs: redistributionResult.rows[0].LOG_COUNT,
      hasDependencies:
        chunksResult.rows[0].CHUNK_COUNT > 0 ||
        replicasResult.rows[0].REPLICA_COUNT > 0 ||
        metricsResult.rows[0].METRICS_COUNT > 0 ||
        redistributionResult.rows[0].LOG_COUNT > 0,
    };

    // If there are dependencies and force is not true, return dependency info
    if (dependencies.hasDependencies && force !== "true") {
      return res.status(409).json({
        error: "Drive has dependencies",
        dependencies,
      });
    }

    // If force=true or no dependencies, proceed with deletion
    // Delete data chunks if any (only when force=true)
    if (dependencies.chunks > 0) {
      // Get all chunks on the drive
      const chunks = await database.executeQuery(
        `SELECT chunk_id FROM data_chunks WHERE drive_id = :id`,
        [id]
      );

      // Delete redistribution logs for these chunks
      for (const chunk of chunks.rows) {
        await database.executeQuery(
          `DELETE FROM redistribution_logs WHERE chunk_id = :chunkId`,
          [chunk.CHUNK_ID]
        );
      }

      // Delete replicas of these chunks
      await database.executeQuery(
        `DELETE FROM chunk_replicas 
         WHERE chunk_id IN (SELECT chunk_id FROM data_chunks WHERE drive_id = :id)`,
        [id]
      );

      // Delete chunks
      await database.executeQuery(
        `DELETE FROM data_chunks WHERE drive_id = :id`,
        [id]
      );
    }

    // Delete replicas if any
    if (dependencies.replicas > 0) {
      await database.executeQuery(
        `DELETE FROM chunk_replicas WHERE drive_id = :id`,
        [id]
      );
    }

    // Delete associated metrics
    if (dependencies.metrics > 0) {
      await database.executeQuery(
        `DELETE FROM drive_metrics WHERE drive_id = :id`,
        [id]
      );
    }

    // Delete redistribution logs
    if (dependencies.logs > 0) {
      await database.executeQuery(
        `DELETE FROM redistribution_logs 
         WHERE source_drive_id = :id OR target_drive_id = :id`,
        [id]
      );
    }

    // Now delete the drive
    const result = await database.executeQuery(
      `DELETE FROM drives WHERE drive_id = :id`,
      [id]
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Drive not found" });
    }

    res.json({
      message: "Drive deleted successfully",
      forcedDelete: force === "true" && dependencies.hasDependencies,
      deletedDependencies: dependencies,
    });
  } catch (error) {
    next(error);
  }
}
// Get drive statistics
export async function getDriveStatistics(req, res, next) {
  try {
    const { id } = req.params;

    // Check if drive exists
    const checkResult = await database.executeQuery(
      `SELECT drive_id FROM drives WHERE drive_id = :id`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Drive not found" });
    }

    // Get drive metrics
    const metricsResult = await database.executeQuery(
      `SELECT * FROM drive_metrics 
       WHERE drive_id = :id 
       ORDER BY recorded_at DESC`,
      [id]
    );

    // Get chunks on the drive
    const chunksResult = await database.executeQuery(
      `SELECT COUNT(*) as total_chunks, 
              SUM(size_mb) as total_size 
       FROM data_chunks 
       WHERE drive_id = :id`,
      [id]
    );

    // Get replicas on the drive
    const replicasResult = await database.executeQuery(
      `SELECT COUNT(*) as total_replicas
       FROM chunk_replicas
       WHERE drive_id = :id`,
      [id]
    );

    res.json({
      metrics: metricsResult.rows,
      chunks: {
        count: chunksResult.rows[0].TOTAL_CHUNKS || 0,
        totalSize: chunksResult.rows[0].TOTAL_SIZE || 0,
      },
      replicas: {
        count: replicasResult.rows[0].TOTAL_REPLICAS || 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get drives with health status
export async function getDrivesHealth(req, res, next) {
  try {
    const result = await database.executeQuery(`
      SELECT 
        d.drive_id, 
        d.drive_name, 
        d.status, 
        d.drive_type,
        d.capacity,
        d.available_space,
        (d.capacity - d.available_space) / d.capacity * 100 as utilization_percent,
        (SELECT COUNT(*) FROM data_chunks WHERE drive_id = d.drive_id) as chunks_count,
        COALESCE((SELECT MAX(error_rate) FROM drive_metrics WHERE drive_id = d.drive_id), 0) as error_rate,
        COALESCE((SELECT MAX(temperature) FROM drive_metrics WHERE drive_id = d.drive_id), 0) as temperature
      FROM drives d
      ORDER BY 
        CASE d.status
          WHEN 'FAILED' THEN 1
          WHEN 'FAILING' THEN 2
          WHEN 'DEGRADED' THEN 3
          WHEN 'MAINTENANCE' THEN 4
          WHEN 'HEALTHY' THEN 5
        END,
        utilization_percent DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}
