/**
 * CareerFlow Design System
 *
 * Central export for all design system modules.
 *
 * @example
 * // Import everything
 * import { colors, button, flex } from '../styles';
 *
 * // Use tokens
 * const color = colors.primary[600];
 *
 * // Use component styles
 * <button style={button.primary}>Click me</button>
 *
 * // Use utilities
 * <div style={flex({ justify: 'space-between', gap: 4 })}>
 */

// =============================================================================
// DESIGN TOKENS
// =============================================================================

export {
    colors,
    typography,
    spacing,
    radius,
    shadows,
    transitions,
    zIndex,
    breakpoints,
    gradients,
    layout,
    // Types
    type ColorScale,
    type SemanticColors,
    type Spacing,
    type Radius,
    type Shadow,
} from './tokens';

// =============================================================================
// COMPONENT STYLES
// =============================================================================

export {
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
    components,
} from './components';

// =============================================================================
// UTILITIES
// =============================================================================

export {
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
    utils,
} from './utils';

// =============================================================================
// CONVENIENCE RE-EXPORTS
// =============================================================================

import { components } from './components';
import { utils } from './utils';
import * as tokens from './tokens';

export const ds = {
    ...tokens,
    ...components,
    ...utils,
};

export default ds;
