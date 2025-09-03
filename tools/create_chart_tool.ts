import { tool } from 'ai';
import { z } from 'zod';

export const createChartTool = tool({
  description: "Generates various types of charts and data visualizations. Key parameters include `chartType` (e.g., 'line', 'bar', 'bar_horizontal', 'area'), `data` (an array of objects), `xAxisKey` (string key for x-axis data), and `yAxisKeys` (an array of string keys for y-axis data, allowing for multiple series). Optional parameters like `title`, `description`, and `chartConfig` (for custom labels and colors per series) can be used for styling. For 'area' charts, `areaType` ('natural', 'linear', 'step') and `stacked` (boolean) options are available.",
  inputSchema: z.object({
    chartType: z.enum(["line", "bar", "bar_horizontal", "area"]).describe("The type of chart to create, e.g., 'line', 'bar', 'bar_horizontal', 'area'."),
    data: z.array(z.record(z.string(), z.any())).describe("An array of data objects for the chart."),
    title: z.string().optional().describe("The title of the chart."),
    description: z.string().optional().describe("A brief description or caption for the chart."),
    xAxisKey: z.string().describe("The key in the data objects to be used for the X-axis."),
    yAxisKeys: z.array(z.string()).describe("An array of keys in the data objects to be used for the Y-axis data series."),
    areaType: z.enum(["natural", "linear", "step"]).optional().describe("The interpolation type for area charts (e.g., 'natural', 'linear', 'step'). Defaults to 'natural'."),
    stacked: z.boolean().optional().describe("For area charts, whether to stack the areas if multiple yAxisKeys are provided. Defaults to false."),
    chartConfig: z.record(
      z.string(),
      z.object({
        label: z.string().describe("The display label for this data series."),
        color: z.string().describe("The color for this data series (e.g., 'hsl(var(--chart-1))' or a hex code).")
      })
    ).optional().describe("Configuration for labels and colors of data series.")
  }),
  execute: async (args) => {
    // For now, just return the arguments for the client to handle rendering
    return args;
  },
});