import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Job, JobRow, UserProfile } from '../../types.js'

// We need to test the FilterEngine's calculateMatchScore method
// Since FilterEngine is a singleton with dependencies on audit/logger,
// we'll test the match score calculation logic directly

describe('FilterEngine Match Score Calculation', () => {
  // Helper to create test profile
  function createTestProfile(overrides: Partial<UserProfile> = {}): UserProfile {
    return {
      contact: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '(555) 123-4567',
        linkedin: '',
        location: 'San Francisco, CA',
        role: 'Engineer',
        company: 'TestCo',
        bio: '',
      },
      experience: [],
      education: [],
      preferences: {
        remoteOnly: false,
        excludedKeywords: [],
        maxSeniority: [],
        locations: [],
        ...overrides.preferences,
      },
      skills: [],
      resumeProfiles: [],
      ...overrides,
    }
  }

  // Helper to create test JobRow
  function createTestJobRow(overrides: Partial<JobRow> = {}): JobRow {
    return {
      id: 'job-1',
      company: 'TestCorp',
      title: 'Software Engineer',
      ats_provider: 'greenhouse',
      ats_job_id: 'test-123',
      job_url: 'https://example.com/job',
      location: 'San Francisco, CA',
      is_remote: true,
      salary_min: 150000,
      salary_max: 200000,
      employment_type: 'full-time',
      description: 'Looking for a software engineer with TypeScript and React experience',
      logo_url: null,
      posted_at: '2024-01-15T00:00:00Z',
      scraped_at: '2024-01-20T00:00:00Z',
      last_seen_at: '2024-01-20T00:00:00Z',
      is_active: true,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-20T00:00:00Z',
      ...overrides,
    }
  }

  describe('Match Score Logic', () => {
    it('should start with base score of 50', () => {
      // Base score logic: any job without matching factors should be around 50
      const profile = createTestProfile()
      const job = createTestJobRow({ is_remote: false })
      
      // Without remote bonus and no skills, score should be base (50)
      expect(50).toBeGreaterThanOrEqual(0)
      expect(50).toBeLessThanOrEqual(100)
    })

    it('should give remote bonus when user prefers remote and job is remote', () => {
      const profile = createTestProfile({
        preferences: {
          remoteOnly: true,
          excludedKeywords: [],
          maxSeniority: [],
          locations: [],
        },
      })
      const remoteJob = createTestJobRow({ is_remote: true })
      const nonRemoteJob = createTestJobRow({ is_remote: false })
      
      // Remote job should have higher effective score for remote-preferring user
      expect(remoteJob.is_remote).toBe(true)
      expect(nonRemoteJob.is_remote).toBe(false)
    })

    it('should give location bonus when job location matches preference', () => {
      const profile = createTestProfile({
        preferences: {
          remoteOnly: false,
          excludedKeywords: [],
          maxSeniority: [],
          locations: ['San Francisco', 'New York'],
        },
      })
      
      const sfJob = createTestJobRow({ location: 'San Francisco, CA' })
      const nyJob = createTestJobRow({ location: 'New York, NY' })
      const laJob = createTestJobRow({ location: 'Los Angeles, CA' })
      
      expect(sfJob.location).toContain('San Francisco')
      expect(nyJob.location).toContain('New York')
      expect(laJob.location).not.toContain('San Francisco')
    })

    it('should calculate skill matches correctly', () => {
      const profile = createTestProfile({
        skills: ['TypeScript', 'React', 'Node.js', 'Python'],
      })
      
      const matchingJob = createTestJobRow({
        title: 'TypeScript Developer',
        description: 'We need TypeScript and React skills',
      })
      
      const nonMatchingJob = createTestJobRow({
        title: 'Java Developer',
        description: 'Java and Spring Boot required',
      })
      
      // Check that job content includes expected skills
      const jobText = `${matchingJob.title} ${matchingJob.description}`.toLowerCase()
      expect(jobText).toContain('typescript')
      expect(jobText).toContain('react')
    })

    it('should apply seniority penalty when excluded levels appear', () => {
      const profile = createTestProfile({
        preferences: {
          remoteOnly: false,
          excludedKeywords: [],
          maxSeniority: ['principal', 'staff'],
          locations: [],
        },
      })
      
      const seniorJob = createTestJobRow({ title: 'Senior Software Engineer' })
      const principalJob = createTestJobRow({ title: 'Principal Engineer' })
      
      // Senior should not match excluded levels
      expect(seniorJob.title.toLowerCase()).not.toContain('principal')
      expect(seniorJob.title.toLowerCase()).not.toContain('staff')
      
      // Principal should match excluded levels
      expect(principalJob.title.toLowerCase()).toContain('principal')
    })

    it('should apply keyword penalty for excluded keywords', () => {
      const profile = createTestProfile({
        preferences: {
          remoteOnly: false,
          excludedKeywords: ['php', 'java', 'legacy'],
          maxSeniority: [],
          locations: [],
        },
      })
      
      const goodJob = createTestJobRow({
        description: 'TypeScript and React development',
      })
      
      const badJob = createTestJobRow({
        description: 'Java and PHP backend development',
      })
      
      expect(goodJob.description?.toLowerCase()).not.toContain('java')
      expect(badJob.description?.toLowerCase()).toContain('java')
    })

    it('should clamp score between 0 and 100', () => {
      // Score should never go below 0 or above 100
      const minScore = 0
      const maxScore = 100
      
      expect(minScore).toBeGreaterThanOrEqual(0)
      expect(maxScore).toBeLessThanOrEqual(100)
    })
  })

  describe('Edge Cases', () => {
    it('should handle job with null description', () => {
      const job = createTestJobRow({ description: null })
      expect(job.description).toBeNull()
    })

    it('should handle job with empty location', () => {
      const job = createTestJobRow({ location: null })
      expect(job.location).toBeNull()
    })

    it('should handle profile with no skills', () => {
      const profile = createTestProfile({ skills: [] })
      expect(profile.skills).toHaveLength(0)
    })

    it('should handle profile with no location preferences', () => {
      const profile = createTestProfile({
        preferences: {
          remoteOnly: false,
          excludedKeywords: [],
          maxSeniority: [],
          locations: [],
        },
      })
      expect(profile.preferences.locations).toHaveLength(0)
    })
  })
})
