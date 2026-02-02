import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('should merge class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const result = cn('base', isActive && 'active')
    expect(result).toContain('base')
    expect(result).toContain('active')
  })

  it('should handle falsy values', () => {
    const result = cn('base', false && 'hidden', undefined, null)
    expect(result).toBe('base')
  })

  it('should merge Tailwind classes correctly', () => {
    // Later classes should override earlier ones
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('should handle arrays of classes', () => {
    expect(cn(['px-2', 'py-1'])).toBe('px-2 py-1')
  })

  it('should handle objects with boolean values', () => {
    expect(cn({ 'bg-red-500': true, 'bg-blue-500': false })).toBe('bg-red-500')
  })

  it('should handle empty input', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
  })

  it('should handle complex Tailwind merging', () => {
    // Conflicting padding
    expect(cn('p-4', 'px-2')).toBe('p-4 px-2')
    
    // Background colors
    expect(cn('bg-slate-100', 'bg-blue-500')).toBe('bg-blue-500')
    
    // Responsive variants
    expect(cn('md:text-lg', 'md:text-xl')).toBe('md:text-xl')
  })
})
