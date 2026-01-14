import database from "../config/database.js";

// Get dashboard summary data
export async function getDashboardSummary(req, res, next) {
  try {
    // Get system health overview
    const healthResult = await database.executeQuery(`
  SELECT 
    -- Overall system health
    CASE 
      WHEN (SELECT COUNT(*) FROM drives WHERE status IN ('FAILED', 'FAILING')) > 0 THEN 'CRITICAL'
      WHEN (SELECT COUNT(*) FROM drives WHERE status = 'DEGRADED') > 0 THEN 'WARNING'
      WHEN (SELECT COUNT(*) FROM data_chunks WHERE status = 'CORRUPTED') > 0 THEN 'WARNING'
      ELSE 'HEALTHY'
    END as overall_health,
    
    -- Storage utilization as subquery
    (SELECT ROUND(SUM(capacity - available_space) / SUM(capacity) * 100, 2) FROM drives) as storage_utilization,
    
    -- Drive health
    (SELECT COUNT(*) FROM drives WHERE status = 'HEALTHY') as healthy_drives,
    (SELECT COUNT(*) FROM drives WHERE status = 'DEGRADED') as degraded_drives,
    (SELECT COUNT(*) FROM drives WHERE status = 'FAILING') as failing_drives,
    (SELECT COUNT(*) FROM drives WHERE status = 'FAILED') as failed_drives,
    (SELECT COUNT(*) FROM drives WHERE status = 'MAINTENANCE') as maintenance_drives,
    
    -- Capacity metrics
    (SELECT SUM(capacity) / 1024 FROM drives) as total_capacity_gb,
    (SELECT SUM(capacity - available_space) / 1024 FROM drives) as used_capacity_gb
  FROM dual
`);

    // Get data protection stats
    const dataProtectionResult = await database.executeQuery(`
      SELECT 
        COUNT(*) as total_chunks,
        SUM(size_mb) as total_size_mb,
        SUM(CASE WHEN replicated = 1 THEN 1 ELSE 0 END) as protected_chunks,
        SUM(CASE WHEN replicated = 1 THEN size_mb ELSE 0 END) as protected_size_mb,
        ROUND(SUM(CASE WHEN replicated = 1 THEN size_mb ELSE 0 END) * 100.0 / SUM(size_mb), 2) as protection_percentage
      FROM data_chunks
      WHERE status != 'CORRUPTED'
    `);

    // Get recent redistribution events
    const redistributionResult = await database.executeQuery(`
      SELECT 
        r.log_id,
        r.chunk_id,
        c.chunk_name,
        r.source_drive_id,
        r.target_drive_id,
        r.reason,
        r.status,
        r.started_at,
        r.completed_at,
        c.size_mb
      FROM redistribution_logs r
      LEFT JOIN data_chunks c ON r.chunk_id = c.chunk_id
      ORDER BY r.started_at DESC
      FETCH FIRST 5 ROWS ONLY
    `);

    // Get alert conditions
    const alertsResult = await database.executeQuery(`
      SELECT 
        -- Drives at capacity risk
        (SELECT COUNT(*) FROM drives 
         WHERE (capacity - available_space) / capacity * 100 > 90
         AND status = 'HEALTHY') as drives_at_capacity_risk,
         
        -- High error rate drives
        (SELECT COUNT(*) FROM drive_metrics
         WHERE error_rate > 0.05
         AND recorded_at > CURRENT_TIMESTAMP - INTERVAL '24' HOUR) as drives_with_errors,
         
        -- Unprotected high-priority data
        (SELECT COUNT(*) FROM data_chunks
         WHERE priority >= 4
         AND replicated = 0) as unprotected_critical_chunks,
         
        -- Drives with high temperature
        (SELECT COUNT(DISTINCT drive_id) FROM drive_metrics
         WHERE temperature > 65
         AND recorded_at > CURRENT_TIMESTAMP - INTERVAL '6' HOUR) as drives_with_high_temp
      FROM dual
    `);

    // Combine all the data for the dashboard
    const dashboardData = {
      systemHealth: healthResult.rows[0],
      dataProtection: dataProtectionResult.rows[0],
      recentRedistributions: redistributionResult.rows,
      alerts: alertsResult.rows[0],
      timestamp: new Date(),
    };

    res.json(dashboardData);
  } catch (error) {
    next(error);
  }
}

// Get detailed drive allocation analysis
export async function getDriveAllocationAnalysis(req, res, next) {
  try {
    // Get drive details with chunk counts and utilization
    const drivesResult = await database.executeQuery(`
      SELECT 
        d.drive_id,
        d.drive_name,
        d.capacity,
        d.available_space,
        d.status,
        d.drive_type,
        d.is_backup,
        d.location,
        ROUND((d.capacity - d.available_space) / d.capacity * 100, 2) as utilization_percent,
        (SELECT COUNT(*) FROM data_chunks WHERE drive_id = d.drive_id) as chunk_count,
        COALESCE((SELECT SUM(size_mb) FROM data_chunks WHERE drive_id = d.drive_id), 0) as data_size_mb,
        (SELECT COUNT(*) FROM chunk_replicas WHERE drive_id = d.drive_id) as replica_count
      FROM drives d
      ORDER BY utilization_percent DESC
    `);

    // Get chunks by priority distribution
    const priorityResult = await database.executeQuery(`
      SELECT 
        priority,
        COUNT(*) as chunk_count,
        SUM(size_mb) as total_size_mb,
        ROUND(SUM(CASE WHEN replicated = 1 THEN size_mb ELSE 0 END) * 100.0 / NULLIF(SUM(size_mb), 0), 2) as protection_percentage
      FROM data_chunks
      GROUP BY priority
      ORDER BY priority DESC
    `);

    // Get location-based distribution
    const locationResult = await database.executeQuery(`
      SELECT 
        location,
        COUNT(*) as drive_count,
        SUM(capacity) as total_capacity,
        SUM(available_space) as total_available,
        SUM(capacity - available_space) as total_used,
        ROUND(SUM(capacity - available_space) * 100.0 / NULLIF(SUM(capacity), 0), 2) as utilization_percent
      FROM drives
      GROUP BY location
      ORDER BY utilization_percent DESC
    `);

    // Get drive type distribution
    const typeResult = await database.executeQuery(`
      SELECT 
        drive_type,
        COUNT(*) as drive_count,
        SUM(capacity) as total_capacity,
        ROUND(SUM(capacity - available_space) * 100.0 / NULLIF(SUM(capacity), 0), 2) as utilization_percent,
        ROUND(SUM(capacity) * 100.0 / (SELECT SUM(capacity) FROM drives), 2) as capacity_percentage
      FROM drives
      GROUP BY drive_type
    `);

    const analysisData = {
      drives: drivesResult.rows,
      priorityDistribution: priorityResult.rows,
      locationDistribution: locationResult.rows,
      driveTypeDistribution: typeResult.rows,
    };

    res.json(analysisData);
  } catch (error) {
    next(error);
  }
}

// Get event history with timeline
export async function getEventTimeline(req, res, next) {
  try {
    // Get the limit from query params or default to 20
    const limit = parseInt(req.query.limit) || 20;

    // Unified query to get timeline of interesting events
    const result = await database.executeQuery(`
      SELECT * FROM (
        -- Redistribution events
        SELECT 
          r.log_id as event_id,
          'REDISTRIBUTION' as event_type,
          CASE r.status
            WHEN 'COMPLETED' THEN 'Chunk ' || SUBSTR(r.chunk_id, 1, 15) || '... redistributed'
            WHEN 'FAILED' THEN 'Redistribution failed for chunk ' || SUBSTR(r.chunk_id, 1, 10)
            WHEN 'IN_PROGRESS' THEN 'Redistributing chunk ' || SUBSTR(r.chunk_id, 1, 12)
          END as event_description,
          r.reason as event_reason,
          r.started_at as event_time,
          r.status as event_status,
          r.chunk_id as related_id,
          r.source_drive_id || ' → ' || r.target_drive_id as event_details
        FROM redistribution_logs r
        
        UNION ALL
        
        -- Drive status changes (from metrics data)
        SELECT 
          'DRIVE-STATUS-' || TO_CHAR(m.recorded_at, 'YYYYMMDDHH24MISS') || '-' || d.drive_id as event_id,
          'DRIVE_STATUS' as event_type,
          'Drive ' || d.drive_name || ' status: ' || d.status as event_description,
          CASE 
            WHEN m.error_rate > 0.1 THEN 'High error rate: ' || TO_CHAR(m.error_rate)
            WHEN m.temperature > 75 THEN 'High temperature: ' || TO_CHAR(m.temperature) || '°C'
            WHEN m.utilization_percent > 90 THEN 'High utilization: ' || TO_CHAR(m.utilization_percent) || '%'
            ELSE 'Status update'
          END as event_reason,
          m.recorded_at as event_time,
          d.status as event_status,
          d.drive_id as related_id,
          'CPU: ' || TO_CHAR(m.cpu_usage) || '%, IO: ' || TO_CHAR(m.io_throughput) || ', Temp: ' || TO_CHAR(m.temperature) as event_details
        FROM drives d
        JOIN drive_metrics m ON d.drive_id = m.drive_id
        WHERE d.status IN ('DEGRADED', 'FAILING', 'FAILED', 'MAINTENANCE')
        AND m.recorded_at = (
          SELECT MAX(recorded_at) 
          FROM drive_metrics 
          WHERE drive_id = d.drive_id
        )
        
        UNION ALL
        
        -- Chunk status changes
        SELECT 
          'CHUNK-STATUS-' || c.chunk_id as event_id,
          'CHUNK_STATUS' as event_type,
          'Chunk ' || c.chunk_name || ' status: ' || c.status as event_description,
          'Data integrity check' as event_reason,
          c.updated_at as event_time,
          c.status as event_status,
          c.chunk_id as related_id,
          'Size: ' || TO_CHAR(c.size_mb) || ' MB, Priority: ' || TO_CHAR(c.priority) as event_details
        FROM data_chunks c
        WHERE c.status = 'CORRUPTED'
      )
      ORDER BY event_time DESC
      FETCH FIRST ${limit} ROWS ONLY
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

// Get recommendations for optimization
export async function getOptimizationRecommendations(req, res, next) {
  try {
    // Get drives that would benefit from rebalancing
    const overloadedDrivesResult = await database.executeQuery(`
      SELECT 
        d.drive_id,
        d.drive_name,
        d.capacity,
        d.available_space,
        ROUND((d.capacity - d.available_space) / d.capacity * 100, 2) as utilization_percent,
        (SELECT COUNT(*) FROM data_chunks WHERE drive_id = d.drive_id) as chunk_count
      FROM drives d
      WHERE d.status = 'HEALTHY'
      AND (d.capacity - d.available_space) / d.capacity * 100 > 
          (SELECT rebalance_threshold FROM distribution_policies WHERE active = 1 AND ROWNUM = 1)
      ORDER BY utilization_percent DESC
    `);

    // Get unprotected high priority chunks
    const unprotectedResult = await database.executeQuery(`
      SELECT 
        c.chunk_id,
        c.chunk_name,
        c.size_mb,
        c.priority,
        d.drive_name,
        d.status as drive_status
      FROM data_chunks c
      JOIN drives d ON c.drive_id = d.drive_id
      WHERE c.priority >= 4
      AND c.replicated = 0
      AND c.status = 'ACTIVE'
      ORDER BY c.priority DESC, c.size_mb DESC
    `);

    // Get underutilized drives
    const underutilizedDrivesResult = await database.executeQuery(`
      SELECT 
        d.drive_id,
        d.drive_name,
        d.capacity,
        d.available_space,
        ROUND((d.capacity - d.available_space) / d.capacity * 100, 2) as utilization_percent,
        (SELECT COUNT(*) FROM data_chunks WHERE drive_id = d.drive_id) as chunk_count
      FROM drives d
      WHERE d.status = 'HEALTHY'
      AND (d.capacity - d.available_space) / d.capacity * 100 < 30
      AND d.is_backup = 0
      ORDER BY utilization_percent ASC
    `);

    // Generate recommendations
    const recommendations = [];

    if (overloadedDrivesResult.rows.length > 0) {
      recommendations.push({
        type: "REBALANCE",
        priority: "HIGH",
        description: "Rebalance data from overloaded drives",
        reason: `${overloadedDrivesResult.rows.length} drives are over the utilization threshold`,
        affected_items: overloadedDrivesResult.rows,
      });
    }

    if (unprotectedResult.rows.length > 0) {
      recommendations.push({
        type: "PROTECT",
        priority: "HIGH",
        description: "Create replicas for high-priority unprotected data",
        reason: `${unprotectedResult.rows.length} high-priority chunks have no replicas`,
        affected_items: unprotectedResult.rows,
      });
    }

    if (underutilizedDrivesResult.rows.length > 0) {
      recommendations.push({
        type: "CONSOLIDATE",
        priority: "MEDIUM",
        description: "Consolidate data to reduce underutilized drives",
        reason: `${underutilizedDrivesResult.rows.length} drives are significantly underutilized`,
        affected_items: underutilizedDrivesResult.rows,
      });
    }

    // Look for location imbalances
    const locationImbalanceResult = await database.executeQuery(`
      SELECT 
        location,
        ROUND(SUM(capacity - available_space) * 100.0 / NULLIF(SUM(capacity), 0), 2) as utilization_percent
      FROM drives
      GROUP BY location
      HAVING ROUND(SUM(capacity - available_space) * 100.0 / NULLIF(SUM(capacity), 0), 2) > 75
      OR ROUND(SUM(capacity - available_space) * 100.0 / NULLIF(SUM(capacity), 0), 2) < 25
    `);

    if (locationImbalanceResult.rows.length > 0) {
      recommendations.push({
        type: "LOCATION_BALANCE",
        priority: "MEDIUM",
        description: "Balance data across different locations",
        reason: "Data distribution across locations is imbalanced",
        affected_items: locationImbalanceResult.rows,
      });
    }

    res.json({
      recommendations,
      timestamp: new Date(),
    });
  } catch (error) {
    next(error);
  }
}
