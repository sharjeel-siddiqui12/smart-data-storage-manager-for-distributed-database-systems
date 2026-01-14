import database from "../config/database.js";

// Get all distribution policies
export async function getAllPolicies(req, res, next) {
  try {
    const result = await database.executeQuery(
      `SELECT * FROM distribution_policies ORDER BY policy_name`
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

// Get a single policy by ID
export async function getPolicyById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await database.executeQuery(
      `SELECT * FROM distribution_policies WHERE policy_id = :id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Create a new policy
export async function createPolicy(req, res, next) {
  try {
    const {
      policyName,
      minReplicas,
      rebalanceThreshold,
      priorityBasedPlacement,
      localityAware,
    } = req.body;

    // Validate required fields
    if (!policyName) {
      return res.status(400).json({ error: "Policy name is required" });
    }

    // Generate policy ID
    const policyId = `POLICY-${String(
      Math.floor(Math.random() * 1000000)
    ).padStart(6, "0")}`;

    await database.executeQuery(
      `INSERT INTO distribution_policies (
        policy_id, policy_name, min_replicas, rebalance_threshold, 
        priority_based_placement, locality_aware, active
      ) VALUES (
        :policyId, :policyName, :minReplicas, :rebalanceThreshold,
        :priorityBasedPlacement, :localityAware, 0
      )`,
      {
        policyId,
        policyName,
        minReplicas: minReplicas || 2,
        rebalanceThreshold: rebalanceThreshold || 75,
        priorityBasedPlacement: priorityBasedPlacement ? 1 : 0,
        localityAware: localityAware ? 1 : 0,
      }
    );

    res.status(201).json({
      message: "Distribution policy created successfully",
      policyId,
    });
  } catch (error) {
    next(error);
  }
}

// Update a policy
export async function updatePolicy(req, res, next) {
  try {
    const { id } = req.params;
    const {
      policyName,
      minReplicas,
      rebalanceThreshold,
      priorityBasedPlacement,
      localityAware,
      active,
    } = req.body;

    // Check if policy exists and get current values
    const checkResult = await database.executeQuery(
      `SELECT * FROM distribution_policies WHERE policy_id = :id`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }

    const currentPolicy = checkResult.rows[0];

    // If setting this policy to active, deactivate all others
    if (active) {
      await database.executeQuery(
        `UPDATE distribution_policies SET active = 0 WHERE policy_id != :id`,
        [id]
      );
    }

    // Update the policy with fallback to existing values
    await database.executeQuery(
      `UPDATE distribution_policies SET
        policy_name = :policyName,
        min_replicas = :minReplicas,
        rebalance_threshold = :rebalanceThreshold,
        priority_based_placement = :priorityBasedPlacement,
        locality_aware = :localityAware,
        active = :active,
        updated_at = CURRENT_TIMESTAMP
      WHERE policy_id = :id`,
      {
        policyName:
          policyName !== undefined ? policyName : currentPolicy.POLICY_NAME,
        minReplicas:
          minReplicas !== undefined ? minReplicas : currentPolicy.MIN_REPLICAS,
        rebalanceThreshold:
          rebalanceThreshold !== undefined
            ? rebalanceThreshold
            : currentPolicy.REBALANCE_THRESHOLD,
        priorityBasedPlacement:
          priorityBasedPlacement !== undefined
            ? priorityBasedPlacement
              ? 1
              : 0
            : currentPolicy.PRIORITY_BASED_PLACEMENT,
        localityAware:
          localityAware !== undefined
            ? localityAware
              ? 1
              : 0
            : currentPolicy.LOCALITY_AWARE,
        active: active !== undefined ? (active ? 1 : 0) : currentPolicy.ACTIVE,
        id,
      }
    );

    res.json({
      message: "Distribution policy updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

// Delete a policy
export async function deletePolicy(req, res, next) {
  try {
    const { id } = req.params;

    // Check if policy is active
    const activeResult = await database.executeQuery(
      `SELECT active FROM distribution_policies WHERE policy_id = :id`,
      [id]
    );

    if (activeResult.rows.length === 0) {
      return res.status(404).json({ error: "Policy not found" });
    }

    if (activeResult.rows[0].ACTIVE === 1) {
      return res.status(400).json({ error: "Cannot delete an active policy" });
    }

    // Delete the policy
    await database.executeQuery(
      `DELETE FROM distribution_policies WHERE policy_id = :id`,
      [id]
    );

    res.json({
      message: "Distribution policy deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

// Apply rebalancing based on current policy
// Apply rebalancing based on current policy
// Apply rebalancing based on current policy
export async function triggerRebalancing(req, res, next) {
  try {
    // Get active policy
    const policyResult = await database.executeQuery(
      `SELECT * FROM distribution_policies WHERE active = 1`
    );

    if (policyResult.rows.length > 0) {
      const activePolicy = policyResult.rows[0];
      const minReplicas = activePolicy.MIN_REPLICAS;

      // Find chunks with fewer replicas than the minimum
      const insufficientReplicasResult = await database.executeQuery(
        `SELECT c.chunk_id, c.drive_id, c.size_mb, 
                COUNT(r.replica_id) as replica_count
         FROM data_chunks c
         LEFT JOIN chunk_replicas r ON c.chunk_id = r.chunk_id
         WHERE c.status = 'ACTIVE'
         GROUP BY c.chunk_id, c.drive_id, c.size_mb
         HAVING COUNT(r.replica_id) < :minReplicas`,
        [minReplicas]
      );

      // Check for available backup drives and collect chunks needing replicas
      const chunksNeedingReplicas = [];
      for (const chunk of insufficientReplicasResult.rows) {
        const currentReplicas = chunk.REPLICA_COUNT;
        const neededReplicas = minReplicas - currentReplicas;

        if (neededReplicas > 0) {
          // Get list of drives already used for this chunk (original + replicas)
          const usedDrivesResult = await database.executeQuery(
            `SELECT d.drive_id 
             FROM drives d
             WHERE d.drive_id = :originalDriveId
             UNION
             SELECT r.drive_id
             FROM chunk_replicas r
             WHERE r.chunk_id = :chunkId`,
            {
              originalDriveId: chunk.DRIVE_ID,
              chunkId: chunk.CHUNK_ID,
            }
          );

          const usedDriveIds = usedDrivesResult.rows.map((row) => row.DRIVE_ID);

          // Get available backup drives
          const backupDrivesResult = await database.executeQuery(
            `SELECT drive_id FROM drives 
             WHERE is_backup = 1
             AND status = 'HEALTHY'
             AND available_space >= :sizeMb
             AND drive_id NOT IN (${usedDriveIds
               .map((_, idx) => `:drive${idx}`)
               .join(",")})`,
            {
              sizeMb: chunk.SIZE_MB,
              ...usedDriveIds.reduce((acc, driveId, idx) => {
                acc[`drive${idx}`] = driveId;
                return acc;
              }, {}),
            }
          );

          const availableBackupDrives = backupDrivesResult.rows;

          chunksNeedingReplicas.push({
            chunk: chunk,
            neededReplicas,
            availableBackupDrives: availableBackupDrives.length,
            usedDriveIds,
          });
        }
      }

      // Create replicas where backup drives are available
      let replicasCreated = 0;
      for (const item of chunksNeedingReplicas) {
        // Create up to the available backup drives or needed replicas, whichever is less
        const replicasToCreate = Math.min(
          item.neededReplicas,
          item.availableBackupDrives
        );

        if (replicasToCreate > 0) {
          const usedDriveIds = item.usedDriveIds;

          // Get specific backup drives to use
          const backupDrivesResult = await database.executeQuery(
            `SELECT drive_id FROM drives 
             WHERE is_backup = 1
             AND status = 'HEALTHY'
             AND available_space >= :sizeMb
             AND drive_id NOT IN (${usedDriveIds
               .map((_, idx) => `:drive${idx}`)
               .join(",")})
             ORDER BY (capacity - available_space) / capacity * 100 ASC
             FETCH FIRST ${replicasToCreate} ROWS ONLY`,
            {
              sizeMb: item.chunk.SIZE_MB,
              ...usedDriveIds.reduce((acc, driveId, idx) => {
                acc[`drive${idx}`] = driveId;
                return acc;
              }, {}),
            }
          );

          for (const drive of backupDrivesResult.rows) {
            const targetDriveId = drive.DRIVE_ID;

            // Create replica ID
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
                chunkId: item.chunk.CHUNK_ID,
                driveId: targetDriveId,
              }
            );

            // Update drive available space
            await database.executeQuery(
              `UPDATE drives 
               SET available_space = available_space - :sizeMb,
                   updated_at = CURRENT_TIMESTAMP
               WHERE drive_id = :driveId`,
              {
                sizeMb: item.chunk.SIZE_MB,
                driveId: targetDriveId,
              }
            );

            // Update chunk replicated status
            await database.executeQuery(
              `UPDATE data_chunks 
               SET replicated = 1,
                   updated_at = CURRENT_TIMESTAMP
               WHERE chunk_id = :chunkId`,
              {
                chunkId: item.chunk.CHUNK_ID,
              }
            );

            replicasCreated++;
            usedDriveIds.push(targetDriveId);
          }
        }
      }
    }

    // Call regular rebalance procedure (for other aspects of rebalancing)
    await database.executeQuery(`BEGIN rebalance_data_distribution; END;`);

    res.json({
      message: "Rebalancing operation initiated successfully",
    });
  } catch (error) {
    next(error);
  }
}

// Get active policy
export async function getActivePolicy(req, res, next) {
  try {
    const result = await database.executeQuery(
      `SELECT * FROM distribution_policies WHERE active = 1`
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No active policy found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}
