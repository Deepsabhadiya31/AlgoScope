import { describe, it, expect } from 'vitest'
import {
  combSort,
  generateCombSortSteps,
  getCombSortSource,
  resolveCombSortLine,
} from './comb-sort'

// ─────────────────────────────────────────────────────────────────────
// R62-T048: Comb Sort — Failure-Path Coverage
// ─────────────────────────────────────────────────────────────────────

describe('R62-T048: Comb Sort — Failure-Path Coverage', () => {
  // ── A. Sorting Correctness ──────────────────────────────────────
  describe('A. Sorting Correctness', () => {
    it('Test Case 1 – [3, 1, 2, 2] produces [1, 2, 2, 3]', () => {
      const result = combSort([3, 1, 2, 2])
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(result.sorted).toEqual([1, 2, 2, 3])
    })

    it('preserves duplicate elements without loss or addition', () => {
      const input = [5, 3, 3, 1, 5, 2]
      const result = combSort(input)
      expect(result.success).toBe(true)
      expect(result.sorted).toEqual([1, 2, 3, 3, 5, 5])
      // Same length, same elements
      expect(result.sorted.length).toBe(input.length)
      expect([...result.sorted].sort()).toEqual([...input].sort())
    })

    it('sorts an already-sorted array without errors', () => {
      const result = combSort([1, 2, 3, 4])
      expect(result.success).toBe(true)
      expect(result.sorted).toEqual([1, 2, 3, 4])
    })

    it('sorts a reverse-sorted array', () => {
      const result = combSort([4, 3, 2, 1])
      expect(result.success).toBe(true)
      expect(result.sorted).toEqual([1, 2, 3, 4])
    })

    it('handles empty array', () => {
      const result = combSort([])
      expect(result.success).toBe(true)
      expect(result.sorted).toEqual([])
    })

    it('handles single-element array', () => {
      const result = combSort([42])
      expect(result.success).toBe(true)
      expect(result.sorted).toEqual([42])
    })

    it('does not mutate the original input array', () => {
      const input = [3, 1, 2, 2]
      const copy = [...input]
      combSort(input)
      expect(input).toEqual(copy)
    })

    it('handles negative numbers correctly', () => {
      const result = combSort([-3, 0, -1, 5, 2])
      expect(result.success).toBe(true)
      expect(result.sorted).toEqual([-3, -1, 0, 2, 5])
    })
  })

  // ── B. Gap Behavior ─────────────────────────────────────────────
  describe('B. Gap Behavior', () => {
    it('initial gap is derived from input length', () => {
      const result = combSort([3, 1, 2, 2])
      expect(result.gapProgression[0]).toBe(4) // array length
    })

    it('gap decreases across the progression', () => {
      const result = combSort([3, 1, 2, 2])
      const gaps = result.gapProgression
      for (let i = 1; i < gaps.length; i++) {
        expect(gaps[i]).toBeLessThanOrEqual(gaps[i - 1])
      }
    })

    it('gap never falls below 1', () => {
      const result = combSort([10, 9, 8, 7, 6, 5, 4, 3, 2, 1])
      for (const g of result.gapProgression) {
        expect(g).toBeGreaterThanOrEqual(1)
      }
    })

    it('final gap in the progression is 1', () => {
      const result = combSort([3, 1, 2, 2])
      const gaps = result.gapProgression
      // The last value should be 1 (the final pass)
      expect(gaps[gaps.length - 1]).toBe(1)
    })

    it('gap progression for a 4-element array follows floor(gap/1.3)', () => {
      // Start gap=4, next floor(4/1.3)=3, floor(3/1.3)=2, floor(2/1.3)=1
      const result = combSort([4, 3, 2, 1])
      const gaps = result.gapProgression
      expect(gaps[0]).toBe(4)
      expect(gaps[1]).toBe(3)
      expect(gaps[2]).toBe(2)
      expect(gaps[3]).toBe(1)
    })

    it('replay steps accurately represent gap changes', () => {
      const steps = generateCombSortSteps([3, 1, 2, 2])
      const gapSteps = steps.filter((s) => s.type === 'gap')
      expect(gapSteps.length).toBeGreaterThan(0)
      for (const s of gapSteps) {
        expect(s.variables.gap).toBeGreaterThanOrEqual(1)
      }
    })

    it('final sorting pass uses gap 1 in replay steps', () => {
      const steps = generateCombSortSteps([3, 1, 2, 2])
      const gapSteps = steps.filter((s) => s.type === 'gap')
      const lastGapStep = gapSteps[gapSteps.length - 1]
      expect(lastGapStep.variables.gap).toBe(1)
    })
  })

  // ── C. Failure-Path Coverage ────────────────────────────────────
  describe('C. Failure-Path Coverage', () => {
    it('null input produces failure result', () => {
      const result = combSort(null)
      expect(result.success).toBe(false)
      expect(result.sorted).toBeNull()
      expect(result.error).toBeTruthy()
      expect(typeof result.error).toBe('string')
    })

    it('undefined input produces failure result', () => {
      const result = combSort(undefined)
      expect(result.success).toBe(false)
      expect(result.sorted).toBeNull()
      expect(result.error).toBeTruthy()
    })

    it('non-array input (string) produces failure result', () => {
      const result = combSort('not an array')
      expect(result.success).toBe(false)
      expect(result.sorted).toBeNull()
      expect(result.error).toContain('string')
    })

    it('non-array input (number) produces failure result', () => {
      const result = combSort(42)
      expect(result.success).toBe(false)
      expect(result.sorted).toBeNull()
      expect(result.error).toContain('number')
    })

    it('non-array input (object) produces failure result', () => {
      const result = combSort({ a: 1 })
      expect(result.success).toBe(false)
      expect(result.sorted).toBeNull()
    })

    it('array with non-numeric elements produces failure', () => {
      const result = combSort([1, 'two', 3])
      expect(result.success).toBe(false)
      expect(result.sorted).toBeNull()
      expect(result.error).toContain('index 1')
    })

    it('array with NaN produces failure', () => {
      const result = combSort([1, NaN, 3])
      expect(result.success).toBe(false)
      expect(result.sorted).toBeNull()
      expect(result.error).toContain('index 1')
    })

    it('failed execution does not return a misleading sorted result', () => {
      const result = combSort(null)
      expect(result.sorted).not.toEqual(expect.any(Array))
      expect(result.success).not.toBe(true)
    })

    it('generateCombSortSteps with non-array returns error step', () => {
      const steps = generateCombSortSteps('invalid')
      expect(steps.length).toBe(1)
      expect(steps[0].type).toBe('error')
      expect(steps[0].variables.error).toBe(true)
    })
  })

  // ── D. Recovery After Failure ───────────────────────────────────
  describe('D. Recovery After Failure', () => {
    it('valid execution succeeds immediately after a failed execution', () => {
      // Step 1: Execute with unsupported input
      const failResult = combSort(null)
      expect(failResult.success).toBe(false)
      expect(failResult.error).toBeTruthy()

      // Step 2: Execute with valid input
      const successResult = combSort([3, 1, 2, 2])
      expect(successResult.success).toBe(true)
      expect(successResult.error).toBeNull()
      expect(successResult.sorted).toEqual([1, 2, 2, 3])
    })

    it('no stale error state contaminates the second call', () => {
      // First: multiple failures
      combSort(undefined)
      combSort('bad')
      combSort({ x: 1 })

      // Then: valid call
      const result = combSort([5, 4, 3, 2, 1])
      expect(result.success).toBe(true)
      expect(result.sorted).toEqual([1, 2, 3, 4, 5])
      expect(result.error).toBeNull()
      expect(result.gapProgression.length).toBeGreaterThan(0)
      expect(result.totalComparisons).toBeGreaterThan(0)
    })

    it('replay steps recover cleanly after invalid input', () => {
      // Error step
      const errorSteps = generateCombSortSteps(null)
      expect(errorSteps[0].type).toBe('error')

      // Valid steps
      const validSteps = generateCombSortSteps([3, 1, 2, 2])
      expect(validSteps[0].type).toBe('start')
      const lastStep = validSteps[validSteps.length - 1]
      expect(lastStep.type).toBe('complete')
      expect(lastStep.array).toEqual([1, 2, 2, 3])
    })

    it('alternating failure and success calls produce correct results', () => {
      expect(combSort(null).success).toBe(false)
      expect(combSort([2, 1]).sorted).toEqual([1, 2])

      expect(combSort('x').success).toBe(false)
      expect(combSort([4, 3, 2, 1]).sorted).toEqual([1, 2, 3, 4])

      expect(combSort(undefined).success).toBe(false)
      expect(combSort([3, 1, 2, 2]).sorted).toEqual([1, 2, 2, 3])
    })
  })

  // ── E. Deterministic Execution ──────────────────────────────────
  describe('E. Deterministic Execution', () => {
    it('identical inputs produce identical sorted results', () => {
      const r1 = combSort([3, 1, 2, 2])
      const r2 = combSort([3, 1, 2, 2])
      expect(r1.sorted).toEqual(r2.sorted)
      expect(r1.success).toBe(r2.success)
    })

    it('identical inputs produce identical gap progressions', () => {
      const r1 = combSort([3, 1, 2, 2])
      const r2 = combSort([3, 1, 2, 2])
      expect(r1.gapProgression).toEqual(r2.gapProgression)
      expect(r1.totalComparisons).toBe(r2.totalComparisons)
      expect(r1.totalSwaps).toBe(r2.totalSwaps)
    })

    it('identical inputs produce identical replay step sequences', () => {
      const s1 = generateCombSortSteps([3, 1, 2, 2])
      const s2 = generateCombSortSteps([3, 1, 2, 2])
      expect(s1.length).toBe(s2.length)
      for (let i = 0; i < s1.length; i++) {
        expect(s1[i].type).toBe(s2[i].type)
        expect(s1[i].array).toEqual(s2[i].array)
        expect(s1[i].indices).toEqual(s2[i].indices)
      }
    })

    it('failure results are consistent across repeated calls', () => {
      const f1 = combSort(null)
      const f2 = combSort(null)
      expect(f1.success).toBe(f2.success)
      expect(f1.error).toBe(f2.error)
      expect(f1.sorted).toBe(f2.sorted)
    })

    it('repeated runs do not contaminate each other', () => {
      for (let run = 0; run < 10; run++) {
        const result = combSort([3, 1, 2, 2])
        expect(result.sorted).toEqual([1, 2, 2, 3])
      }
    })
  })

  // ── F. Source Strings & Line Mapping ────────────────────────────
  describe('F. Source Strings & Line Mapping', () => {
    it('provides JavaScript source code', () => {
      const src = getCombSortSource('javascript')
      expect(src).toBeDefined()
      expect(typeof src.code).toBe('string')
      expect(src.code).toContain('combSort')
    })

    it('defaults to JavaScript for unknown language', () => {
      const src = getCombSortSource('rust')
      expect(src).toBeDefined()
      expect(src.code).toContain('combSort')
    })

    it('maps all semantic lineKeys to valid line numbers', () => {
      const expectedKeys = [
        'function', 'init_gap', 'init_sorted', 'while_loop',
        'shrink_gap', 'clamp_gap', 'check_gap_one', 'inner_loop',
        'compare', 'swap', 'mark_unsorted', 'complete',
      ]
      for (const key of expectedKeys) {
        const line = resolveCombSortLine('javascript', key)
        expect(line).toBeGreaterThanOrEqual(1)
      }
    })

    it('returns undefined for non-existent lineKey', () => {
      expect(resolveCombSortLine('javascript', 'nonexistent')).toBeUndefined()
    })

    it('returns undefined when lineKey is null', () => {
      expect(resolveCombSortLine('javascript', null)).toBeUndefined()
    })
  })

  // ── G. Step Structure Integrity ─────────────────────────────────
  describe('G. Step Structure Integrity', () => {
    it('every step has required properties', () => {
      const steps = generateCombSortSteps([3, 1, 2, 2])
      for (const step of steps) {
        expect(step).toHaveProperty('lineKey')
        expect(step).toHaveProperty('type')
        expect(step).toHaveProperty('array')
        expect(step).toHaveProperty('indices')
        expect(step).toHaveProperty('sortedIndices')
        expect(step).toHaveProperty('message')
        expect(step).toHaveProperty('variables')
        expect(Array.isArray(step.array)).toBe(true)
        expect(Array.isArray(step.indices)).toBe(true)
      }
    })

    it('first step is start and last step is complete', () => {
      const steps = generateCombSortSteps([3, 1, 2, 2])
      expect(steps[0].type).toBe('start')
      expect(steps[steps.length - 1].type).toBe('complete')
    })

    it('complete step contains fully sorted array', () => {
      const steps = generateCombSortSteps([3, 1, 2, 2])
      const last = steps[steps.length - 1]
      expect(last.array).toEqual([1, 2, 2, 3])
      expect(last.sortedIndices).toEqual([0, 1, 2, 3])
    })
  })
})
