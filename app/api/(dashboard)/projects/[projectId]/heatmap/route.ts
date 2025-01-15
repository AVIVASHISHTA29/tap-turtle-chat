import clickhouse from "@/lib/clickhouse";
import { NextResponse } from "next/server";

const getHeatmapData = async (projectId: string) => {
  if (!projectId) {
    throw new Error("Project ID is required");
  }

  // This query will:
  // 1. Filter mouse movement events
  // 2. Group data points into grid cells (10px squares) for optimization
  // 3. Count events in each cell as intensity
  const query = `
    WITH grouped_positions AS (
      SELECT 
        round(x_position/2)*2 as grid_x,
        round(y_position/2)*2 as grid_y,
        count(*) as point_count
      FROM events
      WHERE project_id = {project_id: UUID}
        AND event_type = 3  -- mousemove events
        AND x_position IS NOT NULL 
        AND y_position IS NOT NULL
      GROUP BY grid_x, grid_y
    )
    SELECT
      grid_x as x,
      grid_y as y,
      point_count as intensity
    FROM grouped_positions
    ORDER BY intensity DESC
    LIMIT 10000  -- Limit to prevent overwhelming the frontend
  `;

  try {
    const result = await clickhouse.query({
      query,
      query_params: {
        project_id: projectId,
      },
    });

    const data = await result.json();
    return data.data || [];
  } catch (error) {
    console.error("ClickHouse query error:", error);
    throw new Error("Failed to fetch heatmap data from database");
  }
};

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    if (!params?.projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const heatmapData = await getHeatmapData(params.projectId);
    return NextResponse.json(heatmapData);
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    return NextResponse.json(
      { error: "Failed to fetch heatmap data" },
      { status: 500 }
    );
  }
}
