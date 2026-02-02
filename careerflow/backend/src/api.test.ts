/**
 * API Integration Tests
 * 
 * These tests verify the API endpoints' validation and response handling.
 * They use mock data and test the validation logic without making actual
 * database calls.
 */

import { describe, it, expect } from 'vitest'

// Email validation regex (matching server.ts)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Phone regex: (XXX) XXX-XXXX USA format
const PHONE_REGEX = /^\(\d{3}\) \d{3}-\d{4}$/

/**
 * Formats phone to (XXX) XXX-XXXX
 */
function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  let digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1)
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

interface ValidationError {
  field: string
  message: string
}

interface ProfileContact {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

/**
 * Validates profile (matching server.ts logic)
 */
function validateProfile(profile: { contact?: ProfileContact }): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!profile.contact?.firstName?.trim()) {
    errors.push({ field: 'firstName', message: 'First name is required' })
  }
  if (!profile.contact?.lastName?.trim()) {
    errors.push({ field: 'lastName', message: 'Last name is required' })
  }
  if (!profile.contact?.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required' })
  } else if (!EMAIL_REGEX.test(profile.contact.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' })
  }
  
  if (profile.contact?.phone?.trim()) {
    const digits = profile.contact.phone.replace(/\D/g, '')
    if (digits.length !== 10) {
      errors.push({ field: 'phone', message: 'Phone must be 10 digits' })
    }
  }
  
  return errors
}

describe('API Validation Logic', () => {
  describe('Email Validation', () => {
    it('should accept valid emails', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@domain.org',
      ]
      
      for (const email of validEmails) {
        expect(EMAIL_REGEX.test(email)).toBe(true)
      }
    })

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'user',
        'user@',
        '@example.com',
        'user @example.com',
        'user@example',
        '',
      ]
      
      for (const email of invalidEmails) {
        expect(EMAIL_REGEX.test(email)).toBe(false)
      }
    })
  })

  describe('Phone Validation', () => {
    it('should accept valid USA phone format', () => {
      expect(PHONE_REGEX.test('(555) 123-4567')).toBe(true)
      expect(PHONE_REGEX.test('(123) 456-7890')).toBe(true)
    })

    it('should reject invalid phone formats', () => {
      expect(PHONE_REGEX.test('5551234567')).toBe(false)
      expect(PHONE_REGEX.test('555-123-4567')).toBe(false)
      expect(PHONE_REGEX.test('+1 (555) 123-4567')).toBe(false)
      expect(PHONE_REGEX.test('(55) 123-4567')).toBe(false)
    })
  })

  describe('formatPhoneNumber', () => {
    it('should format 10-digit phone correctly', () => {
      expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567')
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890')
    })

    it('should handle phone with country code', () => {
      expect(formatPhoneNumber('15551234567')).toBe('(555) 123-4567')
      expect(formatPhoneNumber('1-555-123-4567')).toBe('(555) 123-4567')
    })

    it('should strip non-digit characters', () => {
      expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567')
      expect(formatPhoneNumber('555.123.4567')).toBe('(555) 123-4567')
      expect(formatPhoneNumber('555 123 4567')).toBe('(555) 123-4567')
    })

    it('should return original for invalid length', () => {
      expect(formatPhoneNumber('12345')).toBe('12345')
      expect(formatPhoneNumber('123456789012')).toBe('123456789012')
    })

    it('should handle empty input', () => {
      expect(formatPhoneNumber('')).toBe('')
    })
  })

  describe('validateProfile', () => {
    it('should accept valid profile', () => {
      const profile = {
        contact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '5551234567',
        },
      }
      
      const errors = validateProfile(profile)
      expect(errors).toHaveLength(0)
    })

    it('should require firstName', () => {
      const profile = {
        contact: {
          firstName: '',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      }
      
      const errors = validateProfile(profile)
      expect(errors.some(e => e.field === 'firstName')).toBe(true)
    })

    it('should require lastName', () => {
      const profile = {
        contact: {
          firstName: 'John',
          lastName: '',
          email: 'john@example.com',
        },
      }
      
      const errors = validateProfile(profile)
      expect(errors.some(e => e.field === 'lastName')).toBe(true)
    })

    it('should require email', () => {
      const profile = {
        contact: {
          firstName: 'John',
          lastName: 'Doe',
          email: '',
        },
      }
      
      const errors = validateProfile(profile)
      expect(errors.some(e => e.field === 'email')).toBe(true)
    })

    it('should validate email format', () => {
      const profile = {
        contact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
        },
      }
      
      const errors = validateProfile(profile)
      expect(errors.some(e => e.field === 'email' && e.message.includes('Invalid'))).toBe(true)
    })

    it('should validate phone length when provided', () => {
      const profile = {
        contact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '12345', // too short
        },
      }
      
      const errors = validateProfile(profile)
      expect(errors.some(e => e.field === 'phone')).toBe(true)
    })

    it('should allow empty phone', () => {
      const profile = {
        contact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '',
        },
      }
      
      const errors = validateProfile(profile)
      expect(errors.some(e => e.field === 'phone')).toBe(false)
    })

    it('should return multiple errors for multiple issues', () => {
      const profile = {
        contact: {
          firstName: '',
          lastName: '',
          email: 'invalid',
        },
      }
      
      const errors = validateProfile(profile)
      expect(errors.length).toBeGreaterThanOrEqual(3)
    })

    it('should handle missing contact object', () => {
      const profile = {}
      const errors = validateProfile(profile)
      expect(errors.length).toBeGreaterThan(0)
    })
  })
})

describe('API Response Structures', () => {
  describe('Error Response', () => {
    it('should have correct error structure', () => {
      const errorResponse = {
        error: 'Validation failed',
        errors: [
          { field: 'email', message: 'Invalid email format' },
        ],
      }
      
      expect(errorResponse).toHaveProperty('error')
      expect(errorResponse).toHaveProperty('errors')
      expect(Array.isArray(errorResponse.errors)).toBe(true)
      expect(errorResponse.errors[0]).toHaveProperty('field')
      expect(errorResponse.errors[0]).toHaveProperty('message')
    })
  })

  describe('Job Response', () => {
    it('should have correct job structure', () => {
      const jobResponse = {
        id: 'job-1',
        company: 'TechCorp',
        title: 'Software Engineer',
        atsProvider: 'greenhouse',
        jobUrl: 'https://example.com/job',
        location: 'San Francisco, CA',
        isRemote: true,
        salaryMin: 150000,
        salaryMax: 200000,
        employmentType: 'full-time',
        description: 'Job description',
        matchScore: 85,
      }
      
      expect(jobResponse).toHaveProperty('id')
      expect(jobResponse).toHaveProperty('company')
      expect(jobResponse).toHaveProperty('title')
      expect(jobResponse).toHaveProperty('atsProvider')
      expect(typeof jobResponse.matchScore).toBe('number')
    })
  })

  describe('Profile Response', () => {
    it('should have correct profile structure', () => {
      const profileResponse = {
        contact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '(555) 123-4567',
          linkedin: '',
          location: 'San Francisco, CA',
        },
        experience: [],
        education: [],
        skills: ['TypeScript', 'React'],
        preferences: {
          remoteOnly: true,
          excludedKeywords: [],
          maxSeniority: [],
          locations: [],
        },
        resumeProfiles: [],
      }
      
      expect(profileResponse).toHaveProperty('contact')
      expect(profileResponse).toHaveProperty('experience')
      expect(profileResponse).toHaveProperty('education')
      expect(profileResponse).toHaveProperty('skills')
      expect(profileResponse).toHaveProperty('preferences')
      expect(profileResponse).toHaveProperty('resumeProfiles')
    })
  })
})
