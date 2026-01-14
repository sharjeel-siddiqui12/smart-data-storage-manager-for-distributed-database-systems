import database from "../config/database.js";

// Get all data chunks
export async function getAllChunks(req, res, next) {
  try {
    const result = await database.executeQuery(
      `SELECT c.*, d.drive_name 
       FROM data_chunks c
       JOIN drives d ON c.drive_id = d.drive_id
       ORDER BY c.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

// Get a single chunk by ID
export async function getChunkById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await database.executeQuery(
      `SELECT c.*, d.drive_name 
       FROM data_chunks c
       JOIN drives d ON c.drive_id = d.drive_id
       WHERE c.chunk_id = :id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Data chunk not found" });
    }

    // Get replicas for this chunk
    const replicasResult = await database.executeQuery(
      `SELECT r.*, d.drive_name 
       FROM chunk_replicas r
       JOIN drives d ON r.drive_id = d.drive_id
       WHERE r.chunk_id = :id`,
      [id]
    );

    const chunk = result.rows[0];
    chunk.replicas = replicasResult.rows;

    res.json(chunk);
  } catch (error) {
    next(error);
  }
}

// Create a new data chunk
// Create a new data chunk
export async function createChunk(req, res, next) {
  try {
    const { chunkName, sizeMb, driveId, priority, replicated, checksum } =
      req.body;

    // Validate
    if (!chunkName) {
      return res.status(400).json({ error: "Chunk name is required" });
    }

    if (!sizeMb || isNaN(sizeMb) || Number(sizeMb) <= 0) {
      return res.status(400).json({
        error: "Size in MB is required and must be a positive number",
      });
    }

    // Generate chunk ID
    const chunkId = `CHUNK-${String(
      Math.floor(Math.random() * 1000000)
    ).padStart(6, "0")}`;

    // Find appropriate drive if not specified
    let targetDriveId = driveId;
    if (!targetDriveId) {
      const driveResult = await database.executeQuery(
        `SELECT drive_id FROM drives 
         WHERE is_backup = 0 
           AND available_space >= :sizeMb
           AND status = 'HEALTHY'
         ORDER BY (capacity - available_space) / capacity * 100 ASC
         FETCH FIRST 1 ROW ONLY`,
        [sizeMb]
      );

      if (driveResult.rows.length === 0) {
        return res.status(400).json({
          error: "No suitable drives found with enough space",
        });
      }

      targetDriveId = driveResult.rows[0].DRIVE_ID;
    }

    // Insert the chunk
    await database.executeQuery(
      `INSERT INTO data_chunks (
        chunk_id, chunk_name, size_mb, drive_id, 
        priority, replicated, checksum, status
      ) VALUES (
        :chunkId, :chunkName, :sizeMb, :driveId,
        :priority, :replicated, :checksum, 'ACTIVE'
      )`,
      {
        chunkId,
        chunkName,
        sizeMb,
        driveId: targetDriveId,
        priority: priority || 3,
        replicated: replicated ? 1 : 0,
        checksum: checksum || null,
      }
    );

    // Update drive available space
    await database.executeQuery(
      `UPDATE drives 
       SET available_space = available_space - :sizeMb,
           updated_at = CURRENT_TIMESTAMP
       WHERE drive_id = :driveId`,
      { sizeMb, driveId: targetDriveId }
    );

    // Create replicas if needed
    if (replicated) {
      // Get active distribution policy
      const policy = await database.executeQuery(
        `SELECT min_replicas FROM distribution_policies WHERE active = 1`,
        []
      );

      const minReplicas =
        policy.rows.length > 0 ? policy.rows[0].MIN_REPLICAS : 1;

      // Count available backup drives
      const availableDrivesResult = await database.executeQuery(
        `SELECT COUNT(*) as count FROM drives 
         WHERE is_backup = 1 
           AND available_space >= :sizeMb
           AND status = 'HEALTHY'
           AND drive_id != :driveId`,
        { sizeMb, driveId: targetDriveId }
      );

      const availableDrivesCount = availableDrivesResult.rows[0].COUNT;

      // If not enough backup drives, return with warning
      if (availableDrivesCount < minReplicas) {
        return res.status(201).json({
          message: "Data chunk created successfully",
          chunkId: chunkId,
          driveId: targetDriveId,
          warning: "insufficient_backup_drives",
          availableBackupDrives: availableDrivesCount,
          requiredReplicas: minReplicas,
        });
      }

      // Keep track of drives already used for replicas to avoid duplicates
      const usedDriveIds = new Set([targetDriveId]); // Include original drive

      for (let i = 0; i < minReplicas; i++) {
        // Find backup drive for replica, excluding drives already used
        const backupDriveResult = await database.executeQuery(
          `SELECT drive_id FROM drives 
           WHERE is_backup = 1 
             AND available_space >= :sizeMb
             AND status = 'HEALTHY'
             AND drive_id != :driveId
             AND drive_id NOT IN (${Array.from(usedDriveIds)
               .map((_, idx) => `:excluded${idx}`)
               .join(", ")})
           ORDER BY (capacity - available_space) / capacity * 100 ASC
           FETCH FIRST 1 ROW ONLY`,
          {
            sizeMb,
            driveId: targetDriveId,
            ...Object.fromEntries(
              Array.from(usedDriveIds).map((id, idx) => [`excluded${idx}`, id])
            ),
          }
        );

        if (backupDriveResult.rows.length > 0) {
          const backupDriveId = backupDriveResult.rows[0].DRIVE_ID;
          // Add this drive to the set of used drives
          usedDriveIds.add(backupDriveId);

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
            { sizeMb, driveId: backupDriveId }
          );
        }
      }
    }

    res.status(201).json({
      message: "Data chunk created successfully",
      chunkId: chunkId,
      driveId: targetDriveId,
    });
  } catch (error) {
    next(error);
  }
}

// Create replicas with limited backup drives
export async function createLimitedReplicas(req, res, next) {
  try {
    const { id } = req.params;
    const { replicaCount } = req.body;

    if (!replicaCount || isNaN(replicaCount) || replicaCount < 1) {
      return res.status(400).json({
        error: "Valid replica count is required",
      });
    }

    // Get chunk details
    const chunkResult = await database.executeQuery(
      `SELECT * FROM data_chunks WHERE chunk_id = :id`,
      [id]
    );

    if (chunkResult.rows.length === 0) {
      return res.status(404).json({
        error: "Chunk not found",
      });
    }

    const chunk = chunkResult.rows[0];
    const sizeMb = chunk.SIZE_MB;
    const sourceDriveId = chunk.DRIVE_ID;

    // Get drives already used for this chunk (source + existing replicas)
    const usedDrivesResult = await database.executeQuery(
      `SELECT d.drive_id 
       FROM drives d
       WHERE d.drive_id = :sourceDriveId
       UNION
       SELECT r.drive_id
       FROM chunk_replicas r
       WHERE r.chunk_id = :chunkId`,
      {
        sourceDriveId: sourceDriveId,
        chunkId: id,
      }
    );

    const usedDriveIds = usedDrivesResult.rows.map((row) => row.DRIVE_ID);

    // Find available backup drives not already used
    const availableDrivesResult = await database.executeQuery(
      `SELECT drive_id FROM drives 
       WHERE is_backup = 1 
         AND available_space >= :sizeMb
         AND status = 'HEALTHY'
         AND drive_id NOT IN (${usedDriveIds
           .map((_, idx) => `:drive${idx}`)
           .join(",")})
       ORDER BY (capacity - available_space) / capacity * 100 ASC`,
      {
        sizeMb: sizeMb,
        ...usedDriveIds.reduce((acc, driveId, idx) => {
          acc[`drive${idx}`] = driveId;
          return acc;
        }, {}),
      }
    );

    const availableDrives = availableDrivesResult.rows;
    const createdReplicas = [];

    // Create replicas up to the requested count or available drives
    const actualReplicaCount = Math.min(replicaCount, availableDrives.length);

    for (let i = 0; i < actualReplicaCount; i++) {
      const targetDriveId = availableDrives[i].DRIVE_ID;

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
          chunkId: id,
          driveId: targetDriveId,
        }
      );

      // Update drive space
      await database.executeQuery(
        `UPDATE drives 
         SET available_space = available_space - :sizeMb,
             updated_at = CURRENT_TIMESTAMP
         WHERE drive_id = :driveId`,
        {
          sizeMb: sizeMb,
          driveId: targetDriveId,
        }
      );

      createdReplicas.push({
        replicaId,
        driveId: targetDriveId,
      });
    }

    // Update chunk replicated status if any replicas were created
    if (createdReplicas.length > 0) {
      await database.executeQuery(
        `UPDATE data_chunks 
         SET replicated = 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE chunk_id = :id`,
        [id]
      );
    }

    res.json({
      message: `Created ${createdReplicas.length} replicas successfully`,
      requestedReplicaCount: replicaCount,
      createdReplicaCount: createdReplicas.length,
      replicas: createdReplicas,
    });
  } catch (error) {
    next(error);
  }
}

// Update a chunk
export async function updateChunk(req, res, next) {
  try {
    const { id } = req.params;
    const { chunkName, priority, status, checksum } = req.body;

    // Check if chunk exists
    const checkResult = await database.executeQuery(
      `SELECT chunk_id FROM data_chunks WHERE chunk_id = :id`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Data chunk not found" });
    }
    // Update the chunk
    await database.executeQuery(
      `UPDATE data_chunks SET
        chunk_name = :chunkName,
        priority = :priority,
        status = :status,
        checksum = :checksum,
        updated_at = CURRENT_TIMESTAMP
      WHERE chunk_id = :id`,
      {
        chunkName,
        priority,
        status,
        checksum,
        id,
      }
    );

    res.json({
      message: "Data chunk updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

// Delete a chunk (with its replicas)
export async function deleteChunk(req, res, next) {
  try {
    const { id } = req.params;

    // Get chunk details for space management
    const chunkResult = await database.executeQuery(
      `SELECT size_mb, drive_id FROM data_chunks WHERE chunk_id = :id`,
      [id]
    );

    if (chunkResult.rows.length === 0) {
      return res.status(404).json({ error: "Data chunk not found" });
    }

    const chunk = chunkResult.rows[0];
    console.log("Chunk to delete:", chunk); // Add debugging

    // Get replicas for space management
    const replicasResult = await database.executeQuery(
      `SELECT drive_id FROM chunk_replicas WHERE chunk_id = :id`,
      [id]
    );

    // Transaction to delete chunk and update space
    try {
      // Delete related redistribution logs first
      await database.executeQuery(
        `DELETE FROM redistribution_logs WHERE chunk_id = :id`,
        [id]
      );

      // Delete replicas
      await database.executeQuery(
        `DELETE FROM chunk_replicas WHERE chunk_id = :id`,
        [id]
      );

      // Update space for replica drives
      for (const replica of replicasResult.rows) {
        await database.executeQuery(
          `UPDATE drives 
           SET available_space = available_space + :sizeMb,
               updated_at = CURRENT_TIMESTAMP
           WHERE drive_id = :driveId`,
          { sizeMb: Number(chunk.SIZE_MB), driveId: replica.DRIVE_ID }
        );
      }

      // Delete the chunk
      await database.executeQuery(
        `DELETE FROM data_chunks WHERE chunk_id = :id`,
        [id]
      );

      // Make sure we're accessing the SIZE_MB property with correct case
      const sizeToFree = Number(chunk.SIZE_MB);
      console.log("Size to free (MB):", sizeToFree);

      if (isNaN(sizeToFree)) {
        console.error("Invalid chunk size:", chunk);
        return res.status(500).json({
          error: "Invalid chunk size value detected",
        });
      }

      // Update space for main drive with validated size
      await database.executeQuery(
        `UPDATE drives 
         SET available_space = available_space + :sizeMb,
             updated_at = CURRENT_TIMESTAMP
         WHERE drive_id = :driveId`,
        {
          sizeMb: sizeToFree,
          driveId: chunk.DRIVE_ID,
        }
      );

      res.json({
        message: "Data chunk and its replicas deleted successfully",
        sizeFreed: sizeToFree,
      });
    } catch (error) {
      console.error("Error during chunk deletion:", error);
      next(error);
    }
  } catch (error) {
    next(error);
  }
}

// Relocate a chunk to another drive
export async function relocateChunk(req, res, next) {
  try {
    const { id } = req.params;
    const { targetDriveId, reason } = req.body;

    if (!targetDriveId) {
      return res.status(400).json({ error: "Target drive ID is required" });
    }

    // Get chunk details
    const chunkResult = await database.executeQuery(
      `SELECT size_mb, drive_id FROM data_chunks WHERE chunk_id = :id`,
      [id]
    );

    if (chunkResult.rows.length === 0) {
      return res.status(404).json({ error: "Data chunk not found" });
    }

    const chunk = chunkResult.rows[0];

    // Check target drive
    const driveResult = await database.executeQuery(
      `SELECT available_space FROM drives WHERE drive_id = :driveId`,
      [targetDriveId]
    );

    if (driveResult.rows.length === 0) {
      return res.status(400).json({ error: "Target drive not found" });
    }

    if (driveResult.rows[0].AVAILABLE_SPACE < chunk.SIZE_MB) {
      return res
        .status(400)
        .json({ error: "Not enough space on the target drive" });
    }

    // Create log entry
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
        :reason, 'IN_PROGRESS', CURRENT_TIMESTAMP
      )`,
      {
        logId,
        chunkId: id,
        sourceDriveId: chunk.DRIVE_ID,
        targetDriveId,
        reason: reason || "Manual relocation",
      }
    );

    // Update chunk status
    await database.executeQuery(
      `UPDATE data_chunks 
       SET status = 'REDISTRIBUTING',
           updated_at = CURRENT_TIMESTAMP
       WHERE chunk_id = :id`,
      [id]
    );

    // Update space on drives
    await database.executeQuery(
      `UPDATE drives 
       SET available_space = available_space + :sizeMb,
           updated_at = CURRENT_TIMESTAMP
       WHERE drive_id = :sourceDriveId`,
      { sizeMb: chunk.SIZE_MB, sourceDriveId: chunk.DRIVE_ID }
    );

    await database.executeQuery(
      `UPDATE drives 
       SET available_space = available_space - :sizeMb,
           updated_at = CURRENT_TIMESTAMP
       WHERE drive_id = :targetDriveId`,
      { sizeMb: chunk.SIZE_MB, targetDriveId }
    );

    // Move the chunk to target drive
    await database.executeQuery(
      `UPDATE data_chunks 
       SET drive_id = :targetDriveId,
           status = 'ACTIVE',
           updated_at = CURRENT_TIMESTAMP
       WHERE chunk_id = :id`,
      { targetDriveId, id }
    );

    // Update log entry
    await database.executeQuery(
      `UPDATE redistribution_logs 
       SET status = 'COMPLETED',
           completed_at = CURRENT_TIMESTAMP
       WHERE log_id = :logId`,
      { logId }
    );

    res.json({
      message: "Data chunk relocated successfully",
    });
  } catch (error) {
    next(error);
  }
}
