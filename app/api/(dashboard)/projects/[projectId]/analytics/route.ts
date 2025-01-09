/* eslint-disable @typescript-eslint/no-explicit-any */
import clickhouse from "@/lib/clickhouse";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

interface RecordingStats {
  total_recordings: string;
  avg_duration: string;
  total_interactions: string;
  duration_distribution: Array<[string, string]>;
}

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { projectId } = params;

    // Verify user has access to this project
    const accessResult = await clickhouse.query({
      query: `
        SELECT 1 FROM user_projects
        WHERE user_id = {userId:String}
        AND project_id = {projectId:String}
        LIMIT 1
      `,
      query_params: {
        userId,
        projectId,
      },
      format: "JSONEachRow",
    });

    const accessData = await accessResult.json();
    if (!accessData.length) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get total events count by type
    const eventsResult = await clickhouse.query({
      query: `
        SELECT 
          event_type,
          count(*) as count
        FROM events
        WHERE project_id = {projectId:String}
        GROUP BY event_type
      `,
      query_params: {
        projectId,
      },
      format: "JSONEachRow",
    });

    // Get events over time (last 7 days) with hourly breakdown
    const timeSeriesResult = await clickhouse.query({
      query: `
        SELECT 
          toStartOfHour(timestamp) as hour,
          event_type,
          count(*) as count
        FROM events
        WHERE project_id = {projectId:String}
        AND timestamp >= now() - INTERVAL 7 DAY
        GROUP BY hour, event_type
        ORDER BY hour
      `,
      query_params: {
        projectId,
      },
      format: "JSONEachRow",
    });

    // Get most clicked elements with their paths
    const clicksResult = await clickhouse.query({
      query: `
        SELECT 
          css_selector,
          count(*) as count,
          any(metadata) as last_metadata
        FROM events
        WHERE project_id = {projectId:String}
        AND event_type = 'click'
        AND css_selector IS NOT NULL
        GROUP BY css_selector
        ORDER BY count DESC
        LIMIT 10
      `,
      query_params: {
        projectId,
      },
      format: "JSONEachRow",
    });

    // Get session statistics with browser info
    const sessionResult = await clickhouse.query({
      query: `
        SELECT
          count(*) as total_sessions,
          avg(viewport_width) as avg_viewport_width,
          avg(viewport_height) as avg_viewport_height,
          countIf(timestamp_start >= now() - INTERVAL 24 HOUR) as sessions_last_24h,
          countIf(timestamp_start >= now() - INTERVAL 7 DAY) as sessions_last_7d
        FROM sessions
        WHERE project_id = {projectId:String}
      `,
      query_params: {
        projectId,
      },
      format: "JSONEachRow",
    });

    // Get browser distribution
    const browserResult = await clickhouse.query({
      query: `
        SELECT
          multiIf(
            position(lower(user_agent), 'chrome') > 0, 'Chrome',
            position(lower(user_agent), 'firefox') > 0, 'Firefox',
            position(lower(user_agent), 'safari') > 0, 'Safari',
            position(lower(user_agent), 'edge') > 0, 'Edge',
            'Other'
          ) as browser,
          count(*) as count
        FROM recording_sessions
        WHERE project_id = {projectId:String}
        AND user_agent IS NOT NULL
        GROUP BY browser
        HAVING count > 0
        ORDER BY count DESC
      `,
      query_params: {
        projectId,
      },
      format: "JSONEachRow",
    });

    // Get page views by URL with engagement metrics
    const pageViewsResult = await clickhouse.query({
      query: `
        SELECT 
          page_url,
          count(*) as views,
          avg(duration_seconds) as avg_duration,
          count(DISTINCT referrer) as unique_visitors
        FROM (
          SELECT 
            page_url,
            referrer,
            dateDiff('second', min(start_timestamp), max(end_timestamp)) as duration_seconds
          FROM recording_sessions
          WHERE project_id = {projectId:String}
          GROUP BY session_id, page_url, referrer
        )
        GROUP BY page_url
        ORDER BY views DESC
        LIMIT 10
      `,
      query_params: {
        projectId,
      },
      format: "JSONEachRow",
    });

    // Get hourly activity patterns
    const hourlyPatternResult = await clickhouse.query({
      query: `
        SELECT 
          toHour(timestamp) as hour,
          count(*) as count
        FROM events
        WHERE project_id = {projectId:String}
        AND timestamp >= now() - INTERVAL 7 DAY
        GROUP BY hour
        ORDER BY hour
      `,
      query_params: {
        projectId,
      },
      format: "JSONEachRow",
    });

    // Get recording analytics
    const recordingAnalyticsResult = await clickhouse.query({
      query: `
        WITH 
          recording_durations AS (
            SELECT
              session_id,
              dateDiff('second', min(start_timestamp), max(coalesce(end_timestamp, now()))) as duration
            FROM recording_sessions
            WHERE project_id = {projectId:String}
            GROUP BY session_id
          ),
          duration_ranges AS (
            SELECT
              multiIf(
                duration < 60, '< 1 min',
                duration < 300, '1-5 mins',
                duration < 900, '5-15 mins',
                duration < 1800, '15-30 mins',
                '> 30 mins'
              ) as duration_range,
              count(*) as count
            FROM recording_durations
            GROUP BY duration_range
            ORDER BY 
              multiIf(
                duration_range = '< 1 min', 1,
                duration_range = '1-5 mins', 2,
                duration_range = '5-15 mins', 3,
                duration_range = '15-30 mins', 4,
                5
              )
          ),
          interaction_stats AS (
            SELECT
              rs.session_id,
              count(re.event_id) as interaction_count
            FROM recording_sessions rs
            LEFT JOIN recording_events re ON rs.session_id = re.session_id
            WHERE rs.project_id = {projectId:String}
            AND re.event_type = 3  -- interaction events
            GROUP BY rs.session_id
          ),
          duration_stats AS (
            SELECT
              count(DISTINCT rs.session_id) as total_recordings,
              avg(rd.duration) as avg_duration,
              sum(is.interaction_count) as total_interactions
            FROM recording_sessions rs
            LEFT JOIN recording_durations rd ON rs.session_id = rd.session_id
            LEFT JOIN interaction_stats is ON rs.session_id = is.session_id
            WHERE rs.project_id = {projectId:String}
          )
        SELECT
          ds.*,
          arrayMap(x -> tuple(x.1, x.2), 
            arraySort(x -> multiIf(
              x.1 = '< 1 min', 1,
              x.1 = '1-5 mins', 2,
              x.1 = '5-15 mins', 3,
              x.1 = '15-30 mins', 4,
              5
            ), groupArray((duration_range, count)))
          ) as duration_distribution
        FROM duration_stats ds
        CROSS JOIN duration_ranges
        GROUP BY 
          ds.total_recordings,
          ds.avg_duration,
          ds.total_interactions
      `,
      query_params: {
        projectId,
      },
      format: "JSONEachRow",
    });

    const [
      events,
      timeSeries,
      clicks,
      sessions,
      browsers,
      pageViews,
      hourlyPattern,
      recordingAnalytics,
    ] = await Promise.all([
      eventsResult.json(),
      timeSeriesResult.json(),
      clicksResult.json(),
      sessionResult.json(),
      browserResult.json(),
      pageViewsResult.json(),
      hourlyPatternResult.json(),
      recordingAnalyticsResult.json(),
    ]);

    console.log("Browser data from DB:", browsers);

    // Process recording analytics
    const recordingStats = (recordingAnalytics[0] || {
      total_recordings: "0",
      avg_duration: "0",
      total_interactions: "0",
      duration_distribution: [],
    }) as RecordingStats;

    // Convert duration distribution array to proper format
    const durationDistribution =
      recordingStats.duration_distribution?.map(([range, count]) => ({
        duration_range: range,
        count: Number(count),
      })) || [];

    return NextResponse.json({
      events,
      timeSeries,
      clicks,
      sessions: sessions[0],
      browsers: browsers.map((b: any) => ({
        browser: b.browser,
        count: Number(b.count),
      })),
      pageViews,
      hourlyPattern,
      recordings: {
        total: Number(recordingStats.total_recordings),
        avgDuration: Number(recordingStats.avg_duration),
        totalInteractions: Number(recordingStats.total_interactions),
        durationDistribution,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
