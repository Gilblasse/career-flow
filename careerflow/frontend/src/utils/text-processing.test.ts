import { describe, it, expect } from 'vitest'
import {
  hasBulletMarker,
  hasBulletMarkers,
  isDescriptionParagraph,
  analyzeDescriptionPattern,
  extractBulletsFromDescription,
} from './text-processing'

describe('Text Processing Utilities', () => {
  describe('hasBulletMarker', () => {
    it('should detect dash bullet marker', () => {
      expect(hasBulletMarker('- Led development team')).toBe(true)
      expect(hasBulletMarker('  - With leading spaces')).toBe(true)
    })

    it('should detect bullet point markers', () => {
      expect(hasBulletMarker('• Implemented feature')).toBe(true)
      expect(hasBulletMarker('● Created system')).toBe(true)
    })

    it('should detect asterisk markers', () => {
      expect(hasBulletMarker('* Managed project')).toBe(true)
    })

    it('should detect en-dash markers', () => {
      expect(hasBulletMarker('– Built API')).toBe(true)
    })

    it('should return false for non-bullet lines', () => {
      expect(hasBulletMarker('Regular text without bullet')).toBe(false)
      expect(hasBulletMarker('Led a team of 5 engineers')).toBe(false)
      expect(hasBulletMarker('')).toBe(false)
    })
  })

  describe('hasBulletMarkers', () => {
    it('should return true when description has bullet points', () => {
      const description = '- First point\n- Second point'
      expect(hasBulletMarkers(description)).toBe(true)
    })

    it('should return false for paragraph text', () => {
      const description = 'Led development of microservices. Improved performance by 50%.'
      expect(hasBulletMarkers(description)).toBe(false)
    })

    it('should handle empty and null descriptions', () => {
      expect(hasBulletMarkers('')).toBe(false)
      expect(hasBulletMarkers(null as unknown as string)).toBe(false)
      expect(hasBulletMarkers(undefined as unknown as string)).toBe(false)
    })

    it('should detect bullets mixed with regular text', () => {
      const description = 'Overview paragraph\n- First bullet\nMore text'
      expect(hasBulletMarkers(description)).toBe(true)
    })
  })

  describe('isDescriptionParagraph', () => {
    it('should return true for paragraph without bullets', () => {
      expect(isDescriptionParagraph('Led a team of engineers to deliver key features.')).toBe(true)
    })

    it('should return false for bullet list', () => {
      expect(isDescriptionParagraph('- Led team\n- Delivered features')).toBe(false)
    })

    it('should return false for empty strings', () => {
      expect(isDescriptionParagraph('')).toBe(false)
      expect(isDescriptionParagraph('   ')).toBe(false)
    })
  })

  describe('analyzeDescriptionPattern', () => {
    it('should return bullets when majority have bullet markers', () => {
      const experiences = [
        { description: '- Point 1\n- Point 2' },
        { description: '• Bullet 1\n• Bullet 2' },
        { description: 'Paragraph text' },
      ]
      expect(analyzeDescriptionPattern(experiences)).toBe('bullets')
    })

    it('should return paragraphs when no bullets present', () => {
      const experiences = [
        { description: 'Led development of platform.' },
        { description: 'Managed team of engineers.' },
      ]
      expect(analyzeDescriptionPattern(experiences)).toBe('paragraphs')
    })

    it('should return mixed when less than 50% are bullets', () => {
      const experiences = [
        { description: '- Bullet point' },
        { description: 'Paragraph one.' },
        { description: 'Paragraph two.' },
        { description: 'Paragraph three.' },
      ]
      expect(analyzeDescriptionPattern(experiences)).toBe('mixed')
    })

    it('should default to bullets for empty array', () => {
      expect(analyzeDescriptionPattern([])).toBe('bullets')
    })

    it('should handle experiences with empty descriptions', () => {
      const experiences = [
        { description: '' },
        { description: undefined },
        { description: '- Valid bullet' },
      ]
      expect(analyzeDescriptionPattern(experiences as any)).toBe('bullets')
    })
  })

  describe('extractBulletsFromDescription', () => {
    it('should extract bullets and remove markers', () => {
      const description = '- Led team\n- Delivered project\n- Improved metrics'
      const bullets = extractBulletsFromDescription(description)
      expect(bullets).toEqual(['Led team', 'Delivered project', 'Improved metrics'])
    })

    it('should handle various bullet markers', () => {
      const description = '• First point\n- Second point\n* Third point'
      const bullets = extractBulletsFromDescription(description)
      expect(bullets).toHaveLength(3)
      expect(bullets[0]).toBe('First point')
    })

    it('should return paragraph as single item when pattern is paragraphs', () => {
      const description = 'Led development of key features and improved system performance.'
      const bullets = extractBulletsFromDescription(description, 'paragraphs')
      expect(bullets).toHaveLength(1)
      expect(bullets[0]).toBe(description)
    })

    it('should handle empty descriptions', () => {
      expect(extractBulletsFromDescription('')).toEqual([])
      expect(extractBulletsFromDescription('   ')).toEqual([])
    })

    it('should filter out empty lines', () => {
      const description = '- First\n\n- Second\n   \n- Third'
      const bullets = extractBulletsFromDescription(description)
      expect(bullets).toEqual(['First', 'Second', 'Third'])
    })
  })
})
