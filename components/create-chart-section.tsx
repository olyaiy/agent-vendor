import React from 'react';
import type { ToolInvocation } from 'ai';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area, LabelList } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ChartContainer, ChartTooltipContent, ChartLegendContent, type ChartConfig } from './ui/chart';

interface CreateChartSectionProps {
  toolInvocation: ToolInvocation;
}

type ChartToolResult = {
  chartType: "line" | "bar" | "bar_horizontal" | "area";
  data: Record<string, unknown>[];
  title?: string;
  description?: string;
  xAxisKey: string;
  yAxisKeys: string[];
  chartConfig?: ChartConfig; // This should align with the ChartConfig type from './ui/chart'
  areaType?: "natural" | "linear" | "step";
  stacked?: boolean;
  showLabels?: boolean;
  labelKey?: string;
};

export default function CreateChartSection({ toolInvocation }: CreateChartSectionProps) {
  // The tool's 'execute' function returns its arguments, so they will be in 'toolInvocation.args'.
  const chartDataPayload = toolInvocation.args as ChartToolResult | undefined;

  if (!chartDataPayload || typeof chartDataPayload !== 'object' || !["line", "bar", "bar_horizontal", "area"].includes(chartDataPayload.chartType)) {
    // If result is not as expected, show an error and the raw toolInvocation for debugging.
    return (
        <Card className="w-full p-4">
            <CardHeader>
                <CardTitle>Chart Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Error: Invalid chart data or type received from the tool.</p>
                <p className="text-xs text-muted-foreground">Expected &amp;apos;args&amp;apos; to contain chart parameters.</p>
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
  const { data, title, description, xAxisKey, yAxisKeys, chartConfig = {}, chartType, showLabels = false, labelKey, areaType = "natural", stacked = false } = props;

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
        <LineChart data={data} margin={{ top: showLabels ? 20 : 5, right: 20, left: 0, bottom: 5 }}>
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
              dot={showLabels ? { fill: finalChartConfig[key]?.color || 'hsl(var(--foreground))' } : false}
              activeDot={{ r: 6 }}
            >
              {showLabels && (
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                  dataKey={labelKey || key}
                  formatter={labelKey ? (value: string) => finalChartConfig[value]?.label || value : undefined}
                />
              )}
            </Line>
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
    } else if (chartType === "bar_horizontal") {
      // For horizontal bar, assume yAxisKeys[0] is the numerical value and xAxisKey is the category.
      // Recharts 'layout="vertical"' makes the bars horizontal.
      // XAxis becomes numerical, YAxis becomes categorical.
      const numericalDataKey = yAxisKeys[0]; // Assuming the first yAxisKey is for the values
      const categoryDataKey = xAxisKey;

      return (
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }} // Adjusted margins for YAxis labels
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" dataKey={numericalDataKey} tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis
            type="category"
            dataKey={categoryDataKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={80} // Give some space for Y-axis labels
            // tickFormatter={(value) => typeof value === 'string' ? value.slice(0, 10) : value} // Example
          />
          <Tooltip
            content={<ChartTooltipContent indicator="dashed" hideLabel={false} />}
          />
          {yAxisKeys.map((key) => ( // Still map, in case we want grouped/stacked horizontal later, but for now it's one bar per category entry
            <Bar
              key={key} // If multiple yAxisKeys, this will create multiple bars per category item (grouped)
              dataKey={key}
              fill={finalChartConfig[key]?.color || 'hsl(var(--foreground))'}
              radius={4}
              // For a simple horizontal bar chart, often only one yAxisKey is used.
              // If multiple yAxisKeys are provided, this will render them as grouped horizontal bars.
            />
          ))}
          {/* Legend might be useful if multiple yAxisKeys are used for grouped horizontal bars */}
          {yAxisKeys.length > 1 && <Legend content={<ChartLegendContent />} />}
        </BarChart>
      );
    } else if (chartType === "area") {
      // areaType and stacked are now destructured from props at the top of RenderChart

      return (
        <AreaChart data={data} margin={{ top: (showLabels ? 20 : 5), right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
          <Tooltip content={<ChartTooltipContent indicator="line" />} />
          {yAxisKeys.map((key) => (
            <Area
              key={key}
              type={areaType}
              dataKey={key}
              fill={finalChartConfig[key]?.color || 'hsl(var(--foreground))'}
              stroke={finalChartConfig[key]?.color || 'hsl(var(--foreground))'}
              fillOpacity={0.4}
              stackId={stacked ? "a" : undefined}
            />
          ))}
          {yAxisKeys.length > 1 && <Legend content={<ChartLegendContent />} />}
        </AreaChart>
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