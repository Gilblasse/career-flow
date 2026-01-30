/**
 * Style Utilities - CareerFlow Design System
 *
 * Utility functions for creating dynamic styles and common patterns.
 */

import React from 'react';
import { colors, spacing, radius, shadows, transitions, gradients } from './tokens';

type CSSProperties = React.CSSProperties;

// =============================================================================
// STYLE MERGE UTILITY
// =============================================================================

/**
 * Merges multiple style objects, with later objects taking precedence.
 * Filters out undefined values.
 */
export const mergeStyles = (...styles: (CSSProperties | undefined)[]): CSSProperties => {
    return styles.reduce<CSSProperties>((acc, style) => {
        if (style) {
            return { ...acc, ...style };
        }
        return acc;
    }, {});
};

/**
 * Conditionally apply styles based on a condition.
 */
export const conditionalStyle = (
    condition: boolean,
    trueStyle: CSSProperties,
    falseStyle?: CSSProperties
): CSSProperties => {
    return condition ? trueStyle : (falseStyle || {});
};

// =============================================================================
// LAYOUT UTILITIES
// =============================================================================

/**
 * Create a flex container with common options.
 */
export const flex = (options?: {
    direction?: 'row' | 'column';
    align?: CSSProperties['alignItems'];
    justify?: CSSProperties['justifyContent'];
    gap?: keyof typeof spacing;
    wrap?: boolean;
}): CSSProperties => ({
    display: 'flex',
    flexDirection: options?.direction || 'row',
    alignItems: options?.align || 'stretch',
    justifyContent: options?.justify || 'flex-start',
    gap: options?.gap ? spacing[options.gap] : undefined,
    flexWrap: options?.wrap ? 'wrap' : undefined,
});

/**
 * Create a grid container with common options.
 */
export const grid = (options: {
    columns: number | string;
    gap?: keyof typeof spacing;
    rowGap?: keyof typeof spacing;
    columnGap?: keyof typeof spacing;
}): CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: typeof options.columns === 'number'
        ? `repeat(${options.columns}, 1fr)`
        : options.columns,
    gap: options.gap ? spacing[options.gap] : undefined,
    rowGap: options.rowGap ? spacing[options.rowGap] : undefined,
    columnGap: options.columnGap ? spacing[options.columnGap] : undefined,
});

/**
 * Center content both horizontally and vertically.
 */
export const center: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

/**
 * Stack items vertically with optional gap.
 */
export const stack = (gap?: keyof typeof spacing): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    gap: gap ? spacing[gap] : undefined,
});

/**
 * Row of items with optional gap.
 */
export const row = (gap?: keyof typeof spacing): CSSProperties => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap ? spacing[gap] : undefined,
});

/**
 * Space items apart.
 */
export const spaceBetween: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

// =============================================================================
// SIZE UTILITIES
// =============================================================================

/**
 * Set both width and height to the same value.
 */
export const square = (size: string | number): CSSProperties => ({
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
});

/**
 * Fill available space.
 */
export const fullSize: CSSProperties = {
    width: '100%',
    height: '100%',
};

// =============================================================================
// VISUAL UTILITIES
// =============================================================================

/**
 * Create a background with gradient and optional shadow glow.
 */
export const gradientBackground = (
    type: keyof typeof gradients,
    withGlow?: boolean
): CSSProperties => ({
    background: gradients[type],
    boxShadow: withGlow ? shadows.glow.primary : undefined,
});

/**
 * Create a colored background with matching text color.
 */
export const coloredBackground = (
    colorKey: 'primary' | 'success' | 'warning' | 'error' | 'gray',
    intensity: 'subtle' | 'medium' | 'strong' = 'subtle'
): CSSProperties => {
    const bgShade = intensity === 'subtle' ? 50 : intensity === 'medium' ? 100 : 500;
    const textShade = intensity === 'strong' ? 50 : intensity === 'medium' ? 700 : 600;

    return {
        backgroundColor: colors[colorKey][bgShade as keyof typeof colors.primary],
        color: colors[colorKey][textShade as keyof typeof colors.primary],
    };
};

/**
 * Apply hover-ready styles (use with onMouseEnter/Leave for full effect).
 */
export const interactive = (options?: {
    cursor?: CSSProperties['cursor'];
    transition?: string;
}): CSSProperties => ({
    cursor: options?.cursor || 'pointer',
    transition: options?.transition || transitions.default,
});

/**
 * Truncate text with ellipsis.
 */
export const truncate: CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

/**
 * Clamp text to a specific number of lines.
 */
export const lineClamp = (lines: number): CSSProperties => ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
});

/**
 * Visually hidden but accessible to screen readers.
 */
export const srOnly: CSSProperties = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
};

// =============================================================================
// POSITION UTILITIES
// =============================================================================

/**
 * Absolute positioning with optional offsets.
 */
export const absolute = (position?: {
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
}): CSSProperties => ({
    position: 'absolute',
    top: position?.top,
    right: position?.right,
    bottom: position?.bottom,
    left: position?.left,
});

/**
 * Fixed positioning with optional offsets.
 */
export const fixed = (position?: {
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
}): CSSProperties => ({
    position: 'fixed',
    top: position?.top,
    right: position?.right,
    bottom: position?.bottom,
    left: position?.left,
});

/**
 * Sticky positioning.
 */
export const sticky = (top: string | number = 0): CSSProperties => ({
    position: 'sticky',
    top,
});

/**
 * Cover entire parent.
 */
export const cover: CSSProperties = {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
};

// =============================================================================
// DISABLED STATE
// =============================================================================

/**
 * Apply disabled visual state.
 */
export const disabled = (isDisabled: boolean): CSSProperties =>
    isDisabled
        ? {
            opacity: 0.5,
            cursor: 'not-allowed',
            pointerEvents: 'none',
        }
        : {};

// =============================================================================
// RESPONSIVE HELPERS (for inline media query workarounds)
// =============================================================================

/**
 * Note: For responsive styles, prefer CSS modules or styled-components.
 * These utilities are for JavaScript-based responsive logic.
 */

export const isSmallScreen = (): boolean =>
    typeof window !== 'undefined' && window.innerWidth < 768;

export const isMediumScreen = (): boolean =>
    typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;

export const isLargeScreen = (): boolean =>
    typeof window !== 'undefined' && window.innerWidth >= 1024;

// =============================================================================
// CSS KEYFRAMES (for use with style tag)
// =============================================================================

export const keyframes = {
    spin: `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `,
    pulse: `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `,
    fadeIn: `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `,
    slideUp: `
        @keyframes slideUp {
            from { transform: translateY(10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `,
    scaleIn: `
        @keyframes scaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
    `,
};

/**
 * Get all keyframes as a single string for injection.
 */
export const allKeyframes = Object.values(keyframes).join('\n');

// =============================================================================
// EXPORT UTILITIES OBJECT
// =============================================================================

export const utils = {
    mergeStyles,
    conditionalStyle,
    flex,
    grid,
    center,
    stack,
    row,
    spaceBetween,
    square,
    fullSize,
    gradientBackground,
    coloredBackground,
    interactive,
    truncate,
    lineClamp,
    srOnly,
    absolute,
    fixed,
    sticky,
    cover,
    disabled,
    keyframes,
    allKeyframes,
};

export default utils;
