import { describe, it, expect } from 'vitest'
import {
  RESUME_PROFILE_MAX_LENGTH,
  RESUME_PROFILE_MAX_COUNT,
  RESUME_PROFILE_NAME_REGEX,
} from './types.js'
import type { 
  ATSProvider, 
  Job, 
  RawJob, 
  JobRow, 
  JobFilters, 
  UserProfile, 
  Experience, 
  Education, 
  ResumeProfile 
} from './types.js'

describe('Type Constants', () => {
  describe('Resume Profile Constants', () => {
    it('should have correct max length', () => {
      expect(RESUME_PROFILE_MAX_LENGTH).toBe(34)
    })

    it('should have correct max count', () => {
      expect(RESUME_PROFILE_MAX_COUNT).toBe(5)
    })
  })

  describe('Resume Profile Name Regex', () => {
    it('should match valid lowercase names', () => {
      expect(RESUME_PROFILE_NAME_REGEX.test('software')).toBe(true)
      expect(RESUME_PROFILE_NAME_REGEX.test('engineering')).toBe(true)
    })

    it('should match hyphenated names', () => {
      expect(RESUME_PROFILE_NAME_REGEX.test('software-engineering')).toBe(true)
      expect(RESUME_PROFILE_NAME_REGEX.test('full-stack-developer')).toBe(true)
      expect(RESUME_PROFILE_NAME_REGEX.test('a-b-c-d-e')).toBe(true)
    })

    it('should reject uppercase', () => {
      expect(RESUME_PROFILE_NAME_REGEX.test('Software')).toBe(false)
      expect(RESUME_PROFILE_NAME_REGEX.test('ENGINEERING')).toBe(false)
    })

    it('should reject numbers', () => {
      expect(RESUME_PROFILE_NAME_REGEX.test('dev123')).toBe(false)
      expect(RESUME_PROFILE_NAME_REGEX.test('2024-resume')).toBe(false)
    })

    it('should reject spaces and underscores', () => {
      expect(RESUME_PROFILE_NAME_REGEX.test('software engineering')).toBe(false)
      expect(RESUME_PROFILE_NAME_REGEX.test('software_engineering')).toBe(false)
    })

    it('should reject invalid hyphen patterns', () => {
      expect(RESUME_PROFILE_NAME_REGEX.test('-software')).toBe(false)
      expect(RESUME_PROFILE_NAME_REGEX.test('software-')).toBe(false)
      expect(RESUME_PROFILE_NAME_REGEX.test('soft--ware')).toBe(false)
    })
  })
})

describe('Type Structures', () => {
  describe('ATSProvider', () => {
    it('should accept valid ATS providers', () => {
      const providers: ATSProvider[] = ['greenhouse', 'lever', 'ashby']
      expect(providers).toHaveLength(3)
    })
  })

  describe('RawJob', () => {
    it('should have required fields', () => {
      const rawJob: RawJob = {
        company: 'TechCorp',
        title: 'Software Engineer',
        atsProvider: 'greenhouse',
        atsJobId: 'job-123',
        jobUrl: 'https://example.com/job',
        isRemote: true,
        description: 'Job description here',
      }
      expect(rawJob.company).toBe('TechCorp')
      expect(rawJob.atsProvider).toBe('greenhouse')
    })

    it('should allow optional fields', () => {
      const rawJob: RawJob = {
        company: 'StartupXYZ',
        title: 'Frontend Engineer',
        atsProvider: 'lever',
        atsJobId: 'lever-456',
        jobUrl: 'https://lever.co/job',
        isRemote: false,
        description: 'Frontend role',
        location: 'San Francisco, CA',
        postedAt: new Date(),
      }
      expect(rawJob.location).toBe('San Francisco, CA')
      expect(rawJob.postedAt).toBeInstanceOf(Date)
    })
  })

  describe('Job', () => {
    it('should extend RawJob with additional fields', () => {
      const job: Job = {
        id: 1,
        company: 'DataCo',
        title: 'Data Engineer',
        atsProvider: 'ashby',
        atsJobId: 'ashby-789',
        jobUrl: 'https://ashby.com/job',
        isRemote: true,
        description: 'Data engineering role',
        createdAt: new Date(),
        status: 'pending',
      }
      expect(job.id).toBe(1)
      expect(job.status).toBe('pending')
    })

    it('should have valid status values', () => {
      const statuses: Job['status'][] = ['pending', 'analyzed', 'applied', 'rejected']
      expect(statuses).toContain('pending')
      expect(statuses).toContain('applied')
    })
  })

  describe('JobFilters', () => {
    it('should allow all filter options', () => {
      const filters: JobFilters = {
        search: 'engineer',
        location: 'San Francisco',
        isRemote: true,
        employmentType: 'full-time',
        atsProvider: 'greenhouse',
        company: 'TechCorp',
        limit: 50,
        offset: 0,
      }
      expect(filters.search).toBe('engineer')
      expect(filters.limit).toBe(50)
    })

    it('should allow partial filters', () => {
      const filters: JobFilters = {
        isRemote: true,
      }
      expect(filters.isRemote).toBe(true)
      expect(filters.search).toBeUndefined()
    })
  })

  describe('UserProfile', () => {
    it('should have complete structure', () => {
      const profile: UserProfile = {
        contact: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '(555) 123-4567',
          linkedin: 'https://linkedin.com/in/johndoe',
          location: 'San Francisco, CA',
          role: 'Senior Engineer',
          company: 'TechCorp',
          bio: 'Experienced engineer',
        },
        experience: [],
        education: [],
        preferences: {
          remoteOnly: true,
          excludedKeywords: ['php', 'java'],
          maxSeniority: ['principal'],
          locations: ['San Francisco', 'New York'],
          minSalary: 150000,
        },
        skills: ['TypeScript', 'React', 'Node.js'],
        resumeProfiles: [],
      }
      expect(profile.contact.firstName).toBe('John')
      expect(profile.preferences.remoteOnly).toBe(true)
    })
  })

  describe('Experience', () => {
    it('should allow full experience entry', () => {
      const exp: Experience = {
        id: 'exp-1',
        title: 'Senior Engineer',
        company: 'TechCorp',
        location: 'SF',
        startDate: '2020-01',
        endDate: '2023-12',
        current: false,
        description: 'Led development',
        bullets: ['Built APIs', 'Mentored juniors'],
      }
      expect(exp.title).toBe('Senior Engineer')
      expect(exp.bullets).toHaveLength(2)
    })

    it('should allow minimal experience entry', () => {
      const exp: Experience = {
        title: 'Engineer',
        company: 'Startup',
        description: 'Development work',
      }
      expect(exp.id).toBeUndefined()
      expect(exp.bullets).toBeUndefined()
    })
  })

  describe('Education', () => {
    it('should allow full education entry', () => {
      const edu: Education = {
        id: 'edu-1',
        institution: 'Stanford',
        degree: 'M.S. Computer Science',
        fieldOfStudy: 'Machine Learning',
        startDate: '2018-09',
        endDate: '2020-06',
        description: 'Focus on ML and AI',
      }
      expect(edu.institution).toBe('Stanford')
    })

    it('should allow minimal education entry', () => {
      const edu: Education = {
        institution: 'MIT',
        degree: 'B.S. Computer Science',
      }
      expect(edu.fieldOfStudy).toBeUndefined()
    })
  })

  describe('ResumeProfile', () => {
    it('should have complete structure', () => {
      const profile: ResumeProfile = {
        id: 'profile-1',
        name: 'software-engineering',
        resumeSnapshot: {
          experience: [],
          education: [],
          skills: ['TypeScript', 'Python'],
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      }
      expect(profile.name).toBe('software-engineering')
      expect(profile.resumeSnapshot.skills).toContain('TypeScript')
    })
  })
})
