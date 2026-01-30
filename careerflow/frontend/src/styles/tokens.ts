/**
 * Design Tokens - CareerFlow Design System
 *
 * This file contains all design tokens used throughout the application.
 * Import these tokens instead of hardcoding values to ensure consistency.
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const colors = {
    // Primary Brand Colors
    primary: {
        50: '#EEF2FF',
        100: '#E0E7FF',
        200: '#C7D2FE',
        300: '#A5B4FC',
        400: '#818CF8',
        500: '#6366F1',  // Main primary
        600: '#4F46E5',  // Primary action
        700: '#4338CA',
        800: '#3730A3',
        900: '#312E81',
    },

    // Secondary / Purple Accent
    purple: {
        50: '#F5F3FF',
        100: '#EDE9FE',
        200: '#DDD6FE',
        300: '#C4B5FD',
        400: '#A78BFA',
        500: '#8B5CF6',
        600: '#7C3AED',
        700: '#6D28D9',
        800: '#5B21B6',
        900: '#4C1D95',
    },

    // Success / Green
    success: {
        50: '#ECFDF5',
        100: '#D1FAE5',
        200: '#A7F3D0',
        300: '#6EE7B7',
        400: '#34D399',
        500: '#10B981',
        600: '#059669',
        700: '#047857',
        800: '#065F46',
        900: '#064E3B',
    },

    // Warning / Amber
    warning: {
        50: '#FFFBEB',
        100: '#FEF3C7',
        200: '#FDE68A',
        300: '#FCD34D',
        400: '#FBBF24',
        500: '#F59E0B',
        600: '#D97706',
        700: '#B45309',
        800: '#92400E',
        900: '#78350F',
    },

    // Error / Red
    error: {
        50: '#FEF2F2',
        100: '#FEE2E2',
        200: '#FECACA',
        300: '#FCA5A5',
        400: '#F87171',
        500: '#EF4444',
        600: '#DC2626',
        700: '#B91C1C',
        800: '#991B1B',
        900: '#7F1D1D',
    },

    // Neutral / Gray
    gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
    },

    // Semantic Colors
    text: {
        primary: '#111827',
        secondary: '#4B5563',
        muted: '#6B7280',
        placeholder: '#9CA3AF',
        inverse: '#FFFFFF',
    },

    background: {
        base: '#F8F9FC',
        card: '#FFFFFF',
        sidebar: '#FFFFFF',
        overlay: 'rgba(0, 0, 0, 0.4)',
        hover: '#F9FAFB',
    },

    border: {
        light: '#F3F4F6',
        default: '#E5E7EB',
        dark: '#D1D5DB',
    },
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
    fontFamily: {
        sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
    },

    fontSize: {
        xs: '12px',
        sm: '13px',
        base: '14px',
        md: '15px',
        lg: '16px',
        xl: '18px',
        '2xl': '20px',
        '3xl': '22px',
        '4xl': '26px',
        '5xl': '28px',
    },

    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },

    lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.7',
    },

    letterSpacing: {
        tight: '-0.02em',
        normal: '0',
        wide: '0.05em',
        wider: '0.1em',
    },
} as const;

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
    0: '0',
    1: '4px',
    2: '6px',
    3: '8px',
    4: '10px',
    5: '12px',
    6: '14px',
    7: '16px',
    8: '20px',
    9: '24px',
    10: '28px',
    11: '32px',
    12: '40px',
    13: '48px',
    14: '60px',
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const radius = {
    none: '0',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '10px',
    '2xl': '12px',
    '3xl': '16px',
    full: '9999px',
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows = {
    none: 'none',
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    paper: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
    glow: {
        primary: '0 10px 40px -10px rgba(79, 70, 229, 0.5)',
        success: '0 10px 40px -10px rgba(16, 185, 129, 0.5)',
        error: '0 10px 40px -10px rgba(239, 68, 68, 0.5)',
    },
} as const;

// =============================================================================
// TRANSITIONS
// =============================================================================

export const transitions = {
    duration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
    },
    easing: {
        default: 'ease',
        in: 'ease-in',
        out: 'ease-out',
        inOut: 'ease-in-out',
    },
    // Pre-composed transitions
    default: 'all 200ms ease',
    fast: 'all 150ms ease',
    slow: 'all 300ms ease',
    colors: 'color 200ms ease, background-color 200ms ease, border-color 200ms ease',
    transform: 'transform 200ms ease',
    opacity: 'opacity 200ms ease',
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
    base: 0,
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    modal: 1000,
    popover: 1100,
    tooltip: 1200,
} as const;

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1440px',
} as const;

// =============================================================================
// GRADIENTS
// =============================================================================

export const gradients = {
    primary: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    primarySubtle: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    error: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    neutral: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
} as const;

// =============================================================================
// LAYOUT
// =============================================================================

export const layout = {
    sidebarWidth: '255px',
    headerHeight: '70px',
    maxContentWidth: '1400px',
    cardPadding: '24px',
    pagePadding: '24px',
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ColorScale = typeof colors.primary;
export type SemanticColors = typeof colors.text;
export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
export type Shadow = keyof typeof shadows;
