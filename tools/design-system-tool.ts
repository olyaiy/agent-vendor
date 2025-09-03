import { tool } from 'ai';
import { z } from 'zod';

// Re-export from color palette tool for consistency
const hslColorSchema = z.object({
  h: z.number().min(0).max(360).describe("Hue value (0-360)"),
  s: z.number().min(0).max(100).describe("Saturation percentage (0-100)"),
  l: z.number().min(0).max(100).describe("Lightness percentage (0-100)"),
});

const colorCategorySchema = z.object({
  name: z.string().describe("Name of the color category (e.g., 'Primary', 'Secondary', 'Accent')"),
  description: z.string().optional().describe("Optional description explaining the purpose and usage of this color category"),
  base: hslColorSchema.describe("The base HSL color for this category"),
  shades: z.array(hslColorSchema).max(4).describe("Up to 4 HSL shade variations for this color category"),
});

// Typography schemas
const fontFamilySchema = z.object({
  name: z.string().describe("Font family name (e.g., 'Inter', 'Playfair Display')"),
  fallback: z.array(z.string()).describe("Fallback font stack (e.g., ['sans-serif'], ['serif'])"),
  weights: z.array(z.number()).describe("Available font weights (e.g., [400, 500, 600, 700])"),
  category: z.enum(['serif', 'sans-serif', 'display', 'monospace']).optional().describe("Font category"),
});

const typographySchema = z.object({
  fontSource: z.enum(['google-fonts']).default('google-fonts').describe("Font source - currently supports Google Fonts"),
  families: z.object({
    heading: fontFamilySchema.describe("Font family for headings and titles"),
    body: fontFamilySchema.describe("Font family for body text and paragraphs"),
    accent: fontFamilySchema.optional().describe("Optional accent/display font for special elements"),
  }),
  scale: z.object({
    base: z.number().default(16).describe("Base font size in pixels"),
    ratio: z.number().default(1.25).describe("Modular scale ratio (e.g., 1.25 for major third)"),
    sizes: z.array(z.number()).describe("Computed font sizes array in pixels"),
  }),
});

// Design tokens schemas
const spacingSchema = z.object({
  base: z.number().default(4).describe("Base spacing unit in pixels"),
  scale: z.array(z.number()).describe("Spacing scale array (e.g., [4, 8, 12, 16, 24, 32, 48, 64])"),
});

const designTokensSchema = z.object({
  borderRadius: z.array(z.number()).optional().describe("Border radius values in pixels"),
  shadows: z.array(z.string()).optional().describe("Box shadow CSS values"),
  breakpoints: z.object({
    sm: z.number().default(640),
    md: z.number().default(768),
    lg: z.number().default(1024),
    xl: z.number().default(1280),
  }).optional().describe("Responsive breakpoints in pixels"),
});

// Main design system schema
const designSystemSchema = z.object({
  // System metadata
  name: z.string().optional().describe("Optional name for this design system"),
  description: z.string().optional().describe("Optional description of the design system's purpose and style"),
  style: z.enum(['modern', 'elegant', 'playful', 'minimal', 'bold', 'custom']).describe("Overall style/mood for the design system"),
  
  // Colors (required)
  colors: z.object({
    mode: z.enum(['structured']).default('structured').describe("Color palette structure mode"),
    primary: colorCategorySchema.describe("Primary color category with base and shades"),
    secondary: colorCategorySchema.describe("Secondary color category with base and shades"),
    accent: colorCategorySchema.describe("Accent color category with base and shades"),
    semantic: z.object({
      success: hslColorSchema.optional().describe("Success/positive state color"),
      warning: hslColorSchema.optional().describe("Warning/caution state color"),
      error: hslColorSchema.optional().describe("Error/danger state color"),
      info: hslColorSchema.optional().describe("Info/neutral state color"),
    }).optional().describe("Semantic state colors"),
    neutrals: z.array(hslColorSchema).optional().describe("Neutral colors (grays, blacks, whites)"),
  }),
  
  // Typography (required)
  typography: typographySchema.describe("Typography system including font families and scale"),
  
  // Design tokens (optional)
  spacing: spacingSchema.optional().describe("Spacing scale system"),
  tokens: designTokensSchema.optional().describe("Additional design tokens like shadows and border radius"),
});

// Font pairing data based on style
const getFontPairings = (style: string) => {
  const pairings = {
    modern: {
      heading: { name: 'Inter', fallback: ['sans-serif'], weights: [400, 500, 600, 700], category: 'sans-serif' as const },
      body: { name: 'Inter', fallback: ['sans-serif'], weights: [400, 500], category: 'sans-serif' as const },
      accent: { name: 'JetBrains Mono', fallback: ['monospace'], weights: [400, 500, 600], category: 'monospace' as const },
    },
    elegant: {
      heading: { name: 'Playfair Display', fallback: ['serif'], weights: [400, 500, 600, 700], category: 'serif' as const },
      body: { name: 'Source Serif Pro', fallback: ['serif'], weights: [400, 600], category: 'serif' as const },
      accent: { name: 'Oswald', fallback: ['sans-serif'], weights: [400, 500, 600], category: 'sans-serif' as const },
    },
    playful: {
      heading: { name: 'Fredoka', fallback: ['sans-serif'], weights: [400, 500, 600], category: 'sans-serif' as const },
      body: { name: 'Nunito', fallback: ['sans-serif'], weights: [400, 600], category: 'sans-serif' as const },
      accent: { name: 'Space Mono', fallback: ['monospace'], weights: [400, 700], category: 'monospace' as const },
    },
    minimal: {
      heading: { name: 'Helvetica Neue', fallback: ['Arial', 'sans-serif'], weights: [300, 400, 500, 600], category: 'sans-serif' as const },
      body: { name: 'Helvetica Neue', fallback: ['Arial', 'sans-serif'], weights: [300, 400], category: 'sans-serif' as const },
      accent: { name: 'SF Mono', fallback: ['Consolas', 'monospace'], weights: [400, 500], category: 'monospace' as const },
    },
    bold: {
      heading: { name: 'Montserrat', fallback: ['sans-serif'], weights: [600, 700, 800, 900], category: 'sans-serif' as const },
      body: { name: 'Open Sans', fallback: ['sans-serif'], weights: [400, 600], category: 'sans-serif' as const },
      accent: { name: 'Bebas Neue', fallback: ['sans-serif'], weights: [400], category: 'display' as const },
    },
    custom: {
      heading: { name: 'Inter', fallback: ['sans-serif'], weights: [400, 600, 700], category: 'sans-serif' as const },
      body: { name: 'Inter', fallback: ['sans-serif'], weights: [400, 500], category: 'sans-serif' as const },
    },
  };
  
  return pairings[style as keyof typeof pairings] || pairings.modern;
};

// Generate modular type scale
const generateTypeScale = (baseSize: number, ratio: number, steps = 8) => {
  const sizes = [];
  for (let i = -2; i < steps - 2; i++) {
    sizes.push(Math.round(baseSize * Math.pow(ratio, i)));
  }
  return sizes.sort((a, b) => a - b);
};

// Generate spacing scale
const generateSpacingScale = (base: number) => {
  return [base, base * 2, base * 3, base * 4, base * 6, base * 8, base * 12, base * 16];
};

export const designSystemTool = tool({
  description: 'Creates comprehensive design systems including color palettes, typography with Google Fonts integration, spacing scales, and design tokens. Generates cohesive visual languages with smart font pairings based on style preferences (modern, elegant, playful, minimal, bold, or custom). Perfect for creating complete brand guidelines and development-ready design foundations.',
  parameters: designSystemSchema,
  execute: async ({ 
    name, 
    description, 
    style, 
    colors, 
    typography, 
    spacing, 
    tokens 
  }) => {
    try {
      // Get font pairings based on style
      const fontPairings = getFontPairings(style);
      
      // Merge provided typography with style-based defaults
      const finalTypography = {
        fontSource: typography?.fontSource || 'google-fonts' as const,
        families: {
          heading: typography?.families?.heading || fontPairings.heading,
          body: typography?.families?.body || fontPairings.body,
          ...(typography?.families?.accent || fontPairings.accent ? { accent: typography?.families?.accent || fontPairings.accent } : {}),
        },
        scale: {
          base: typography?.scale?.base || 16,
          ratio: typography?.scale?.ratio || 1.25,
          sizes: typography?.scale?.sizes || generateTypeScale(typography?.scale?.base || 16, typography?.scale?.ratio || 1.25),
        },
      };
      
      // Generate default spacing if not provided
      const finalSpacing = spacing || {
        base: 4,
        scale: generateSpacingScale(4),
      };
      
      // Default design tokens
      const finalTokens = {
        borderRadius: tokens?.borderRadius || [2, 4, 8, 12, 16, 24],
        shadows: tokens?.shadows || [
          '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        ],
        breakpoints: tokens?.breakpoints || {
          sm: 640,
          md: 768,
          lg: 1024,
          xl: 1280,
        },
      };
      
      return {
        designSystem: {
          name,
          description,
          style,
          colors,
          typography: finalTypography,
          spacing: finalSpacing,
          tokens: finalTokens,
          generatedAt: new Date().toISOString(),
        }
      };
    } catch (error) {
      return {
        error: `Failed to generate design system: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },
});

// Export types for use in components
export type HSLColor = z.infer<typeof hslColorSchema>;
export type ColorCategory = z.infer<typeof colorCategorySchema>;
export type FontFamily = z.infer<typeof fontFamilySchema>;
export type Typography = z.infer<typeof typographySchema>;
export type DesignTokens = z.infer<typeof designTokensSchema>;
export type DesignSystem = z.infer<typeof designSystemSchema>;