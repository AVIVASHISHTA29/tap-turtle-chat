import { Card } from "@/components/ui/card";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsVisualizationProps {
  data: {
    timestamp: string;
    value: number;
  }[];
  type: "lineChart";
}

export function AnalyticsVisualization({
  data,
  type,
}: AnalyticsVisualizationProps) {
  if (type === "lineChart") {
    return (
      <Card className="w-full p-4 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value: number) => [value, "Clicks"]}
            />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    );
  }

  return null;
}
