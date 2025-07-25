'use client';

import { useWebsiteSettings } from '@/contexts/website-settings-extended';
import { useEffect } from 'react';

// Helper function to convert hex to RGB
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `${r}, ${g}, ${b}`;
};

// Helper function to convert hex to HSL
const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

// Helper function to lighten/darken a color
const adjustColor = (hex: string, amount: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);
  
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const DynamicStyles: React.FC = () => {
  const { settings, loading } = useWebsiteSettings();

  useEffect(() => {
    if (loading) return;

    const primaryColor = settings.theme_primary_color || '#2563eb';
    const secondaryColor = settings.theme_secondary_color || '#1e40af';
    const accentColor = settings.theme_accent_color || '#3b82f6';
    const fontFamily = settings.theme_font_family || 'Inter';
    const fontSize = settings.theme_font_size || 'medium';
    const borderRadius = settings.theme_border_radius || 'medium';

    // Generate color variations
    const primaryRgb = hexToRgb(primaryColor);
    const secondaryRgb = hexToRgb(secondaryColor);
    const accentRgb = hexToRgb(accentColor);
    
    const primaryHsl = hexToHsl(primaryColor);
    const secondaryHsl = hexToHsl(secondaryColor);
    const accentHsl = hexToHsl(accentColor);

    // Generate lighter and darker variations
    const primaryLight = adjustColor(primaryColor, 40);
    const primaryDark = adjustColor(primaryColor, -40);
    const secondaryLight = adjustColor(secondaryColor, 40);
    const secondaryDark = adjustColor(secondaryColor, -40);
    const accentLight = adjustColor(accentColor, 40);
    const accentDark = adjustColor(accentColor, -40);

    // Font size mappings
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };

    // Border radius mappings
    const borderRadiusMap = {
      none: '0px',
      small: '4px',
      medium: '8px',
      large: '16px'
    };

    // Create dynamic CSS
    const dynamicCSS = `
      :root {
        /* Primary Colors */
        --color-primary: ${primaryColor};
        --color-primary-rgb: ${primaryRgb};
        --color-primary-hsl: ${primaryHsl};
        --color-primary-light: ${primaryLight};
        --color-primary-dark: ${primaryDark};
        
        /* Secondary Colors */
        --color-secondary: ${secondaryColor};
        --color-secondary-rgb: ${secondaryRgb};
        --color-secondary-hsl: ${secondaryHsl};
        --color-secondary-light: ${secondaryLight};
        --color-secondary-dark: ${secondaryDark};
        
        /* Accent Colors */
        --color-accent: ${accentColor};
        --color-accent-rgb: ${accentRgb};
        --color-accent-hsl: ${accentHsl};
        --color-accent-light: ${accentLight};
        --color-accent-dark: ${accentDark};
        
        /* Typography */
        --font-family-primary: '${fontFamily}', sans-serif;
        --font-size-base: ${fontSizeMap[fontSize as keyof typeof fontSizeMap]};
        
        /* Border Radius */
        --border-radius-base: ${borderRadiusMap[borderRadius as keyof typeof borderRadiusMap]};
        
        /* Gradients */
        --gradient-primary: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
        --gradient-secondary: linear-gradient(135deg, ${secondaryColor} 0%, ${accentColor} 100%);
        --gradient-accent: linear-gradient(135deg, ${accentColor} 0%, ${primaryColor} 100%);
        
        /* Shadows with primary color */
        --shadow-primary: 0 4px 14px 0 rgba(${primaryRgb}, 0.15);
        --shadow-primary-lg: 0 10px 25px -3px rgba(${primaryRgb}, 0.2);
        
        /* Update Tailwind CSS variables */
        --primary: ${primaryHsl};
        --primary-foreground: 0 0% 98%;
        --secondary: ${secondaryHsl};
        --secondary-foreground: 0 0% 98%;
        --accent: ${accentHsl};
        --accent-foreground: 0 0% 98%;
      }
      
      /* Apply dynamic styles */
      body {
        font-family: var(--font-family-primary);
        font-size: var(--font-size-base);
      }
      
      /* Button styles */
      .btn-primary {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: white;
      }
      
      .btn-primary:hover {
        background: var(--color-primary-dark);
        border-color: var(--color-primary-dark);
      }
      
      .btn-secondary {
        background: var(--color-secondary);
        border-color: var(--color-secondary);
        color: white;
      }
      
      .btn-secondary:hover {
        background: var(--color-secondary-dark);
        border-color: var(--color-secondary-dark);
      }
      
      .btn-gradient {
        background: var(--gradient-primary);
        border: none;
        color: white;
      }
      
      .btn-gradient:hover {
        background: var(--gradient-secondary);
        transform: translateY(-2px);
        box-shadow: var(--shadow-primary-lg);
      }
      
      /* Text gradients */
      .text-gradient {
        background: var(--gradient-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      /* Link styles */
      a {
        color: var(--color-primary);
      }
      
      a:hover {
        color: var(--color-primary-dark);
      }
      
      /* Border radius */
      .rounded-dynamic {
        border-radius: var(--border-radius-base);
      }
      
      /* Card styles */
      .card-primary {
        border-color: var(--color-primary);
      }
      
      .card-primary:hover {
        box-shadow: var(--shadow-primary);
      }
      
      /* Input focus styles */
      .input-focus:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
      }
      
      /* Background utilities */
      .bg-primary-custom {
        background-color: var(--color-primary);
      }
      
      .bg-secondary-custom {
        background-color: var(--color-secondary);
      }
      
      .bg-accent-custom {
        background-color: var(--color-accent);
      }
      
      .bg-gradient-custom {
        background: var(--gradient-primary);
      }
      
      /* Text color utilities */
      .text-primary-custom {
        color: var(--color-primary);
      }
      
      .text-secondary-custom {
        color: var(--color-secondary);
      }
      
      .text-accent-custom {
        color: var(--color-accent);
      }
      
      /* Border utilities */
      .border-primary-custom {
        border-color: var(--color-primary);
      }
      
      .border-secondary-custom {
        border-color: var(--color-secondary);
      }
      
      .border-accent-custom {
        border-color: var(--color-accent);
      }
      
      /* Icon colors */
      .icon-primary {
        color: var(--color-primary);
      }
      
      .icon-secondary {
        color: var(--color-secondary);
      }
      
      .icon-accent {
        color: var(--color-accent);
      }
      
      /* Glow effects */
      .glow-primary {
        box-shadow: 0 0 20px rgba(var(--color-primary-rgb), 0.3);
      }
      
      .glow-secondary {
        box-shadow: 0 0 20px rgba(var(--color-secondary-rgb), 0.3);
      }
      
      .glow-accent {
        box-shadow: 0 0 20px rgba(var(--color-accent-rgb), 0.3);
      }
      
      /* Custom CSS from admin panel */
      ${settings.custom_css || ''}
    `;

    // Remove existing dynamic styles
    const existingStyle = document.getElementById('dynamic-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Inject new styles
    const styleElement = document.createElement('style');
    styleElement.id = 'dynamic-styles';
    styleElement.textContent = dynamicCSS;
    document.head.appendChild(styleElement);

  }, [settings, loading]);

  return null;
};