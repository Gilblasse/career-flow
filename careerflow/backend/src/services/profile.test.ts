import { describe, it, expect } from 'vitest'
import { validateResumeProfiles } from './profile.js'
import type { ResumeProfile } from '../types.js'
import { 
  RESUME_PROFILE_MAX_LENGTH, 
  RESUME_PROFILE_MAX_COUNT, 
  RESUME_PROFILE_NAME_REGEX 
} from '../types.js'

// Helper to create valid profile
function createValidProfile(overrides: Partial<ResumeProfile> = {}): ResumeProfile {
  return {
    id: 'profile-1',
    name: 'software-engineering',
    resumeSnapshot: {
      experience: [],
      education: [],
      skills: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('Profile Validation', () => {
  describe('validateResumeProfiles', () => {
    it('should accept valid profiles', () => {
      const profiles: ResumeProfile[] = [
        createValidProfile({ id: '1', name: 'frontend' }),
        createValidProfile({ id: '2', name: 'backend' }),
      ]
      
      const errors = validateResumeProfiles(profiles)
      expect(errors).toHaveLength(0)
    })

    it('should reject more than max count profiles', () => {
      const profiles: ResumeProfile[] = Array.from({ length: RESUME_PROFILE_MAX_COUNT + 1 }, (_, i) => 
        createValidProfile({ id: `${i}`, name: `profile-${String.fromCharCode(97 + i)}` })
      )
      
      const errors = validateResumeProfiles(profiles)
      expect(errors.some(e => e.field === 'resumeProfiles')).toBe(true)
      expect(errors.some(e => e.message.includes(`Maximum of ${RESUME_PROFILE_MAX_COUNT}`))).toBe(true)
    })

    it('should reject profiles without names', () => {
      const profiles: ResumeProfile[] = [
        createValidProfile({ id: '1', name: '' }),
      ]
      
      const errors = validateResumeProfiles(profiles)
      expect(errors.some(e => e.message.includes('required'))).toBe(true)
    })

    it('should reject profiles with names exceeding max length', () => {
      const longName = 'a'.repeat(RESUME_PROFILE_MAX_LENGTH + 1)
      const profiles: ResumeProfile[] = [
        createValidProfile({ id: '1', name: longName }),
      ]
      
      const errors = validateResumeProfiles(profiles)
      expect(errors.some(e => e.message.includes('cannot exceed'))).toBe(true)
    })

    it('should reject profiles with invalid name format', () => {
      const invalidNames = [
        'Software',       // uppercase
        'frontend_dev',   // underscore
        'dev 2024',       // space
        '123-dev',        // starts with number
        '-frontend',      // starts with dash
        'backend-',       // ends with dash
        'front--end',     // double dash
      ]

      for (const name of invalidNames) {
        const profiles: ResumeProfile[] = [
          createValidProfile({ id: '1', name }),
        ]
        
        const errors = validateResumeProfiles(profiles)
        expect(errors.some(e => e.message.includes('lowercase letters separated by dashes'))).toBe(true)
      }
    })

    it('should reject duplicate profile names', () => {
      const profiles: ResumeProfile[] = [
        createValidProfile({ id: '1', name: 'frontend' }),
        createValidProfile({ id: '2', name: 'frontend' }),
      ]
      
      const errors = validateResumeProfiles(profiles)
      expect(errors.some(e => e.message.includes('unique'))).toBe(true)
    })

    it('should reject profiles without ids', () => {
      const profiles: ResumeProfile[] = [
        { ...createValidProfile(), id: '' },
      ]
      
      const errors = validateResumeProfiles(profiles)
      expect(errors.some(e => e.message.includes('ID is required'))).toBe(true)
    })

    it('should accept valid hyphenated names', () => {
      const validNames = [
        'frontend',
        'backend',
        'full-stack',
        'software-engineering',
        'data-science-ml',
      ]

      for (const name of validNames) {
        const profiles: ResumeProfile[] = [
          createValidProfile({ id: '1', name }),
        ]
        
        const errors = validateResumeProfiles(profiles)
        const nameErrors = errors.filter(e => e.field.includes('name'))
        expect(nameErrors).toHaveLength(0)
      }
    })

    it('should handle empty profile array', () => {
      const errors = validateResumeProfiles([])
      expect(errors).toHaveLength(0)
    })

    it('should return multiple errors for multiple issues', () => {
      const profiles: ResumeProfile[] = [
        createValidProfile({ id: '', name: '' }),
        createValidProfile({ id: '2', name: 'INVALID' }),
      ]
      
      const errors = validateResumeProfiles(profiles)
      expect(errors.length).toBeGreaterThan(1)
    })

    it('should correctly identify error field index', () => {
      const profiles: ResumeProfile[] = [
        createValidProfile({ id: '1', name: 'valid' }),
        createValidProfile({ id: '2', name: 'INVALID' }),
      ]
      
      const errors = validateResumeProfiles(profiles)
      expect(errors.some(e => e.field.includes('[1]'))).toBe(true)
    })
  })
})
