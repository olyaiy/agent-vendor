import { tool } from 'ai';
import { z } from 'zod';

// HSL color schema for individual color values
const hslColorSchema = z.object({
  h: z.number().min(0).max(360).describe("Hue value (0-360)"),
  s: z.number().min(0).max(100).describe("Saturation percentage (0-100)"),
  l: z.number().min(0).max(100).describe("Lightness percentage (0-100)"),
});

// Color category schema for each color group (primary, secondary, accent)
const colorCategorySchema = z.object({
  name: z.string().describe("Name of the color category (e.g., 'Primary', 'Secondary', 'Accent')"),
  description: z.string().describe("A 1-2 sentence description explaining the purpose and usage of this color category in the design system"),
  base: hslColorSchema.describe("The base HSL color for this category"),
  shades: z.array(hslColorSchema).max(4).describe("Up to 4 HSL shade variations for this color category"),
});

// Main tool parameters schema
const colorPaletteToolParams = z.object({
  name: z.string().describe("A descriptive name for this color palette (e.g., 'Ocean Breeze', 'Modern Tech', 'Warm Sunset')"),
  description: z.string().describe("A brief description of the palette's theme and intended use"),
  primary: colorCategorySchema.describe("The primary color category - main brand color. Should include a description of its role as the dominant brand color used for headers, buttons, and key elements"),
  secondary: colorCategorySchema.describe("The secondary color category - supporting color. Should include a description of its role as a complementary color for backgrounds, secondary buttons, and supporting elements"),
  accent: colorCategorySchema.describe("The accent color category - highlight color. Should include a description of its role for calls-to-action, highlights, links, and drawing attention to important elements"),
});

export const colorPaletteTool = tool({
  description: 'Generates a cohesive color palette with primary, secondary, and accent colors. For each color category, provide a clear name (Primary, Secondary, Accent), a 1-2 sentence description explaining its purpose and usage in the design system, a base HSL value, and up to 4 additional HSL shade variations (lighter and darker). Use this when users request color schemes, palettes, or design system colors. The AI should create harmonious colors that work well together and provide meaningful descriptions for how each color category should be used.',
  parameters: colorPaletteToolParams,
  execute: async ({ name, description, primary, secondary, accent }) => {
    // Validate that we have the required data
    if (!primary?.base || !secondary?.base || !accent?.base) {
      return { 
        error: 'Invalid color palette data: missing base colors for primary, secondary, or accent categories' 
      };
    }

    // Validate that descriptions are provided
    if (!primary?.description || !secondary?.description || !accent?.description) {
      return { 
        error: 'Invalid color palette data: missing descriptions for color categories' 
      };
    }

    // Return the structured palette data
    return {
      palette: {
        name,
        description,
        primary,
        secondary,
        accent,
        generatedAt: new Date().toISOString(),
      }
    };
  },
});

// Export types for use in components
export type HSLColor = z.infer<typeof hslColorSchema>;
export type ColorCategory = z.infer<typeof colorCategorySchema>;
export type ColorPalette = z.infer<typeof colorPaletteToolParams>; 