'use client';

import React from 'react';
import type { ToolInvocation } from 'ai';
import { Palette, CheckCircle2, Loader2, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { HSLColor, ColorCategory, SimpleColorRow } from '@/tools/color-palette-tool';

interface ColorPaletteSectionProps {
  toolInvocation: ToolInvocation;
}

// Helper function to convert HSL object to CSS string
const hslToString = (hsl: HSLColor): string => {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
};

// Helper function to convert HSL to HEX for copying
const hslToHex = (hsl: HSLColor): string => {
  const h = hsl.h;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Color swatch component
interface ColorSwatchProps {
  color: HSLColor;
  label: string;
  isBase?: boolean;
}

const ColorSwatch = ({ color, label, isBase = false }: ColorSwatchProps) => {
  const hslString = hslToString(color);
  const hexString = hslToHex(color);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="group relative"
    >
      <div
        className={`relative w-full aspect-square rounded-xl border-2 shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.02] overflow-hidden ${
          isBase 
            ? 'border-primary/30 ring-2 ring-primary/10 ring-offset-2 shadow-md' 
            : 'border-border/30 hover:border-border/50'
        }`}
        style={{ backgroundColor: hslString }}
      >
        {/* Subtle overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent" />
        
        {/* Color values overlay - improved for mobile touch */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-2 sm:p-3">
          <div className="text-center space-y-2">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-1">
              <code className="text-xs sm:text-xs font-mono text-white bg-white/25 px-2 py-1 rounded backdrop-blur-sm min-w-0 break-all">
                {hslString}
              </code>
              <div className="sm:ml-1">
                <CopyButton 
                  content={hslString} 
                  copyMessage="Copied HSL to clipboard!"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-1">
              <code className="text-xs sm:text-xs font-mono text-white bg-white/25 px-2 py-1 rounded backdrop-blur-sm min-w-0 break-all">
                {hexString}
              </code>
              <div className="sm:ml-1">
                <CopyButton 
                  content={hexString} 
                  copyMessage="Copied HEX to clipboard!"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-2 sm:mt-3 text-center px-1">
        <p className={`text-xs sm:text-sm font-medium leading-tight ${isBase ? 'text-primary font-semibold' : 'text-foreground'}`}>
          {label}
        </p>
      </div>
    </motion.div>
  );
};

// Color category component for structured mode
interface ColorCategoryDisplayProps {
  category: ColorCategory;
}

const ColorCategoryDisplay = ({ category }: ColorCategoryDisplayProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4 sm:space-y-6"
    >
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">
            {category.name}
          </h3>
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        </div>
        {category.description && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {category.description}
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        <ColorSwatch 
          color={category.base} 
          label="Base" 
          isBase={true}
        />
        
        {category.shades.map((shade, index) => (
          <ColorSwatch
            key={index}
            color={shade}
            label={`Shade ${index + 1}`}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Simple color row component for flexible mode
interface SimpleColorRowDisplayProps {
  colorRow: SimpleColorRow;
  showHeader?: boolean;
}

const SimpleColorRowDisplay = ({ colorRow, showHeader = true }: SimpleColorRowDisplayProps) => {
  // Use predefined grid classes to avoid dynamic class generation issues - improved for mobile
  const getGridClass = () => {
    const count = colorRow.colors.length;
    if (count === 1) return 'grid gap-3 sm:gap-4 md:gap-6 grid-cols-1';
    if (count === 2) return 'grid gap-3 sm:gap-4 md:gap-6 grid-cols-2';
    if (count === 3) return 'grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3';
    if (count === 4) return 'grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 sm:grid-cols-4';
    if (count === 5) return 'grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-5';
    return 'grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4 sm:space-y-6"
    >
      {showHeader && (colorRow.name || colorRow.description) && (
        <div className="space-y-2 sm:space-y-3">
          {colorRow.name && (
            <div className="flex items-center gap-2 sm:gap-3">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                {colorRow.name}
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            </div>
          )}
          {colorRow.description && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {colorRow.description}
            </p>
          )}
        </div>
      )}
      
      <div className={getGridClass()}>
        {colorRow.colors.map((colorWithLabel, index) => (
          <ColorSwatch
            key={index}
            color={colorWithLabel.color}
            label={colorWithLabel.label || `Color ${index + 1}`}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};

const ColorPaletteSection = ({ toolInvocation }: ColorPaletteSectionProps) => {
  const { state } = toolInvocation;
  
  // Generate a unique key for animation transitions
  const layoutKey = React.useMemo(() => `palette-${Math.random().toString(36).substring(2, 9)}`, []);

  // Function to copy entire palette data
  const copyEntirePalette = (palette: { 
    name?: string; 
    description?: string; 
    mode: 'structured' | 'simple';
    primary?: ColorCategory;
    secondary?: ColorCategory; 
    accent?: ColorCategory;
    colorRows?: SimpleColorRow[];
  }) => {
    let paletteText = '';
    
    if (palette.name) {
      paletteText += `${palette.name}\n`;
    }
    if (palette.description) {
      paletteText += `${palette.description}\n\n`;
    }

    if (palette.mode === 'structured' && palette.primary && palette.secondary && palette.accent) {
      const formatColorCategory = (category: ColorCategory) => {
        const baseColor = `${category.name} Base: ${hslToString(category.base)} / ${hslToHex(category.base)}`;
        const shades = category.shades.map((shade, index) => 
          `${category.name} Shade ${index + 1}: ${hslToString(shade)} / ${hslToHex(shade)}`
        ).join('\n');
        const description = category.description ? `${category.description}\n` : '';
        return `${category.name}:\n${description}${baseColor}\n${shades}`;
      };

      paletteText += `${formatColorCategory(palette.primary)}\n\n${formatColorCategory(palette.secondary)}\n\n${formatColorCategory(palette.accent)}`;
    } else if (palette.mode === 'simple' && palette.colorRows) {
      palette.colorRows.forEach((row: SimpleColorRow, rowIndex: number) => {
        if (row.name) paletteText += `${row.name}:\n`;
        if (row.description) paletteText += `${row.description}\n`;
        
        row.colors.forEach((colorWithLabel, colorIndex) => {
          const label = colorWithLabel.label || `Color ${colorIndex + 1}`;
          paletteText += `${label}: ${hslToString(colorWithLabel.color)} / ${hslToHex(colorWithLabel.color)}\n`;
        });
        
        if (rowIndex < palette.colorRows!.length - 1) paletteText += '\n';
      });
    }

    navigator.clipboard.writeText(paletteText);
    toast.success('Copied entire palette to clipboard!');
  };

  if (state === 'call') {
    // Animated color swatches for loading state
    const animatedColors = [
      'hsl(220, 70%, 50%)', // Blue
      'hsl(280, 60%, 55%)', // Purple  
      'hsl(340, 75%, 55%)', // Pink
      'hsl(25, 80%, 55%)',  // Orange
      'hsl(160, 60%, 45%)', // Teal
      'hsl(45, 85%, 60%)',  // Yellow
    ];

    return (
      <motion.div 
        className="p-4 sm:p-6 my-3 sm:my-4 rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50"
        variants={container}
        initial="hidden"
        animate="show"
        layoutId={layoutKey}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 w-fit">
            <Palette className="h-4 w-4 mr-2" />
            Color Palette
          </Badge>
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground font-medium">Designing colors...</span>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Animated color swatches - better mobile grid */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
              {Array.from({ length: 6 }).map((_, swatchIndex) => {
                const colorIndex = swatchIndex % animatedColors.length;
                const baseColor = animatedColors[colorIndex];
                
                return (
                  <motion.div
                    key={swatchIndex}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: [0.3, 0.8, 0.3], 
                      scale: [0.8, 1, 0.8],
                      backgroundColor: baseColor
                    }}
                    transition={{
                      delay: swatchIndex * 0.1,
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="aspect-square rounded-lg border-2 border-border/30 shadow-sm"
                    style={{ backgroundColor: baseColor }}
                  >
                    <div className="w-full h-full rounded-lg bg-gradient-to-br from-white/10 to-transparent" />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Subtle progress indicator */}
        <motion.div 
          className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border border-primary/30 border-t-primary rounded-full"
            />
            <span className="text-center">Generating harmonious color combinations</span>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (state === 'result') {
    const result = toolInvocation.result;
    
    // Handle error case
    if (result?.error) {
      return (
        <motion.div 
          className="flex items-center gap-3 p-3 sm:p-4 my-2 rounded-lg border border-destructive/20 bg-destructive/5"
          variants={container}
          initial="hidden"
          animate="show"
          layoutId={layoutKey}
        >
          <Badge variant="outline" className="bg-destructive/5 text-destructive/80">
            <Palette className="h-3 w-3 mr-1.5" />
            Error
          </Badge>
          <span className="text-sm text-destructive">{result.error}</span>
        </motion.div>
      );
    }

    const palette = result?.palette;
    
    if (!palette) {
      return (
        <motion.div 
          className="flex items-center gap-3 p-3 sm:p-4 my-2 rounded-lg border border-border/50 bg-muted/30"
          variants={container}
          initial="hidden"
          animate="show"
          layoutId={layoutKey}
        >
          <Badge variant="outline" className="bg-primary/5 text-primary/80">
            <Palette className="h-3 w-3 mr-1.5" />
            Color Palette
          </Badge>
          <span className="text-sm text-muted-foreground">No palette data available</span>
        </motion.div>
      );
    }

    return (
      <motion.div 
        className="p-4 sm:p-6 md:p-8 my-4 sm:my-6 rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 shadow-sm"
        variants={container}
        initial="hidden"
        animate="show"
        layoutId={layoutKey}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
              <Palette className="h-4 w-4 mr-2" />
              Color Palette
            </Badge>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyEntirePalette(palette)}
            className="flex items-center gap-2 hover:bg-primary/5 w-fit"
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">Copy Palette</span>
            <span className="sm:hidden">Copy</span>
          </Button>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Optional palette header */}
          {(palette.name || palette.description) && (
            <div className="space-y-2 sm:space-y-3">
              {palette.name && (
                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{palette.name}</h2>
              )}
              {palette.description && (
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
                  {palette.description}
                </p>
              )}
            </div>
          )}

          {/* Render based on mode */}
          <div className="space-y-8 sm:space-y-12">
            {palette.mode === 'structured' ? (
              // Structured mode: primary/secondary/accent
              <>
                <ColorCategoryDisplay category={palette.primary} />
                <ColorCategoryDisplay category={palette.secondary} />
                <ColorCategoryDisplay category={palette.accent} />
              </>
            ) : palette.mode === 'simple' ? (
              // Simple mode: flexible color rows
              <>
                {palette.colorRows.map((colorRow: SimpleColorRow, index: number) => (
                  <SimpleColorRowDisplay 
                    key={index} 
                    colorRow={colorRow}
                    showHeader={palette.colorRows.length > 1 || Boolean(colorRow.name) || Boolean(colorRow.description)}
                  />
                ))}
              </>
            ) : null}
          </div>
        </div>
      </motion.div>
    );
  }

  // Fallback for unexpected states
  return null;
};

export default ColorPaletteSection; 