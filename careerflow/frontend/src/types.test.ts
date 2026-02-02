import { describe, it, expect } from 'vitest'
import {
  RESUME_VARIANT_MAX_LENGTH,
  RESUME_VARIANT_MAX_COUNT,
  RESUME_VARIANT_NAME_REGEX,
  RESUME_PROFILE_MAX_LENGTH,
  RESUME_PROFILE_MAX_COUNT,
  RESUME_PROFILE_NAME_REGEX,
} from './types'
import type { UserProfile, Experience, Education, ResumeProfile } from './types'

describe('Type Constants', () => {
  describe('Resume Variant Constants', () => {
    it('should have correct max length', () => {
      expect(RESUME_VARIANT_MAX_LENGTH).toBe(34)
    })

    it('should have correct max count', () => {
      expect(RESUME_VARIANT_MAX_COUNT).toBe(3)
    })

    it('should have backward compatibility aliases', () => {
      expect(RESUME_PROFILE_MAX_LENGTH).toBe(RESUME_VARIANT_MAX_LENGTH)
      expect(RESUME_PROFILE_MAX_COUNT).toBe(RESUME_VARIANT_MAX_COUNT)
      expect(RESUME_PROFILE_NAME_REGEX).toBe(RESUME_VARIANT_NAME_REGEX)
    })
  })

  describe('Resume Variant Name Regex', () => {
    it('should match valid lowercase names', () => {
      expect(RESUME_VARIANT_NAME_REGEX.test('software')).toBe(true)
      expect(RESUME_VARIANT_NAME_REGEX.test('frontend')).toBe(true)
    })

    it('should match hyphenated names', () => {
      expect(RESUME_VARIANT_NAME_REGEX.test('software-engineering')).toBe(true)
      expect(RESUME_VARIANT_NAME_REGEX.test('full-stack-developer')).toBe(true)
    })

    it('should reject uppercase letters', () => {
      expect(RESUME_VARIANT_NAME_REGEX.test('Software')).toBe(false)
      expect(RESUME_VARIANT_NAME_REGEX.test('FRONTEND')).toBe(false)
    })

    it('should reject numbers', () => {
      expect(RESUME_VARIANT_NAME_REGEX.test('dev123')).toBe(false)
      expect(RESUME_VARIANT_NAME_REGEX.test('2024-resume')).toBe(false)
    })

    it('should reject spaces', () => {
      expect(RESUME_VARIANT_NAME_REGEX.test('software engineering')).toBe(false)
    })

    it('should reject underscores', () => {
      expect(RESUME_VARIANT_NAME_REGEX.test('software_engineering')).toBe(false)
    })

    it('should reject leading/trailing hyphens', () => {
      expect(RESUME_VARIANT_NAME_REGEX.test('-software')).toBe(false)
      expect(RESUME_VARIANT_NAME_REGEX.test('software-')).toBe(false)
    })

    it('should reject consecutive hyphens', () => {
      expect(RESUME_VARIANT_NAME_REGEX.test('software--engineering')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(RESUME_VARIANT_NAME_REGEX.test('')).toBe(false)
    })
  })
})

describe('Type Structures', () => {
  describe('UserProfile', () => {
    it('should allow valid profile structure', () => {
      const profile: UserProfile = {
        contact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '(555) 123-4567',
          linkedin: 'https://linkedin.com/in/johndoe',
          location: 'San Francisco, CA',
        },
        experience: [],
        education: [],
        preferences: {
          remoteOnly: true,
          excludedKeywords: ['php', 'java'],
          maxSeniority: ['principal', 'staff'],
          locations: ['San Francisco', 'New York'],
        },
        skills: ['TypeScript', 'React', 'Node.js'],
        resumeProfiles: [],
      }

      expect(profile.contact.firstName).toBe('John')
      expect(profile.preferences.remoteOnly).toBe(true)
      expect(profile.skills).toContain('TypeScript')
    })

    it('should support optional contact fields', () => {
      const profile: UserProfile = {
        contact: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '',
          linkedin: '',
          location: '',
          github: 'https://github.com/janesmith',
          portfolio: 'https://janesmith.dev',
        },
        experience: [],
        education: [],
        preferences: {
          remoteOnly: false,
          excludedKeywords: [],
          maxSeniority: [],
          locations: [],
          minSalary: 150000,
        },
        skills: [],
        resumeProfiles: [],
        lastEditedProfileId: 'profile-123',
      }

      expect(profile.contact.github).toBe('https://github.com/janesmith')
      expect(profile.preferences.minSalary).toBe(150000)
      expect(profile.lastEditedProfileId).toBe('profile-123')
    })
  })

  describe('Experience', () => {
    it('should allow valid experience structure', () => {
      const experience: Experience = {
        id: 'exp-1',
        title: 'Senior Software Engineer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        startDate: '2020-01',
        endDate: '2023-12',
        current: false,
        description: 'Led development of microservices',
        bullets: ['Built APIs', 'Mentored team'],
      }

      expect(experience.title).toBe('Senior Software Engineer')
      expect(experience.bullets).toHaveLength(2)
    })

    it('should support current position without end date', () => {
      const experience: Experience = {
        title: 'Staff Engineer',
        company: 'StartupXYZ',
        description: 'Leading platform engineering',
        current: true,
      }

      expect(experience.current).toBe(true)
      expect(experience.endDate).toBeUndefined()
    })
  })

  describe('Education', () => {
    it('should allow valid education structure', () => {
      const education: Education = {
        id: 'edu-1',
        institution: 'MIT',
        degree: 'B.S. Computer Science',
        fieldOfStudy: 'Computer Science',
        startDate: '2012-09',
        endDate: '2016-05',
        description: 'Focus on distributed systems',
      }

      expect(education.institution).toBe('MIT')
      expect(education.degree).toBe('B.S. Computer Science')
    })
  })

  describe('ResumeProfile', () => {
    it('should allow valid resume profile structure', () => {
      const profile: ResumeProfile = {
        id: 'profile-1',
        name: 'software-engineering',
        resumeSnapshot: {
          experience: [],
          education: [],
          skills: ['TypeScript', 'React'],
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      }

      expect(profile.name).toBe('software-engineering')
      expect(profile.resumeSnapshot.skills).toContain('TypeScript')
    })
  })
})
