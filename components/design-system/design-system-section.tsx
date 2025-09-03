'use client';

import React, { useEffect } from 'react';
import type { ToolInvocation } from 'ai';
import { Palette, Type, CheckCircle2, Loader2, Copy, Layers, Play, Star, ArrowRight, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { HSLColor, ColorCategory, Typography, DesignTokens } from '@/tools/design-system-tool';

interface DesignSystemSectionProps {
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

// Color swatch component (reused from color palette)
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
        <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent" />
        
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
      
      {/* All colors in two compact rows */}
      <div className="space-y-2">
        {/* First row - Base + first 2 shades */}
        <div className="flex gap-2">
          <div className="flex-1">
            <ColorSwatch 
              color={category.base} 
              label="Base" 
              isBase={true}
            />
          </div>
          {category.shades.slice(0, 2).map((shade, index) => (
            <div key={index} className="flex-1">
              <ColorSwatch
                color={shade}
                label={`Shade ${index + 1}`}
              />
            </div>
          ))}
        </div>
        
        {/* Second row - remaining shades */}
        {category.shades.length > 2 && (
          <div className="flex gap-2">
            {category.shades.slice(2).map((shade, index) => (
              <div key={index + 2} className="flex-1">
                <ColorSwatch
                  color={shade}
                  label={`Shade ${index + 3}`}
                />
              </div>
            ))}
            {/* Fill empty slots to maintain alignment */}
            {category.shades.slice(2).length < 3 && (
              Array.from({ length: 3 - category.shades.slice(2).length }).map((_, emptyIndex) => (
                <div key={`empty-${emptyIndex}`} className="flex-1" />
              ))
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Typography preview component
interface TypographyDisplayProps {
  typography: Typography;
}

const TypographyDisplay = ({ typography }: TypographyDisplayProps) => {
  // Load Google Fonts dynamically
  useEffect(() => {
    if (typography.fontSource === 'google-fonts') {
      const fonts = [typography.families.heading, typography.families.body];
      if (typography.families.accent) fonts.push(typography.families.accent);

      fonts.forEach(font => {
        // Check if font is not a system font
        if (!['Helvetica Neue', 'SF Mono', 'Arial'].includes(font.name)) {
          const weightsStr = font.weights.join(';');
          const link = document.createElement('link');
          link.href = `https://fonts.googleapis.com/css2?family=${font.name.replace(/\s+/g, '+')}:wght@${weightsStr}&display=swap`;
          link.rel = 'stylesheet';
          
          // Only add if not already added
          if (!document.querySelector(`link[href*="${font.name.replace(/\s+/g, '+')}"]`)) {
            document.head.appendChild(link);
          }
        }
      });
    }
  }, [typography]);

  const getFontStack = (family: { name: string; fallback: string[] }) => {
    return `"${family.name}", ${family.fallback.join(', ')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 sm:space-y-8"
    >
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Type className="h-5 w-5 text-primary" />
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">
            Typography
          </h3>
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        </div>
      </div>

      {/* Font Families */}
      <div className="space-y-6">
        {/* Heading Font */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Heading Font
            </h4>
            <CopyButton 
              content={getFontStack(typography.families.heading)}
              copyMessage="Copied font stack to clipboard!"
            />
          </div>
          <div 
            className="text-3xl sm:text-4xl font-bold leading-tight"
            style={{ fontFamily: getFontStack(typography.families.heading) }}
          >
            The quick brown fox jumps
          </div>
          <div className="text-sm text-muted-foreground">
            {typography.families.heading.name} • Weights: {typography.families.heading.weights.join(', ')}
          </div>
        </div>

        {/* Body Font */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Body Font
            </h4>
            <CopyButton 
              content={getFontStack(typography.families.body)}
              copyMessage="Copied font stack to clipboard!"
            />
          </div>
          <div 
            className="text-base leading-relaxed"
            style={{ fontFamily: getFontStack(typography.families.body) }}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
          </div>
          <div className="text-sm text-muted-foreground">
            {typography.families.body.name} • Weights: {typography.families.body.weights.join(', ')}
          </div>
        </div>

        {/* Accent Font */}
        {typography.families.accent && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Accent Font
              </h4>
              <CopyButton 
                content={getFontStack(typography.families.accent)}
                copyMessage="Copied font stack to clipboard!"
              />
            </div>
            <div 
              className="text-lg font-medium tracking-wider"
              style={{ fontFamily: getFontStack(typography.families.accent) }}
            >
              SPECIAL ELEMENTS & CODE
            </div>
            <div className="text-sm text-muted-foreground">
              {typography.families.accent.name} • Weights: {typography.families.accent.weights.join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* Type Scale */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Type Scale (Base: {typography.scale.base}px, Ratio: {typography.scale.ratio})
        </h4>
        <div className="space-y-2">
          {typography.scale.sizes.slice().reverse().map((size, index) => (
            <div key={size} className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground font-mono w-12 text-right">
                {size}px
              </div>
              <div 
                style={{ 
                  fontSize: `${size}px`,
                  fontFamily: getFontStack(typography.families.heading)
                }}
                className="font-medium"
              >
                Sample Text
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Design tokens display component
interface DesignTokensDisplayProps {
  spacing?: { base: number; scale: number[] };
  tokens?: DesignTokens;
}

const DesignTokensDisplay = ({ spacing, tokens }: DesignTokensDisplayProps) => {
  if (!spacing && !tokens) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 sm:space-y-8"
    >
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Layers className="h-5 w-5 text-primary" />
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">
            Design Tokens
          </h3>
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Spacing Scale */}
        {spacing && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Spacing Scale (Base: {spacing.base}px)
            </h4>
            <div className="space-y-3">
              {spacing.scale.map((value, index) => (
                <div key={value} className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground font-mono w-8">
                    {value}px
                  </div>
                  <div 
                    className="bg-primary/20 h-4 rounded"
                    style={{ width: `${value}px` }}
                  />
                  <CopyButton 
                    content={`${value}px`}
                    copyMessage={`Copied ${value}px to clipboard!`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Border Radius and Shadows in same column */}
        {(tokens?.borderRadius || tokens?.shadows) && (
          <div className="space-y-6">
            {/* Border Radius */}
            {tokens?.borderRadius && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Border Radius
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {tokens.borderRadius.map((value, index) => (
                    <div key={value} className="text-center space-y-2">
                      <div 
                        className="w-12 h-12 bg-primary/20 border-2 border-primary/30 mx-auto"
                        style={{ borderRadius: `${value}px` }}
                      />
                      <div className="text-xs text-muted-foreground font-mono">
                        {value}px
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shadows */}
            {tokens?.shadows && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Box Shadows
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {tokens.shadows.map((shadow, index) => (
                    <div key={index} className="text-center space-y-2">
                      <div 
                        className="w-16 h-16 bg-card border border-border/50 mx-auto rounded-lg"
                        style={{ boxShadow: shadow }}
                      />
                      <div className="text-xs text-muted-foreground">
                        Level {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Mock hero showcase component
interface MockHeroShowcaseProps {
  designSystem: any;
}

const MockHeroShowcase = ({ designSystem }: MockHeroShowcaseProps) => {
  const getFontStack = (family: { name: string; fallback: string[] }) => {
    return `"${family.name}", ${family.fallback.join(', ')}`;
  };

  const primaryColor = hslToString(designSystem.colors.primary.base);
  const secondaryColor = hslToString(designSystem.colors.secondary.base);
  const accentColor = hslToString(designSystem.colors.accent.base);
  const bgColor = hslToString(designSystem.colors.background.base);
  
  const primaryShade1 = hslToString(designSystem.colors.primary.shades[0]);
  const secondaryShade1 = hslToString(designSystem.colors.secondary.shades[0]);
  const accentShade1 = hslToString(designSystem.colors.accent.shades[0]);
  const bgShade1 = hslToString(designSystem.colors.background.shades[0]);

  const borderRadius = designSystem.tokens?.borderRadius?.[1] || 8;
  const boxShadow = designSystem.tokens?.shadows?.[1] || '0 4px 6px -1px rgb(0 0 0 / 0.1)';
  const spacing = designSystem.spacing?.scale?.[3] || 24;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Play className="h-5 w-5 text-primary" />
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">
            Design System Preview
          </h3>
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        </div>
        <p className="text-sm text-muted-foreground">
          See how all elements work together in a real component
        </p>
      </div>

      <div 
        className="rounded-lg border overflow-hidden"
        style={{ 
          borderRadius: `${borderRadius}px`,
          boxShadow: boxShadow,
          borderColor: primaryColor + '20'
        }}
      >
        {/* Navigation Bar */}
        <div 
          className="px-4 py-2 border-b flex items-center justify-between"
          style={{ 
            backgroundColor: primaryColor + '10',
            borderBottomColor: primaryColor + '20'
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="text-sm font-bold"
              style={{ 
                fontFamily: getFontStack(designSystem.typography.families.heading),
                color: primaryColor
              }}
            >
              DesignApp
            </div>
            <nav className="hidden sm:flex items-center gap-4">
              {['Home', 'Features', 'Pricing', 'About'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-xs hover:opacity-80 transition-opacity"
                  style={{ 
                    fontFamily: getFontStack(designSystem.typography.families.body),
                    color: primaryColor
                  }}
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 text-xs font-medium rounded transition-all hover:scale-105"
              style={{
                backgroundColor: primaryColor,
                color: 'white',
                borderRadius: `${borderRadius / 2}px`,
                fontFamily: getFontStack(designSystem.typography.families.heading)
              }}
            >
              Sign Up
            </button>
            <Menu className="h-4 w-4 sm:hidden" style={{ color: primaryColor }} />
          </div>
        </div>

        {/* Main Content */}
        <div 
          className="p-4 sm:p-6"
          style={{ backgroundColor: bgColor }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left Column - Content */}
            <div className="space-y-4">
              <div className="space-y-3">
                <div 
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: accentColor + '20',
                    color: accentColor,
                    borderRadius: `${borderRadius / 2}px`
                  }}
                >
                  <Star className="h-3 w-3" />
                  New
                </div>
                
                <h1 
                  className="text-xl sm:text-2xl font-bold leading-tight"
                  style={{ 
                    fontFamily: getFontStack(designSystem.typography.families.heading),
                    color: primaryColor
                  }}
                >
                  Beautiful Design Made Simple
                </h1>
                
                <p 
                  className="text-sm leading-relaxed opacity-80"
                  style={{ 
                    fontFamily: getFontStack(designSystem.typography.families.body),
                    color: primaryColor
                  }}
                >
                  Create stunning interfaces with our design system. Built for modern applications.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded transition-all hover:scale-105"
                  style={{
                    backgroundColor: primaryColor,
                    color: 'white',
                    borderRadius: `${borderRadius / 2}px`,
                    boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)',
                    fontFamily: getFontStack(designSystem.typography.families.heading)
                  }}
                >
                  Get Started
                  <ArrowRight className="h-3 w-3" />
                </button>
                
                <button
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold border rounded transition-all hover:scale-105"
                  style={{
                    backgroundColor: 'transparent',
                    color: secondaryColor,
                    borderColor: secondaryColor,
                    borderRadius: `${borderRadius / 2}px`,
                    fontFamily: getFontStack(designSystem.typography.families.heading)
                  }}
                >
                  Learn More
                </button>
              </div>

              <div className="space-y-2">
                <h3 
                  className="text-sm font-semibold"
                  style={{ 
                    fontFamily: getFontStack(designSystem.typography.families.heading),
                    color: secondaryColor
                  }}
                >
                  Features
                </h3>
                <ul className="space-y-1">
                  {['Color Palette', 'Typography', 'Components'].map((feature) => (
                    <li 
                      key={feature}
                      className="flex items-center gap-2 text-xs"
                      style={{ 
                        fontFamily: getFontStack(designSystem.typography.families.body),
                        color: primaryColor
                      }}
                    >
                      <div 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: secondaryColor }}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column - Visual Elements */}
            <div className="grid grid-cols-2 gap-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="aspect-square rounded"
                style={{
                  backgroundColor: primaryColor,
                  borderRadius: `${borderRadius / 2}px`,
                  boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)'
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="aspect-square rounded"
                style={{
                  backgroundColor: secondaryColor,
                  borderRadius: `${borderRadius / 2}px`,
                  boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)'
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="aspect-square rounded"
                style={{
                  backgroundColor: primaryShade1,
                  borderRadius: `${borderRadius / 2}px`,
                  boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)'
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="aspect-square rounded relative overflow-hidden"
                style={{
                  backgroundColor: secondaryShade1,
                  borderRadius: `${borderRadius / 2}px`,
                  boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)'
                }}
              >
                {/* Nested squares to show depth using primary colors */}
                <div 
                  className="absolute inset-2 rounded"
                  style={{
                    backgroundColor: primaryColor + '80',
                    borderRadius: `${borderRadius / 3}px`
                  }}
                />
                <div 
                  className="absolute inset-4 rounded"
                  style={{
                    backgroundColor: secondaryColor + '60',
                    borderRadius: `${borderRadius / 4}px`
                  }}
                />
              </motion.div>
            </div>
          </div>
        </div>
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

const DesignSystemSection = ({ toolInvocation }: DesignSystemSectionProps) => {
  const { state } = toolInvocation;
  
  const layoutKey = React.useMemo(() => `design-system-${Math.random().toString(36).substring(2, 9)}`, []);

  if (state === 'call') {
    const animatedColors = [
      'hsl(220, 70%, 50%)',
      'hsl(280, 60%, 55%)',
      'hsl(340, 75%, 55%)',
      'hsl(25, 80%, 55%)',
      'hsl(160, 60%, 45%)',
      'hsl(45, 85%, 60%)',
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
            <Layers className="h-4 w-4 mr-2" />
            Design System
          </Badge>
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground font-medium">Creating design system...</span>
          </div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-4"
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
            
            {/* Typography preview loading */}
            <div className="space-y-3">
              <motion.div 
                className="h-8 bg-muted/50 rounded animate-pulse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              />
              <motion.div 
                className="h-4 bg-muted/30 rounded animate-pulse w-3/4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              />
            </div>
          </motion.div>
        </div>

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
            <span className="text-center">Generating colors, typography, and design tokens</span>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (state === 'result') {
    const result = toolInvocation.result;
    
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
            <Layers className="h-3 w-3 mr-1.5" />
            Error
          </Badge>
          <span className="text-sm text-destructive">{result.error}</span>
        </motion.div>
      );
    }

    const designSystem = result?.designSystem;
    
    if (!designSystem) {
      return (
        <motion.div 
          className="flex items-center gap-3 p-3 sm:p-4 my-2 rounded-lg border border-border/50 bg-muted/30"
          variants={container}
          initial="hidden"
          animate="show"
          layoutId={layoutKey}
        >
          <Badge variant="outline" className="bg-primary/5 text-primary/80">
            <Layers className="h-3 w-3 mr-1.5" />
            Design System
          </Badge>
          <span className="text-sm text-muted-foreground">No design system data available</span>
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
              <Layers className="h-4 w-4 mr-2" />
              Design System
            </Badge>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <Badge variant="secondary" className="text-xs">
              {designSystem.style}
            </Badge>
          </div>
        </div>

        <div className="space-y-8 sm:space-y-12">
          {/* Optional design system header */}
          {(designSystem.name || designSystem.description) && (
            <div className="space-y-2 sm:space-y-3">
              {designSystem.name && (
                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{designSystem.name}</h2>
              )}
              {designSystem.description && (
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
                  {designSystem.description}
                </p>
              )}
            </div>
          )}

          {/* Colors Section */}
          <div className="space-y-8 sm:space-y-10">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Palette className="h-5 w-5 text-primary" />
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Colors
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <ColorCategoryDisplay category={designSystem.colors.primary} />
              <ColorCategoryDisplay category={designSystem.colors.secondary} />
              <ColorCategoryDisplay category={designSystem.colors.accent} />
              <ColorCategoryDisplay category={designSystem.colors.background} />
            </div>
          </div>

          {/* Typography Section */}
          <TypographyDisplay typography={designSystem.typography} />

          {/* Design Tokens Section */}
          <DesignTokensDisplay 
            spacing={designSystem.spacing} 
            tokens={designSystem.tokens} 
          />

          {/* Mock Hero Showcase */}
          <MockHeroShowcase designSystem={designSystem} />
        </div>
      </motion.div>
    );
  }

  return null;
};

export default DesignSystemSection;