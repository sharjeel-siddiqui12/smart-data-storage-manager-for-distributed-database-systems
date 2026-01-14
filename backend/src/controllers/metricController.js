import database from '../config/database.js';

// Get system overview metrics
export async function getSystemMetrics(req, res, next) {
  try {
    // Get drives summary
    const drivesResult = await database.executeQuery(`
      SELECT 
        COUNT(*) as total_drives,
        SUM(capacity) as total_capacity,
        SUM(available_space) as total_available_space,
        SUM(capacity - available_space) as total_used_space,
        ROUND(SUM(capacity - available_space) / SUM(capacity) * 100, 2) as utilization_percent,
        SUM(CASE WHEN status = 'HEALTHY' THEN 1 ELSE 0 END) as healthy_drives,
        SUM(CASE WHEN status = 'DEGRADED' THEN 1 ELSE 0 END) as degraded_drives,
        SUM(CASE WHEN status = 'FAILING' THEN 1 ELSE 0 END) as failing_drives,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_drives,
        SUM(CASE WHEN status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance_drives
      FROM drives
    `);
    
    // Get data chunks summary
    const chunksResult = await database.executeQuery(`
      SELECT 
        COUNT(*) as total_chunks,
        SUM(size_mb) as total_size,
        COUNT(DISTINCT drive_id) as drives_with_data,
        SUM(CASE WHEN replicated = 1 THEN 1 ELSE 0 END) as replicated_chunks,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_chunks,
        SUM(CASE WHEN status = 'REDISTRIBUTING' THEN 1 ELSE 0 END) as redistributing_chunks,
        SUM(CASE WHEN status = 'CORRUPTED' THEN 1 ELSE 0 END) as corrupted_chunks
      FROM data_chunks
    `);
    
    // Get replicas summary
    const replicasResult = await database.executeQuery(`
      SELECT 
        COUNT(*) as total_replicas,
        COUNT(DISTINCT chunk_id) as chunks_with_replicas,
        COUNT(DISTINCT drive_id) as drives_with_replicas,
        SUM(CASE WHEN status = 'HEALTHY' THEN 1 ELSE 0 END) as healthy_replicas,
        SUM(CASE WHEN status != 'HEALTHY' THEN 1 ELSE 0 END) as problem_replicas
      FROM chunk_replicas
    `);
    
    // Get redistribution history
    const redistributionResult = await database.executeQuery(`
      SELECT 
        COUNT(*) as total_redistributions,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_redistributions,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_redistributions,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as ongoing_redistributions
      FROM redistribution_logs
    `);
    
    // Get policy info
    const policyResult = await database.executeQuery(`
      SELECT policy_name, min_replicas, rebalance_threshold
      FROM distribution_policies 
      WHERE active = 1
    `);
    
    res.json({
      timestamp: new Date(),
      drives: drivesResult.rows[0],
      chunks: chunksResult.rows[0],
      replicas: replicasResult.rows[0],
      redistributions: redistributionResult.rows[0],
      policy: policyResult.rows.length > 0 ? policyResult.rows[0] : null
    });
  } catch (error) {
    next(error);
  }
}

// Get performance metrics for all drives
export async function getDrivePerformanceMetrics(req, res, next) {
  try {
    // Get time range from query params or use default (last 24 hours)
    const hours = parseInt(req.query.hours) || 24;
    
    const result = await database.executeQuery(`
      SELECT 
        d.drive_id,
        d.drive_name,
        d.status,
        m.recorded_at,
        m.cpu_usage,
        m.io_throughput,
        m.response_time,
        m.error_rate,
        m.temperature,
        m.utilization_percent
      FROM drive_metrics m
      JOIN drives d ON m.drive_id = d.drive_id
      WHERE m.recorded_at >= CURRENT_TIMESTAMP - INTERVAL '${hours}' HOUR
      ORDER BY m.recorded_at DESC
    `);
    
    // Group metrics by drive
    const driveMetrics = {};
    
    for (const row of result.rows) {
      if (!driveMetrics[row.DRIVE_ID]) {
        driveMetrics[row.DRIVE_ID] = {
          drive_id: row.DRIVE_ID,
          drive_name: row.DRIVE_NAME,
          status: row.STATUS,
          metrics: []
        };
      }
      
      driveMetrics[row.DRIVE_ID].metrics.push({
        recorded_at: row.RECORDED_AT,
        cpu_usage: row.CPU_USAGE,
        io_throughput: row.IO_THROUGHPUT,
        response_time: row.RESPONSE_TIME,
        error_rate: row.ERROR_RATE,
        temperature: row.TEMPERATURE,
        utilization_percent: row.UTILIZATION_PERCENT
      });
    }
    
    res.json(Object.values(driveMetrics));
  } catch (error) {
    next(error);
  }
}

// Get redistribution history
export async function getRedistributionHistory(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    const result = await database.executeQuery(`
      SELECT 
        r.log_id,
        r.chunk_id,
        c.chunk_name,
        r.source_drive_id,
        sd.drive_name as source_drive_name,
        r.target_drive_id,
        td.drive_name as target_drive_name,
        r.reason,
        r.status,
        r.started_at,
        r.completed_at,
        c.size_mb
      FROM redistribution_logs r
      LEFT JOIN data_chunks c ON r.chunk_id = c.chunk_id
      LEFT JOIN drives sd ON r.source_drive_id = sd.drive_id
      LEFT JOIN drives td ON r.target_drive_id = td.drive_id
      ORDER BY r.started_at DESC
      FETCH FIRST ${limit} ROWS ONLY
    `);
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

// Record new drive metric
export async function recordDriveMetric(req, res, next) {
  try {
    const { driveId, cpuUsage, ioThroughput, responseTime, errorRate, temperature, utilizationPercent } = req.body;
    
    if (!driveId) {
      return res.status(400).json({ error: 'Drive ID is required' });
    }
    
    // Check if drive exists
    const driveCheck = await database.executeQuery(
      `SELECT drive_id FROM drives WHERE drive_id = :driveId`,
      [driveId]
    );
    
    if (driveCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Drive not found' });
    }
    
    // Generate metric ID
    const metricId = `METRIC-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    
    await database.executeQuery(
      `INSERT INTO drive_metrics (
        metric_id, drive_id, cpu_usage, io_throughput,
        response_time, error_rate, temperature, utilization_percent
      ) VALUES (
        :metricId, :driveId, :cpuUsage, :ioThroughput,
        :responseTime, :errorRate, :temperature, :utilizationPercent
      )`,
      {
        metricId,
        driveId,
        cpuUsage,
        ioThroughput,
        responseTime,
        errorRate,
        temperature,
        utilizationPercent
      }
    );
    
    // Check if drive needs status update (e.g., failing if high error rate or temperature)
    if (errorRate > 0.05 || temperature > 75) {
      await database.executeQuery(
        `UPDATE drives SET status = 'DEGRADED', updated_at = CURRENT_TIMESTAMP
         WHERE drive_id = :driveId AND status = 'HEALTHY'`,
        [driveId]
      );
    }
    else if (errorRate > 0.1 || temperature > 85) {
      await database.executeQuery(
        `UPDATE drives SET status = 'FAILING', updated_at = CURRENT_TIMESTAMP
         WHERE drive_id = :driveId AND status IN ('HEALTHY', 'DEGRADED')`,
        [driveId]
      );
    }
    
    res.status(201).json({
      message: 'Drive metric recorded successfully',
      metricId
    });
  } catch (error) {
    next(error);
  }
}

// Get system health overview
export async function getSystemHealth(req, res, next) {
  try {
    // Get critical metrics
    const healthResult = await database.executeQuery(`
      SELECT 
        -- Overall system health
        CASE 
          WHEN (SELECT COUNT(*) FROM drives WHERE status IN ('FAILED', 'FAILING')) > 0 THEN 'CRITICAL'
          WHEN (SELECT COUNT(*) FROM drives WHERE status = 'DEGRADED') > 0 THEN 'WARNING'
          WHEN (SELECT COUNT(*) FROM data_chunks WHERE status = 'CORRUPTED') > 0 THEN 'WARNING'
          ELSE 'HEALTHY'
        END as overall_health,
        
        -- Highest risk factors
        (SELECT COUNT(*) FROM drives WHERE status = 'FAILING' OR status = 'FAILED') as failing_drives_count,
        (SELECT COUNT(*) FROM data_chunks WHERE status = 'CORRUPTED') as corrupted_chunks_count,
        
        -- Data protection status
        ROUND(
          (SELECT COUNT(*) FROM data_chunks WHERE replicated = 1) * 100.0 / 
          NULLIF((SELECT COUNT(*) FROM data_chunks), 0),
          2
        ) as data_protection_percentage,
        
        -- Storage capacity concerns
        (SELECT COUNT(*) FROM drives 
         WHERE (capacity - available_space) / capacity * 100 > 90 
         AND status != 'FAILED') as nearly_full_drives_count,
        
        -- Ongoing operations
        (SELECT COUNT(*) FROM redistribution_logs WHERE status = 'IN_PROGRESS') as ongoing_operations
      FROM dual
    `);
    
    // Get at-risk data chunks
    const atRiskChunksResult = await database.executeQuery(`
      SELECT c.chunk_id, c.chunk_name, c.size_mb, c.status, d.drive_name, d.status as drive_status
      FROM data_chunks c
      JOIN drives d ON c.drive_id = d.drive_id
      WHERE d.status IN ('FAILING', 'DEGRADED') OR c.status = 'CORRUPTED'
      FETCH FIRST 10 ROWS ONLY
    `);
    
    res.json({
      status: healthResult.rows[0],
      at_risk_chunks: atRiskChunksResult.rows
    });
  } catch (error) {
    next(error);
  }
}