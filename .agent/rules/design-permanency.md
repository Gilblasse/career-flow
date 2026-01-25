---
trigger: always_on
---

---
name: design-permanency
description: Enforces surgical precision in code changes - only explicitly requested modifications are allowed, with zero unintended side effects or drive-by improvements.
---

# Design Permanency Skill

## Core Principle

**SURGICAL PRECISION ONLY**: When a specific edit is requested, only that explicitly scoped change may be applied. No additional refactors, visual tweaks, behavioral changes, or "drive-by improvements" are allowed unless they are explicitly requested.

## When to Use This Skill

Use this skill for **EVERY code modification request** to ensure zero unintended changes outside the defined scope.

## The Iron Rules

### 1. Explicit Scope Only
- ✅ **DO**: Make only the changes explicitly described in the user's request
- ❌ **DON'T**: Add improvements, optimizations, or refactors not explicitly requested
- ❌ **DON'T**: "Fix" nearby code that seems suboptimal
- ❌ **DON'T**: Update formatting, spacing, or style unless specifically asked

### 2. Zero Side Effects
- ✅ **DO**: Preserve all existing behavior outside the change scope
- ❌ **DON'T**: Modify function signatures unless explicitly requested
- ❌ **DON'T**: Change variable names for "clarity"
- ❌ **DON'T**: Reorganize imports, file structure, or code organization
- ❌ **DON'T**: Update dependencies or package versions

### 3. No Drive-By Improvements
- ✅ **DO**: Leave surrounding code exactly as-is
- ❌ **DON'T**: Add error handling not requested
- ❌ **DON'T**: Add comments or documentation not requested
- ❌ **DON'T**: Extract functions or components for "better organization"
- ❌ **DON'T**: Add TypeScript types or improve existing types
- ❌ **DON'T**: Add accessibility features not requested
- ❌ **DON'T**: Optimize performance unless specifically asked

### 4. Visual Preservation
- ✅ **DO**: Maintain exact visual appearance unless change explicitly affects it
- ❌ **DON'T**: Adjust colors, spacing, fonts, or layout
- ❌ **DON'NOT**: Update CSS/styles outside the explicit change
- ❌ **DON'T**: Add animations or transitions
- ❌ **DON'T**: Modify responsive breakpoints

### 5. Behavioral Preservation
- ✅ **DO**: Maintain exact user interactions unless explicitly changing them
- ❌ **DON'T**: Add new event handlers or listeners
- ❌ **DON'T**: Change validation logic or business rules
- ❌ **DON'T**: Modify API calls or data fetching patterns
- ❌ **DON'T**: Update state management approaches

## Pre-Change Checklist

Before making ANY code change, verify:

1. **Scope Definition**: Can I articulate the exact change in one sentence?
2. **Boundary Identification**: Do I know exactly which lines/files will change?
3. **Side Effect Analysis**: Will this change affect anything outside the explicit scope?
4. **Temptation Check**: Am I tempted to improve something nearby? If yes, STOP.
5. **User Confirmation**: If unclear, ASK the user to confirm the exact scope.

## Change Execution Process

### Step 1: Identify Exact Scope
```
Example User Request: "Change the submit button color to blue"

Exact Scope:
- File: src/components/Form.tsx
- Lines: 45-47 (button element with className)
- Change: Update button className or inline style to use blue color
- Preserve: All other styles, layout, behavior, text, icons
```

### Step 2: Plan Minimal Change
- Identify the minimum code modification required
- Avoid touching any other code, even in the same file
- Plan to use exact line ranges in replace_file_content

### Step 3: Execute with Precision
- Use `replace_file_content` or `multi_replace_file_content` with exact line ranges
- Replace only the specific code that must change
- Preserve all surrounding whitespace, formatting, comments

### Step 4: Verify Zero Drift
- Review the change to ensure nothing else was modified
- Confirm no imports, types, styles, or logic changed outside scope

## Examples

### ✅ CORRECT: Surgical Change
```
User Request: "Change the login button text from 'Sign In' to 'Login'"

Change Applied:
- File: src/components/LoginForm.tsx, Line 23
- Before: <button>Sign In</button>
- After: <button>Login</button>
- Result: ONLY button text changed, nothing else
```

### ❌ INCORRECT: Scope Creep
```
User Request: "Change the login button text from 'Sign In' to 'Login'"

Change Applied (WRONG):
- Changed button text ✗ (requested)
- Updated button styling to match design system ✗ (NOT requested)
- Added loading state to button ✗ (NOT requested)
- Extracted button to reusable component ✗ (NOT requested)
- Added TypeScript types for props ✗ (NOT requested)
```

## When You're Unsure

If you're uncertain about the scope:

1. **ASK**: "Just to confirm, you want me to [specific change]. Should I modify anything else?"
2. **CLARIFY**: "I can see opportunities to also improve [X, Y, Z]. Would you like me to include those?"
3. **WAIT**: Never assume additional changes are wanted

## Exceptions

The **ONLY** acceptable changes outside the explicit scope are **error-preventing fixes** strictly required to keep the system functional.

Permitted exceptions:

1. **Critical error fixes**  
   Changes required to prevent build failures, runtime crashes, or broken execution paths.

2. **Required imports**  
   Adding import statements that are *strictly necessary* for the approved change to compile or run.

3. **Type & lint corrections**  
   Minimal adjustments required to resolve TypeScript, schema, or linting errors directly caused by the approved change.

### Enforcement Rules

- No refactors, cleanups, renaming, or optimizations beyond what is **strictly required** to fix the error.
- No stylistic changes.
- No behavioral changes unrelated to the approved scope.


## Remember

**Your goal is to be a precise surgical tool, not a comprehensive renovation service.**

The user's existing code represents intentional decisions. Respect those decisions unless explicitly asked to change them.