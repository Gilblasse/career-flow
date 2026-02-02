import { describe, it, expect } from 'vitest'
import {
  hasBulletMarker,
  hasBulletMarkers,
  isDescriptionParagraph,
  analyzeDescriptionPattern,
  extractBulletsFromDescription,
} from './text-processing.js'

describe('Text Processing Utilities', () => {
  describe('hasBulletMarker', () => {
    it('should detect dash bullet markers', () => {
      expect(hasBulletMarker('- Led development team')).toBe(true)
      expect(hasBulletMarker('  - With leading spaces')).toBe(true)
    })

    it('should detect en-dash markers', () => {
      expect(hasBulletMarker('– Built scalable systems')).toBe(true)
    })

    it('should detect bullet point markers', () => {
      expect(hasBulletMarker('• Implemented microservices')).toBe(true)
    })

    it('should detect asterisk markers', () => {
      expect(hasBulletMarker('* Managed team of 5')).toBe(true)
    })

    it('should return false for regular text', () => {
      expect(hasBulletMarker('Led development team')).toBe(false)
      expect(hasBulletMarker('Implemented features')).toBe(false)
      expect(hasBulletMarker('')).toBe(false)
    })
  })

  describe('hasBulletMarkers', () => {
    it('should return true for text with bullets', () => {
      expect(hasBulletMarkers('- First\n- Second')).toBe(true)
      expect(hasBulletMarkers('• Point one\n• Point two')).toBe(true)
    })

    it('should return false for paragraph text', () => {
      expect(hasBulletMarkers('Led development of platform.')).toBe(false)
    })

    it('should handle empty/null input', () => {
      expect(hasBulletMarkers('')).toBe(false)
      expect(hasBulletMarkers(undefined as unknown as string)).toBe(false)
    })
  })

  describe('isDescriptionParagraph', () => {
    it('should return true for paragraph text', () => {
      expect(isDescriptionParagraph('Led team to deliver key features.')).toBe(true)
    })

    it('should return false for bullet text', () => {
      expect(isDescriptionParagraph('- Led team\n- Delivered features')).toBe(false)
    })

    it('should return false for empty strings', () => {
      expect(isDescriptionParagraph('')).toBe(false)
      expect(isDescriptionParagraph('   ')).toBe(false)
    })
  })

  describe('analyzeDescriptionPattern', () => {
    it('should return bullets when majority have markers', () => {
      const experiences = [
        { description: '- Point 1\n- Point 2' },
        { description: '• Bullet 1' },
        { description: 'Paragraph' },
      ]
      expect(analyzeDescriptionPattern(experiences)).toBe('bullets')
    })

    it('should return paragraphs when none have markers', () => {
      const experiences = [
        { description: 'Paragraph one.' },
        { description: 'Paragraph two.' },
      ]
      expect(analyzeDescriptionPattern(experiences)).toBe('paragraphs')
    })

    it('should return mixed for minority bullets', () => {
      const experiences = [
        { description: '- Bullet' },
        { description: 'Paragraph 1.' },
        { description: 'Paragraph 2.' },
        { description: 'Paragraph 3.' },
      ]
      expect(analyzeDescriptionPattern(experiences)).toBe('mixed')
    })

    it('should default to bullets for empty array', () => {
      expect(analyzeDescriptionPattern([])).toBe('bullets')
    })
  })

  describe('extractBulletsFromDescription', () => {
    it('should extract bullets and strip markers', () => {
      const description = '- First\n- Second\n- Third'
      const bullets = extractBulletsFromDescription(description)
      expect(bullets).toEqual(['First', 'Second', 'Third'])
    })

    it('should handle various bullet markers', () => {
      const description = '• Point 1\n– Point 2\n* Point 3'
      const bullets = extractBulletsFromDescription(description)
      expect(bullets).toHaveLength(3)
    })

    it('should keep paragraph as single item when pattern is paragraphs', () => {
      const paragraph = 'Led development of distributed systems.'
      const result = extractBulletsFromDescription(paragraph, 'paragraphs')
      expect(result).toEqual([paragraph])
    })

    it('should handle empty input', () => {
      expect(extractBulletsFromDescription('')).toEqual([])
      expect(extractBulletsFromDescription('  ')).toEqual([])
    })
  })
})
