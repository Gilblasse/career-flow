/**
 * Component Styles - CareerFlow Design System
 *
 * Reusable component style definitions that can be spread into style props.
 * Import and use: style={{ ...components.card, ...customStyles }}
 */

import React from 'react';
import { colors, typography, spacing, radius, shadows, transitions } from './tokens';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

type CSSProperties = React.CSSProperties;

// =============================================================================
// CARD STYLES
// =============================================================================

export const card = {
    base: {
        backgroundColor: colors.background.card,
        borderRadius: radius['3xl'],
        padding: spacing[9],
        boxShadow: shadows.sm,
        border: `1px solid ${colors.border.light}`,
    } as CSSProperties,

    flat: {
        backgroundColor: colors.background.card,
        borderRadius: radius['3xl'],
        padding: spacing[9],
        border: `1px solid ${colors.border.default}`,
    } as CSSProperties,

    elevated: {
        backgroundColor: colors.background.card,
        borderRadius: radius['3xl'],
        padding: spacing[9],
        boxShadow: shadows.md,
    } as CSSProperties,

    interactive: {
        backgroundColor: colors.background.card,
        borderRadius: radius['3xl'],
        padding: spacing[9],
        boxShadow: shadows.sm,
        border: `1px solid ${colors.border.light}`,
        cursor: 'pointer',
        transition: transitions.default,
    } as CSSProperties,

    accent: (color: 'primary' | 'success' | 'warning' | 'error') => ({
        backgroundColor: colors.background.card,
        borderRadius: radius['3xl'],
        padding: spacing[9],
        boxShadow: shadows.sm,
        borderLeft: `4px solid ${colors[color][500]}`,
    } as CSSProperties),
};

// =============================================================================
// BUTTON STYLES
// =============================================================================

export const button = {
    base: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        borderRadius: radius.xl,
        fontWeight: typography.fontWeight.semibold,
        fontSize: typography.fontSize.base,
        cursor: 'pointer',
        transition: transitions.default,
        border: 'none',
        outline: 'none',
    } as CSSProperties,

    primary: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        backgroundColor: colors.primary[600],
        color: colors.text.inverse,
        border: 'none',
        padding: `${spacing[4]} ${spacing[8]}`,
        borderRadius: radius.xl,
        fontWeight: typography.fontWeight.semibold,
        fontSize: typography.fontSize.base,
        cursor: 'pointer',
        transition: transitions.default,
    } as CSSProperties,

    secondary: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        backgroundColor: colors.primary[50],
        color: colors.primary[600],
        border: 'none',
        padding: `${spacing[4]} ${spacing[8]}`,
        borderRadius: radius.xl,
        fontWeight: typography.fontWeight.medium,
        fontSize: typography.fontSize.base,
        cursor: 'pointer',
        transition: transitions.default,
    } as CSSProperties,

    outline: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        backgroundColor: 'transparent',
        color: colors.primary[600],
        border: `1px solid ${colors.primary[600]}`,
        padding: `${spacing[4]} ${spacing[8]}`,
        borderRadius: radius.xl,
        fontWeight: typography.fontWeight.medium,
        fontSize: typography.fontSize.base,
        cursor: 'pointer',
        transition: transitions.default,
    } as CSSProperties,

    ghost: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        padding: spacing[3],
        borderRadius: radius.lg,
        cursor: 'pointer',
        color: colors.text.muted,
        transition: transitions.default,
    } as CSSProperties,

    danger: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        backgroundColor: colors.error[50],
        color: colors.error[600],
        border: 'none',
        padding: `${spacing[4]} ${spacing[8]}`,
        borderRadius: radius.xl,
        fontWeight: typography.fontWeight.medium,
        fontSize: typography.fontSize.base,
        cursor: 'pointer',
        transition: transitions.default,
    } as CSSProperties,

    success: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        backgroundColor: colors.success[50],
        color: colors.success[600],
        border: 'none',
        padding: `${spacing[4]} ${spacing[8]}`,
        borderRadius: radius.xl,
        fontWeight: typography.fontWeight.medium,
        fontSize: typography.fontSize.base,
        cursor: 'pointer',
        transition: transitions.default,
    } as CSSProperties,

    icon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        padding: spacing[3],
        borderRadius: radius.lg,
        cursor: 'pointer',
        color: colors.text.muted,
        transition: transitions.default,
        width: '36px',
        height: '36px',
    } as CSSProperties,

    // Size variants
    sm: {
        padding: `${spacing[2]} ${spacing[5]}`,
        fontSize: typography.fontSize.sm,
    } as CSSProperties,

    lg: {
        padding: `${spacing[5]} ${spacing[9]}`,
        fontSize: typography.fontSize.lg,
    } as CSSProperties,
};

// =============================================================================
// INPUT STYLES
// =============================================================================

export const input = {
    base: {
        width: '100%',
        padding: `${spacing[4]} ${spacing[6]}`,
        borderRadius: radius.xl,
        border: `1px solid ${colors.border.default}`,
        fontSize: typography.fontSize.base,
        fontFamily: typography.fontFamily.sans,
        outline: 'none',
        transition: transitions.colors,
        backgroundColor: colors.background.card,
    } as CSSProperties,

    textarea: {
        width: '100%',
        padding: `${spacing[4]} ${spacing[6]}`,
        borderRadius: radius.xl,
        border: `1px solid ${colors.border.default}`,
        fontSize: typography.fontSize.base,
        fontFamily: typography.fontFamily.sans,
        outline: 'none',
        transition: transitions.colors,
        backgroundColor: colors.background.card,
        resize: 'vertical' as const,
        minHeight: '80px',
    } as CSSProperties,

    select: {
        width: '100%',
        padding: `${spacing[4]} ${spacing[6]}`,
        borderRadius: radius.xl,
        border: `1px solid ${colors.border.default}`,
        fontSize: typography.fontSize.base,
        fontFamily: typography.fontFamily.sans,
        outline: 'none',
        transition: transitions.colors,
        backgroundColor: colors.background.card,
        cursor: 'pointer',
    } as CSSProperties,

    // With icon (left padding)
    withIcon: {
        paddingLeft: '40px',
    } as CSSProperties,

    // Sizes
    sm: {
        padding: `${spacing[3]} ${spacing[5]}`,
        fontSize: typography.fontSize.sm,
    } as CSSProperties,

    lg: {
        padding: `${spacing[5]} ${spacing[7]}`,
        fontSize: typography.fontSize.lg,
    } as CSSProperties,
};

// =============================================================================
// BADGE / TAG STYLES
// =============================================================================

export const badge = {
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing[2],
        padding: `${spacing[1]} ${spacing[5]}`,
        borderRadius: radius.full,
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
    } as CSSProperties,

    primary: {
        backgroundColor: colors.primary[50],
        color: colors.primary[600],
    } as CSSProperties,

    success: {
        backgroundColor: colors.success[50],
        color: colors.success[600],
    } as CSSProperties,

    warning: {
        backgroundColor: colors.warning[50],
        color: colors.warning[800],
    } as CSSProperties,

    error: {
        backgroundColor: colors.error[50],
        color: colors.error[600],
    } as CSSProperties,

    neutral: {
        backgroundColor: colors.gray[100],
        color: colors.gray[600],
    } as CSSProperties,
};

// =============================================================================
// MODAL STYLES
// =============================================================================

export const modal = {
    overlay: {
        position: 'fixed' as const,
        inset: 0,
        backgroundColor: colors.background.overlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    } as CSSProperties,

    content: {
        backgroundColor: colors.background.card,
        borderRadius: radius['3xl'],
        padding: spacing[9],
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: shadows.xl,
    } as CSSProperties,

    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[9],
    } as CSSProperties,

    title: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
        margin: 0,
    } as CSSProperties,

    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: spacing[5],
        marginTop: spacing[9],
        paddingTop: spacing[7],
        borderTop: `1px solid ${colors.border.default}`,
    } as CSSProperties,
};

// =============================================================================
// TAB STYLES
// =============================================================================

export const tab = {
    container: {
        display: 'flex',
        gap: spacing[3],
        backgroundColor: colors.gray[50],
        padding: spacing[2],
        borderRadius: radius['2xl'],
    } as CSSProperties,

    item: (active: boolean) => ({
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        padding: `${spacing[4]} ${spacing[7]}`,
        borderRadius: radius.lg,
        border: 'none',
        backgroundColor: active ? colors.primary[600] : 'transparent',
        color: active ? colors.text.inverse : colors.text.muted,
        fontWeight: active ? typography.fontWeight.semibold : typography.fontWeight.medium,
        fontSize: typography.fontSize.sm,
        cursor: 'pointer',
        transition: transitions.default,
    } as CSSProperties),
};

// =============================================================================
// AVATAR / ICON CONTAINER STYLES
// =============================================================================

export const avatar = {
    sm: {
        width: '32px',
        height: '32px',
        borderRadius: radius.full,
        objectFit: 'cover' as const,
    } as CSSProperties,

    md: {
        width: '48px',
        height: '48px',
        borderRadius: radius.full,
        objectFit: 'cover' as const,
    } as CSSProperties,

    lg: {
        width: '72px',
        height: '72px',
        borderRadius: radius.full,
        objectFit: 'cover' as const,
    } as CSSProperties,

    xl: {
        width: '80px',
        height: '80px',
        borderRadius: radius.full,
        objectFit: 'cover' as const,
    } as CSSProperties,
};

export const iconContainer = {
    sm: {
        width: '32px',
        height: '32px',
        borderRadius: radius.lg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as CSSProperties,

    md: {
        width: '40px',
        height: '40px',
        borderRadius: radius.xl,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as CSSProperties,

    lg: {
        width: '48px',
        height: '48px',
        borderRadius: radius['2xl'],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as CSSProperties,

    xl: {
        width: '64px',
        height: '64px',
        borderRadius: radius['3xl'],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as CSSProperties,

    circle: {
        width: '72px',
        height: '72px',
        borderRadius: radius.full,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as CSSProperties,
};

// =============================================================================
// LABEL STYLES
// =============================================================================

export const label = {
    base: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
        display: 'block',
        marginBottom: spacing[2],
    } as CSSProperties,

    required: {
        color: colors.error[500],
        marginLeft: spacing[1],
    } as CSSProperties,
};

// =============================================================================
// LIST ITEM STYLES
// =============================================================================

export const listItem = {
    base: {
        display: 'flex',
        alignItems: 'center',
        gap: spacing[5],
        padding: `${spacing[5]} ${spacing[7]}`,
        borderRadius: radius.xl,
        transition: transitions.default,
    } as CSSProperties,

    interactive: {
        display: 'flex',
        alignItems: 'center',
        gap: spacing[5],
        padding: `${spacing[5]} ${spacing[7]}`,
        borderRadius: radius.xl,
        transition: transitions.default,
        cursor: 'pointer',
        border: 'none',
        width: '100%',
        textAlign: 'left' as const,
        backgroundColor: 'transparent',
    } as CSSProperties,

    active: {
        backgroundColor: colors.primary[50],
        color: colors.primary[600],
    } as CSSProperties,
};

// =============================================================================
// ALERT / MESSAGE STYLES
// =============================================================================

export const alert = {
    base: {
        display: 'flex',
        alignItems: 'center',
        gap: spacing[4],
        padding: `${spacing[5]} ${spacing[7]}`,
        borderRadius: radius.xl,
        fontSize: typography.fontSize.base,
    } as CSSProperties,

    info: {
        backgroundColor: colors.primary[50],
        color: colors.primary[700],
    } as CSSProperties,

    success: {
        backgroundColor: colors.success[50],
        color: colors.success[700],
    } as CSSProperties,

    warning: {
        backgroundColor: colors.warning[50],
        color: colors.warning[800],
    } as CSSProperties,

    error: {
        backgroundColor: colors.error[50],
        color: colors.error[700],
    } as CSSProperties,
};

// =============================================================================
// PROGRESS STYLES
// =============================================================================

export const progress = {
    container: {
        width: '100%',
        height: '8px',
        backgroundColor: colors.gray[200],
        borderRadius: radius.full,
        overflow: 'hidden',
    } as CSSProperties,

    bar: (percent: number, color: 'primary' | 'success' | 'warning' | 'error' = 'primary') => ({
        width: `${percent}%`,
        height: '100%',
        backgroundColor: colors[color][500],
        borderRadius: radius.full,
        transition: 'width 300ms ease',
    } as CSSProperties),

    step: (active: boolean, complete: boolean) => ({
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        padding: `${spacing[3]} ${spacing[7]}`,
        borderRadius: radius.full,
        backgroundColor: complete ? colors.success[50] : active ? colors.primary[50] : colors.gray[50],
        color: complete ? colors.success[600] : active ? colors.primary[600] : colors.text.muted,
        fontWeight: typography.fontWeight.medium,
        fontSize: typography.fontSize.sm,
        transition: transitions.slow,
    } as CSSProperties),

    stepConnector: (complete: boolean) => ({
        width: '32px',
        height: '2px',
        backgroundColor: complete ? colors.success[500] : colors.gray[200],
        borderRadius: '1px',
        transition: transitions.slow,
    } as CSSProperties),
};

// =============================================================================
// DIVIDER STYLES
// =============================================================================

export const divider = {
    horizontal: {
        width: '100%',
        height: '1px',
        backgroundColor: colors.border.default,
        margin: `${spacing[9]} 0`,
    } as CSSProperties,

    vertical: {
        width: '1px',
        height: '100%',
        backgroundColor: colors.border.default,
        margin: `0 ${spacing[7]}`,
    } as CSSProperties,
};

// =============================================================================
// SKELETON / LOADING STYLES
// =============================================================================

export const skeleton = {
    base: {
        backgroundColor: colors.gray[200],
        borderRadius: radius.lg,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    } as CSSProperties,

    text: {
        height: '16px',
        backgroundColor: colors.gray[200],
        borderRadius: radius.md,
    } as CSSProperties,

    circle: (size: number) => ({
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: colors.gray[200],
        borderRadius: radius.full,
    } as CSSProperties),
};

// =============================================================================
// EXPORT ALL COMPONENTS
// =============================================================================

export const components = {
    card,
    button,
    input,
    badge,
    modal,
    tab,
    avatar,
    iconContainer,
    label,
    listItem,
    alert,
    progress,
    divider,
    skeleton,
};

export default components;
