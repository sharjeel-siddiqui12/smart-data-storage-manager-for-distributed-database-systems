import database from "../config/database.js";

// Simulate a drive failure
export async function simulateDriveFailure(req, res, next) {
  try {
    const { driveId, failureType } = req.body;

    if (!driveId) {
      return res.status(400).json({ error: "Drive ID is required" });
    }

    // Check if drive exists
    const driveCheck = await database.executeQuery(
      `SELECT drive_id, status FROM drives WHERE drive_id = :driveId`,
      [driveId]
    );

    if (driveCheck.rows.length === 0) {
      return res.status(404).json({ error: "Drive not found" });
    }

    const drive = driveCheck.rows[0];

    if (drive.STATUS === "FAILED") {
      return res
        .status(400)
        .json({ error: "Drive is already in FAILED state" });
    }

    // Determine failure status based on type
    const status =
      failureType === "complete"
        ? "FAILED"
        : failureType === "degraded"
        ? "DEGRADED"
        : "FAILING";

    // Update drive status
    await database.executeQuery(
      `UPDATE drives SET status = :status, updated_at = CURRENT_TIMESTAMP
       WHERE drive_id = :driveId`,
      { status, driveId }
    );

    // If complete failure, trigger data redistribution
    if (status === "FAILED" || status === "FAILING") {
      await database.executeQuery(
        `BEGIN redistribute_data_from_drive(:driveId, :reason); END;`,
        {
          driveId,
          reason: `Simulated ${failureType} failure`,
        }
      );
    }

    res.json({
      message: `Drive failure (${failureType}) simulated successfully`,
      recoveryStarted: status === "FAILED" || status === "FAILING",
    });
  } catch (error) {
    next(error);
  }
}

// Simulate data chunk corruption
export async function simulateChunkCorruption(req, res, next) {
  try {
    const { chunkId } = req.body;

    if (!chunkId) {
      return res.status(400).json({ error: "Chunk ID is required" });
    }

    // Check if chunk exists
    const chunkCheck = await database.executeQuery(
      `SELECT chunk_id, status FROM data_chunks WHERE chunk_id = :chunkId`,
      [chunkId]
    );

    if (chunkCheck.rows.length === 0) {
      return res.status(404).json({ error: "Data chunk not found" });
    }

    const chunk = chunkCheck.rows[0];

    if (chunk.STATUS === "CORRUPTED") {
      return res.status(400).json({ error: "Chunk is already corrupted" });
    }

    // Update chunk status to corrupted
    await database.executeQuery(
      `UPDATE data_chunks SET status = 'CORRUPTED', updated_at = CURRENT_TIMESTAMP
       WHERE chunk_id = :chunkId`,
      [chunkId]
    );

    // Check if chunk has a replica for recovery
    const replicaCheck = await database.executeQuery(
      `SELECT replica_id, drive_id FROM chunk_replicas 
       WHERE chunk_id = :chunkId AND status = 'HEALTHY'
       FETCH FIRST 1 ROW ONLY`,
      [chunkId]
    );

    let recoveryPossible = false;

    if (replicaCheck.rows.length > 0) {
      recoveryPossible = true;
    }

    res.json({
      message: "Data chunk corruption simulated successfully",
      recoveryPossible,
      replica: replicaCheck.rows.length > 0 ? replicaCheck.rows[0] : null,
    });
  } catch (error) {
    next(error);
  }
}

// Recover corrupted chunk from replica
export async function recoverCorruptedChunk(req, res, next) {
  try {
    const { chunkId } = req.body;

    if (!chunkId) {
      return res.status(400).json({ error: "Chunk ID is required" });
    }

    // Check if chunk exists and is corrupted
    const chunkCheck = await database.executeQuery(
      `SELECT c.chunk_id, c.status, c.drive_id, c.size_mb 
       FROM data_chunks c
       WHERE c.chunk_id = :chunkId`,
      [chunkId]
    );

    if (chunkCheck.rows.length === 0) {
      return res.status(404).json({ error: "Data chunk not found" });
    }

    const chunk = chunkCheck.rows[0];

    if (chunk.STATUS !== "CORRUPTED") {
      return res.status(400).json({ error: "Chunk is not in corrupted state" });
    }

    // Find a healthy replica
    const replicaCheck = await database.executeQuery(
      `SELECT r.replica_id, r.drive_id 
       FROM chunk_replicas r
       JOIN drives d ON r.drive_id = d.drive_id
       WHERE r.chunk_id = :chunkId 
         AND r.status = 'HEALTHY'
         AND d.status = 'HEALTHY'
       FETCH FIRST 1 ROW ONLY`,
      [chunkId]
    );

    if (replicaCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No healthy replica found for recovery" });
    }

    const replica = replicaCheck.rows[0];

    // Create log entry for recovery
    const logId = `LOG-${String(Math.floor(Math.random() * 1000000)).padStart(
      6,
      "0"
    )}`;

    await database.executeQuery(
      `INSERT INTO redistribution_logs (
        log_id, chunk_id, source_drive_id, target_drive_id, 
        reason, status, started_at
      ) VALUES (
        :logId, :chunkId, :sourceDriveId, :targetDriveId,
        'Recovering corrupted chunk from replica', 'IN_PROGRESS', CURRENT_TIMESTAMP
      )`,
      {
        logId,
        chunkId,
        sourceDriveId: replica.DRIVE_ID,
        targetDriveId: chunk.DRIVE_ID,
      }
    );

    // Update chunk status
    await database.executeQuery(
      `UPDATE data_chunks SET 
        status = 'ACTIVE',
        updated_at = CURRENT_TIMESTAMP
       WHERE chunk_id = :chunkId`,
      [chunkId]
    );

    // Update log entry
    await database.executeQuery(
      `UPDATE redistribution_logs SET 
        status = 'COMPLETED',
        completed_at = CURRENT_TIMESTAMP
       WHERE log_id = :logId`,
      [logId]
    );

    res.json({
      message: "Corrupted data chunk recovered successfully",
    });
  } catch (error) {
    next(error);
  }
}

// Simulate high load on drives
export async function simulateHighLoad(req, res, next) {
  try {
    const { driveCount, loadPercentage } = req.body;

    // Parameter validation
    const count = Math.min(parseInt(driveCount) || 2, 5); // Default to 2, max 5
    const load = Math.min(Math.max(parseInt(loadPercentage) || 80, 50), 95); // Between 50-95%, default 80%

    // Get healthy drives with the most available space
    const drivesResult = await database.executeQuery(`
      SELECT drive_id, available_space
      FROM drives
      WHERE status = 'HEALTHY' AND is_backup = 0
      ORDER BY available_space DESC
      FETCH FIRST ${count} ROWS ONLY
    `);

    if (drivesResult.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "No suitable drives found for load simulation" });
    }

    const updatedDrives = [];

    // Create chunks to fill up drives
    for (const drive of drivesResult.rows) {
      const spaceToUse = Math.floor(drive.AVAILABLE_SPACE * (load / 100));
      if (spaceToUse <= 0) continue;

      // Create chunk that takes up the specified space
      const chunkId = `CHUNK-${String(
        Math.floor(Math.random() * 1000000)
      ).padStart(6, "0")}`;
      const chunkName = `LoadTest-${new Date().toISOString().slice(0, 10)}-${
        drive.DRIVE_ID
      }`;

      await database.executeQuery(
        `INSERT INTO data_chunks (
          chunk_id, chunk_name, size_mb, drive_id, 
          priority, replicated, status
        ) VALUES (
          :chunkId, :chunkName, :sizeMb, :driveId,
          2, 0, 'ACTIVE'
        )`,
        {
          chunkId,
          chunkName,
          sizeMb: spaceToUse,
          driveId: drive.DRIVE_ID,
        }
      );

      // Update available space on drive
      await database.executeQuery(
        `UPDATE drives 
         SET available_space = available_space - :sizeMb,
             updated_at = CURRENT_TIMESTAMP
         WHERE drive_id = :driveId`,
        {
          sizeMb: spaceToUse,
          driveId: drive.DRIVE_ID,
        }
      );

      // Record high CPU/throughput metrics
      const metricId = `METRIC-${String(
        Math.floor(Math.random() * 1000000)
      ).padStart(6, "0")}`;

      await database.executeQuery(
        `INSERT INTO drive_metrics (
          metric_id, drive_id, cpu_usage, io_throughput,
          response_time, error_rate, temperature, utilization_percent
        ) VALUES (
          :metricId, :driveId, :cpuUsage, :ioThroughput,
          :responseTime, :errorRate, :temperature, :utilization
        )`,
        {
          metricId,
          driveId: drive.DRIVE_ID,
          cpuUsage: Math.floor(70 + Math.random() * 25),
          ioThroughput: Math.floor(150 + Math.random() * 50),
          responseTime: Math.floor(15 + Math.random() * 10),
          errorRate: 0.01 + Math.random() * 0.02,
          temperature: Math.floor(50 + Math.random() * 10),
          utilization: load,
        }
      );

      updatedDrives.push({
        driveId: drive.DRIVE_ID,
        spaceUsed: spaceToUse,
        newLoad: load,
      });
    }

    // Trigger rebalancing if needed
    if (load > 85) {
      await database.executeQuery(`BEGIN rebalance_data_distribution; END;`);
    }

    res.json({
      message: "High load simulation completed successfully",
      affectedDrives: updatedDrives,
      rebalancingTriggered: load > 85,
    });
  } catch (error) {
    next(error);
  }
}

// Generate random data chunks
export async function generateRandomChunks(req, res, next) {
  try {
    const { count, minSize, maxSize, priority } = req.body;

    // Parameter validation
    const chunkCount = Math.min(parseInt(count) || 5, 20);
    const min = parseInt(minSize) || 10000;
    const max = parseInt(maxSize) || 50000;
    const chunkPriority = Math.min(Math.max(parseInt(priority) || 3, 1), 5);

    const generatedChunks = [];

    // Generate random chunks and distribute them
    for (let i = 0; i < chunkCount; i++) {
      const size = Math.floor(min + Math.random() * (max - min));
      const chunkId = `CHUNK-${String(
        Math.floor(Math.random() * 1000000)
      ).padStart(6, "0")}`;
      const chunkName = `RandomData-${i + 1}-${new Date()
        .toISOString()
        .slice(0, 10)}`;

      // Find optimal drive
      const optimalDriveResult = await database.executeQuery(
        `SELECT get_optimal_drive_for_chunk(:sizeMb, :priority) as drive_id FROM dual`,
        { sizeMb: size, priority: chunkPriority }
      );

      if (!optimalDriveResult.rows[0].DRIVE_ID) {
        return res.status(400).json({
          error: "Not enough space available to create random chunks",
          chunksGenerated: generatedChunks,
        });
      }

      const driveId = optimalDriveResult.rows[0].DRIVE_ID;

      // Insert the chunk
      await database.executeQuery(
        `INSERT INTO data_chunks (
          chunk_id, chunk_name, size_mb, drive_id, 
          priority, replicated, status
        ) VALUES (
          :chunkId, :chunkName, :sizeMb, :driveId,
          :priority, :replicated, 'ACTIVE'
        )`,
        {
          chunkId,
          chunkName,
          sizeMb: size,
          driveId,
          priority: chunkPriority,
          replicated: Math.random() > 0.5 ? 1 : 0,
        }
      );

      // Update available space on drive
      await database.executeQuery(
        `UPDATE drives 
         SET available_space = available_space - :sizeMb,
             updated_at = CURRENT_TIMESTAMP
         WHERE drive_id = :driveId`,
        { sizeMb: size, driveId }
      );

      generatedChunks.push({
        chunkId,
        chunkName,
        size,
        driveId,
      });

      // Create replicas if needed (randomly)
      if (Math.random() > 0.5) {
        const backupDriveResult = await database.executeQuery(
          `SELECT drive_id FROM drives 
           WHERE is_backup = 1 
             AND available_space >= :sizeMb
             AND status = 'HEALTHY'
             AND drive_id != :driveId
           ORDER BY (capacity - available_space) / capacity * 100 ASC
           FETCH FIRST 1 ROW ONLY`,
          { sizeMb: size, driveId }
        );

        if (backupDriveResult.rows.length > 0) {
          const backupDriveId = backupDriveResult.rows[0].DRIVE_ID;

          // Generate replica ID
          const replicaId = `REPLICA-${String(
            Math.floor(Math.random() * 1000000)
          ).padStart(6, "0")}`;

          // Insert replica
          await database.executeQuery(
            `INSERT INTO chunk_replicas (
              replica_id, chunk_id, drive_id, status
            ) VALUES (
              :replicaId, :chunkId, :driveId, 'HEALTHY'
            )`,
            {
              replicaId,
              chunkId,
              driveId: backupDriveId,
            }
          );

          // Update backup drive space
          await database.executeQuery(
            `UPDATE drives 
             SET available_space = available_space - :sizeMb,
                 updated_at = CURRENT_TIMESTAMP
             WHERE drive_id = :driveId`,
            { sizeMb: size, driveId: backupDriveId }
          );
        }
      }
    }

    res.json({
      message: `${generatedChunks.length} random data chunks generated successfully`,
      generatedChunks,
    });
  } catch (error) {
    next(error);
  }
}

// Reset simulation
export async function resetSimulation(req, res, next) {
  try {
    // First, query to get the information about chunks before deleting them
    const chunksToDeleteResult = await database.executeQuery(`
      SELECT chunk_id, size_mb, drive_id 
      FROM data_chunks
      WHERE chunk_name LIKE 'LoadTest%' OR chunk_name LIKE 'RandomData%'
    `);

    const chunksToDelete = chunksToDeleteResult.rows;

    // Delete related records in redistribution_logs first
    await database.executeQuery(`
      DELETE FROM redistribution_logs
      WHERE chunk_id IN (
        SELECT chunk_id FROM data_chunks
        WHERE chunk_name LIKE 'LoadTest%' OR chunk_name LIKE 'RandomData%'
      )
    `);

    // Delete all replicas for those chunks
    await database.executeQuery(`
      DELETE FROM chunk_replicas
      WHERE chunk_id IN (
        SELECT chunk_id FROM data_chunks
        WHERE chunk_name LIKE 'LoadTest%' OR chunk_name LIKE 'RandomData%'
      )
    `);

    // Delete the chunks themselves
    await database.executeQuery(`
      DELETE FROM data_chunks
      WHERE chunk_name LIKE 'LoadTest%' OR chunk_name LIKE 'RandomData%'
    `);

    // Reset space on drives using the data we collected earlier
    for (const chunk of chunksToDelete) {
      await database.executeQuery(
        `UPDATE drives 
         SET available_space = available_space + :sizeMb,
             updated_at = CURRENT_TIMESTAMP
         WHERE drive_id = :driveId`,
        {
          sizeMb: chunk.SIZE_MB,
          driveId: chunk.DRIVE_ID,
        }
      );
    }

    // Reset drive statuses
    await database.executeQuery(`
      UPDATE drives 
      SET status = 'HEALTHY',
          updated_at = CURRENT_TIMESTAMP
      WHERE status IN ('DEGRADED', 'FAILING')
    `);

    res.json({
      message: "Simulation reset successfully",
      chunksDeleted: chunksToDelete.length,
    });
  } catch (error) {
    next(error);
  }
}
