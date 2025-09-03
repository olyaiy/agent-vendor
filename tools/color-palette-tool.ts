import { tool } from 'ai';
import { z } from 'zod';

// HSL color schema for individual color values
const hslColorSchema = z.object({
  h: z.number().min(0).max(360).describe("Hue value (0-360)"),
  s: z.number().min(0).max(100).describe("Saturation percentage (0-100)"),
  l: z.number().min(0).max(100).describe("Lightness percentage (0-100)"),
});

// Individual color with optional label
const colorWithLabelSchema = z.object({
  color: hslColorSchema.describe("The HSL color value"),
  label: z.string().optional().describe("Optional label for this color (e.g., 'Ocean Blue', 'Sunset Orange')"),
});

// Color category schema for structured palettes (primary, secondary, accent)
const colorCategorySchema = z.object({
  name: z.string().describe("Name of the color category (e.g., 'Primary', 'Secondary', 'Accent')"),
  description: z.string().optional().describe("Optional description explaining the purpose and usage of this color category"),
  base: hslColorSchema.describe("The base HSL color for this category"),
  shades: z.array(hslColorSchema).max(4).describe("Up to 4 HSL shade variations for this color category"),
});

// Simple color row schema for flexible display
const simpleColorRowSchema = z.object({
  name: z.string().optional().describe("Optional name for this color row (e.g., 'Warm Tones', 'Cool Blues')"),
  description: z.string().optional().describe("Optional description of this color collection"),
  colors: z.array(colorWithLabelSchema).min(1).max(10).describe("Array of colors with optional labels (1-10 colors)"),
});

// Main tool parameters schema - now supports both structured and simple modes
const colorPaletteToolParams = z.object({
  // Overall palette info (optional)
  name: z.string().optional().describe("Optional descriptive name for this color palette"),
  description: z.string().optional().describe("Optional brief description of the palette's theme and intended use"),
  
  // Mode selection - either structured or simple
  mode: z.enum(['structured', 'simple']).describe("'structured' for primary/secondary/accent categories, 'simple' for flexible color rows"),
  
  // Structured palette (traditional mode)
  primary: colorCategorySchema.optional().describe("Primary color category - only used in structured mode"),
  secondary: colorCategorySchema.optional().describe("Secondary color category - only used in structured mode"),
  accent: colorCategorySchema.optional().describe("Accent color category - only used in structured mode"),
  
  // Simple palette (flexible mode)
  colorRows: z.array(simpleColorRowSchema).optional().describe("Array of color rows - only used in simple mode. Can be a single row or multiple themed rows"),
});

export const colorPaletteTool = tool({
  description: 'Generates flexible color palettes in two modes: 1) Structured mode with primary/secondary/accent categories (traditional design system), or 2) Simple mode with flexible color rows that can have any theme or purpose. In simple mode, you can create single rows of colors with optional names and descriptions - perfect for showing color variations, themed collections, or quick color suggestions. All names and descriptions are optional in simple mode for maximum flexibility.',
  inputSchema: colorPaletteToolParams,
  execute: async ({ name, description, mode, primary, secondary, accent, colorRows }) => {
    if (mode === 'structured') {
      // Validate structured mode requirements
      if (!primary?.base || !secondary?.base || !accent?.base) {
        return { 
          error: 'Structured mode requires primary, secondary, and accent colors with base values' 
        };
      }

      return {
        palette: {
          name,
          description,
          mode: 'structured' as const,
          primary,
          secondary,
          accent,
          generatedAt: new Date().toISOString(),
        }
      };
    } else if (mode === 'simple') {
      // Validate simple mode requirements
      if (!colorRows || colorRows.length === 0) {
        return { 
          error: 'Simple mode requires at least one color row' 
        };
      }

      // Validate that each color row has at least one color
      for (const row of colorRows) {
        if (!row.colors || row.colors.length === 0) {
          return { 
            error: 'Each color row must contain at least one color' 
          };
        }
      }

      return {
        palette: {
          name,
          description,
          mode: 'simple' as const,
          colorRows,
          generatedAt: new Date().toISOString(),
        }
      };
    } else {
      return { 
        error: 'Invalid mode: must be either "structured" or "simple"' 
      };
    }
  },
});

// Export types for use in components
export type HSLColor = z.infer<typeof hslColorSchema>;
export type ColorWithLabel = z.infer<typeof colorWithLabelSchema>;
export type ColorCategory = z.infer<typeof colorCategorySchema>;
export type SimpleColorRow = z.infer<typeof simpleColorRowSchema>;
export type ColorPalette = z.infer<typeof colorPaletteToolParams>; 