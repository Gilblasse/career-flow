import { describe, it, expect } from 'vitest'
import { TechStackRule, RemoteRule, SeniorityRule } from './rules.js'
import type { Job } from '../../types.js'

// Helper to create a test job
function createTestJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 1,
    company: 'TestCorp',
    title: 'Software Engineer',
    atsProvider: 'greenhouse',
    atsJobId: 'test-123',
    jobUrl: 'https://example.com/job',
    isRemote: true,
    description: 'Looking for a software engineer',
    createdAt: new Date(),
    status: 'pending',
    ...overrides,
  }
}

describe('Filter Rules', () => {
  describe('TechStackRule', () => {
    it('should accept jobs without excluded keywords', () => {
      const rule = new TechStackRule(['php', 'java'])
      const job = createTestJob({
        title: 'TypeScript Developer',
        description: 'We use TypeScript and React',
      })
      
      const result = rule.evaluate(job)
      expect(result.status).toBe('ACCEPTED')
    })

    it('should reject jobs with excluded keywords in title', () => {
      const rule = new TechStackRule(['php', 'java'])
      const job = createTestJob({
        title: 'Senior Java Developer',
        description: 'Building enterprise applications',
      })
      
      const result = rule.evaluate(job)
      expect(result.status).toBe('REJECTED')
      expect(result.reason).toContain('java')
    })

    it('should reject jobs with excluded keywords in description', () => {
      const rule = new TechStackRule(['php', 'java'])
      const job = createTestJob({
        title: 'Backend Developer',
        description: 'We use PHP and MySQL for our backend',
      })
      
      const result = rule.evaluate(job)
      expect(result.status).toBe('REJECTED')
      expect(result.reason).toContain('php')
    })

    it('should be case insensitive', () => {
      const rule = new TechStackRule(['PHP', 'JAVA'])
      const job = createTestJob({
        description: 'Looking for php developer',
      })
      
      const result = rule.evaluate(job)
      expect(result.status).toBe('REJECTED')
    })

    it('should accept all jobs when no keywords excluded', () => {
      const rule = new TechStackRule([])
      const job = createTestJob({
        description: 'PHP Java Ruby anything goes',
      })
      
      const result = rule.evaluate(job)
      expect(result.status).toBe('ACCEPTED')
    })
  })

  describe('RemoteRule', () => {
    it('should accept remote jobs when remoteOnly is true', () => {
      const rule = new RemoteRule(true)
      const job = createTestJob({ isRemote: true })
      
      const result = rule.evaluate(job)
      expect(result.status).toBe('ACCEPTED')
    })

    it('should reject non-remote jobs when remoteOnly is true', () => {
      const rule = new RemoteRule(true)
      const job = createTestJob({ 
        isRemote: false,
        title: 'Software Engineer',
      })
      
      const result = rule.evaluate(job)
      expect(result.status).toBe('REJECTED')
      expect(result.reason).toContain('not marked as remote')
    })

    it('should accept jobs with remote in title even if isRemote is false', () => {
      const rule = new RemoteRule(true)
      const job = createTestJob({ 
        isRemote: false,
        title: 'Remote Software Engineer',
      })
      
      const result = rule.evaluate(job)
      expect(result.status).toBe('ACCEPTED')
    })

    it('should accept all jobs when remoteOnly is false', () => {
      const rule = new RemoteRule(false)
      const nonRemoteJob = createTestJob({ isRemote: false })
      
      const result = rule.evaluate(nonRemoteJob)
      expect(result.status).toBe('ACCEPTED')
    })
  })

  describe('SeniorityRule', () => {
    it('should accept jobs without excluded seniority levels', () => {
      const rule = new SeniorityRule(['principal', 'staff'])
      const job = createTestJob({ title: 'Senior Software Engineer' })
      
      const result = rule.evaluate(job)
      expect(result.status).toBe('ACCEPTED')
    })

    it('should reject jobs with excluded seniority in title', () => {
      const rule = new SeniorityRule(['principal', 'staff'])
      const job = createTestJob({ title: 'Principal Engineer' })
      
      const result = rule.evaluate(job)
      expect(result.status).toBe('REJECTED')
      expect(result.reason).toContain('principal')
    })

    it('should reject staff level when excluded', () => {
      const rule = new SeniorityRule(['staff'])
      const job = createTestJob({ title: 'Staff Software Engineer' })
      
      const result = rule.evaluate(job)
      expect(result.status).toBe('REJECTED')
    })

    it('should be case insensitive', () => {
      const rule = new SeniorityRule(['PRINCIPAL'])
      const job = createTestJob({ title: 'principal engineer' })
      
      const result = rule.evaluate(job)
      expect(result.status).toBe('REJECTED')
    })

    it('should accept all jobs when no seniority levels excluded', () => {
      const rule = new SeniorityRule([])
      const job = createTestJob({ title: 'Principal Staff Distinguished Engineer' })
      
      const result = rule.evaluate(job)
      expect(result.status).toBe('ACCEPTED')
    })
  })
})
