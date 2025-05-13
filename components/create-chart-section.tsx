import React from 'react';
import type { ToolInvocation } from 'ai';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ChartContainer, ChartTooltipContent, ChartLegendContent, type ChartConfig } from './ui/chart';

interface CreateChartSectionProps {
  toolInvocation: ToolInvocation;
}

type ChartToolResult = {
  chartType: "line" | "bar";
  data: Record<string, unknown>[];
  title?: string;
  description?: string;
  xAxisKey: string;
  yAxisKeys: string[];
  chartConfig?: ChartConfig; // This should align with the ChartConfig type from './ui/chart'
};

export default function CreateChartSection({ toolInvocation }: CreateChartSectionProps) {
  // The tool's 'execute' function returns its arguments, so they will be in 'toolInvocation.result'.
  const chartDataPayload = toolInvocation.result as ChartToolResult | undefined;

  if (!chartDataPayload || typeof chartDataPayload !== 'object' || !["line", "bar"].includes(chartDataPayload.chartType)) {
    // If result is not as expected, show an error and the raw toolInvocation for debugging.
    return (
        <Card className="w-full p-4">
            <CardHeader>
                <CardTitle>Chart Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Error: Invalid chart data or type received from the tool.</p>
                <p className="text-xs text-muted-foreground">Expected 'result' to contain chart parameters.</p>
                <pre className="mt-2 text-xs whitespace-pre-wrap bg-muted p-2 rounded-md">
                    {JSON.stringify(toolInvocation, null, 2)}
                </pre>
            </CardContent>
        </Card>
    );
  }

  return <RenderChart {...chartDataPayload} />;
}

function RenderChart(props: ChartToolResult) {
  const { data, title, description, xAxisKey, yAxisKeys, chartConfig = {}, chartType } = props;

  const finalChartConfig: ChartConfig = { ...chartConfig };
  yAxisKeys.forEach((key, index) => {
    if (!finalChartConfig[key]) {
      finalChartConfig[key] = {
        label: key.charAt(0).toUpperCase() + key.slice(1),
        color: `var(--chart-${(index % 5) + 1})`,
      };
    }
  });

  const chartContent = () => {
    if (chartType === "line") {
      return (
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
          <Tooltip content={<ChartTooltipContent indicator="line" hideLabel={yAxisKeys.length > 1 ? false : true} />} />
          {yAxisKeys.map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={finalChartConfig[key]?.color || 'hsl(var(--foreground))'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
          {yAxisKeys.length > 1 && <Legend content={<ChartLegendContent />} />}
        </LineChart>
      );
    } else if (chartType === "bar") {
      return (
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
          <Tooltip content={<ChartTooltipContent indicator="dashed" hideLabel={yAxisKeys.length > 1 ? false : true} />} />
          {yAxisKeys.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              fill={finalChartConfig[key]?.color || 'hsl(var(--foreground))'}
              radius={4}
            />
          ))}
          {yAxisKeys.length > 1 && <Legend content={<ChartLegendContent />} />}
        </BarChart>
      );
    }
    return <p>Unsupported chart type: {chartType}</p>; // Fallback
  };

  return (
    <Card className="w-full">
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer config={finalChartConfig} className="min-h-[300px] w-full sm:min-h-[350px] md:min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartContent()}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}