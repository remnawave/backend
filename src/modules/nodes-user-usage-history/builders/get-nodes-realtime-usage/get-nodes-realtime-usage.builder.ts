import { Prisma } from '@generated/prisma/client';

export class GetNodesRealtimeUsageBuilder {
    public query: Prisma.Sql;

    constructor() {
        this.query = this.getQuery();
        return this;
    }

    public getQuery(): Prisma.Sql {
        return Prisma.sql`
WITH nodes_latest_updates AS (
    SELECT 
        node_uuid,
        SUM(download_bytes) AS current_download_bytes,
        SUM(upload_bytes) AS current_upload_bytes,
        SUM(total_bytes) AS current_total_bytes,
        MAX(updated_at) AS latest_update_time
    FROM 
        nodes_usage_history
    WHERE 
        created_at = date_trunc('hour', NOW())
    GROUP BY 
        node_uuid
),
nodes_info AS (
    SELECT
        uuid,
        name,
        address,
        country_code
    FROM
        nodes
)
SELECT
    n.uuid AS "nodeUuid",
    n.name AS "nodeName",
    n.country_code AS "countryCode",
    l.current_download_bytes AS "downloadBytes",
    l.current_upload_bytes AS "uploadBytes",
    l.current_total_bytes AS "totalBytes",
    COALESCE(
        CAST(
            l.current_download_bytes / 
            NULLIF(EXTRACT(EPOCH FROM (l.latest_update_time - date_trunc('hour', l.latest_update_time))), 0)
            AS BIGINT
        ),
        0
    ) AS "downloadSpeedBps",
    COALESCE(
        CAST(
            l.current_upload_bytes / 
            NULLIF(EXTRACT(EPOCH FROM (l.latest_update_time - date_trunc('hour', l.latest_update_time))), 0)
            AS BIGINT
        ),
        0
    ) AS "uploadSpeedBps",
    COALESCE(
        CAST(
            l.current_total_bytes / 
            NULLIF(EXTRACT(EPOCH FROM (l.latest_update_time - date_trunc('hour', l.latest_update_time))), 0)
            AS BIGINT
        ),
        0
    ) AS "totalSpeedBps"
FROM
    nodes_latest_updates l
    JOIN nodes_info n ON l.node_uuid = n.uuid
ORDER BY
    "totalSpeedBps" DESC;
    `;
    }
}
