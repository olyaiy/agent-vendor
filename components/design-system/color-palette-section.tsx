'use client';

import React from 'react';
import type { ToolInvocation } from 'ai';
import { Palette, CheckCircle2, Loader2, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { HSLColor, ColorCategory } from '@/tools/color-palette-tool';

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

  const copyToClipboard = (value: string, format: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`Copied ${format} to clipboard!`);
  };

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
        
        {/* Color values overlay - appears on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-2">
          <div className="text-center space-y-1">
            <div className="flex items-center gap-1">
              <code className="text-xs font-mono text-white bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
                {hslString}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-white hover:bg-white/20"
                onClick={() => copyToClipboard(hslString, 'HSL')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <code className="text-xs font-mono text-white bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
                {hexString}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-white hover:bg-white/20"
                onClick={() => copyToClipboard(hexString, 'HEX')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-center">
        <p className={`text-sm font-medium ${isBase ? 'text-primary font-semibold' : 'text-foreground'}`}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Hover to copy
        </p>
      </div>
    </motion.div>
  );
};

// Color category component
interface ColorCategoryDisplayProps {
  category: ColorCategory;
}

const ColorCategoryDisplay = ({ category }: ColorCategoryDisplayProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-foreground">
            {category.name}
          </h3>
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          {category.description}
        </p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
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

  if (state === 'call') {
    return (
      <motion.div 
        className="flex items-center gap-3 p-4 my-2 rounded-lg border border-border/50 bg-muted/30"
        variants={container}
        initial="hidden"
        animate="show"
        layoutId={layoutKey}
      >
        <Badge variant="outline" className="bg-primary/5 text-primary/80">
          <Palette className="h-3 w-3 mr-1.5" />
          Color Palette
        </Badge>

        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin mr-1.5" />
          <span className="text-xs text-muted-foreground">Generating color palette...</span>
        </div>
      </motion.div>
    );
  }

  if (state === 'result') {
    const result = toolInvocation.result;
    
    // Handle error case
    if (result?.error) {
      return (
        <motion.div 
          className="flex items-center gap-3 p-4 my-2 rounded-lg border border-destructive/20 bg-destructive/5"
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
          className="flex items-center gap-3 p-4 my-2 rounded-lg border border-border/50 bg-muted/30"
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
        className="p-8 my-6 rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/50 shadow-sm"
        variants={container}
        initial="hidden"
        animate="show"
        layoutId={layoutKey}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
              <Palette className="h-4 w-4 mr-2" />
              Color Palette
            </Badge>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{palette.name}</h2>
            <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
              {palette.description}
            </p>
          </div>

          <div className="space-y-12">
            <ColorCategoryDisplay category={palette.primary} />
            <ColorCategoryDisplay category={palette.secondary} />
            <ColorCategoryDisplay category={palette.accent} />
          </div>
        </div>
      </motion.div>
    );
  }

  // Fallback for unexpected states
  return null;
};

export default ColorPaletteSection; 