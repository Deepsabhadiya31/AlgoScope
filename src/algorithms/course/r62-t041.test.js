import { describe, it, expect } from 'vitest'
import {
  pancakeSort,
  flip,
  replayOperations,
  replayTrace,
} from './pancake-sort'

/**
 * Helper to build an element frequency map for multiset comparison.
 */
function getFrequencyMap(array) {
  const map = new Map()
  for (const item of array) {
    map.set(item, (map.get(item) ?? 0) + 1)
  }
  return map
}

/**
 * Helper to verify that an array is sorted in ascending order.
 */
function isAscending(array) {
  for (let i = 1; i < array.length; i++) {
    if (array[i] < array[i - 1]) {
      return false
    }
  }
  return true
}

describe('R62-T041: Pancake Sort Contract Regression Tests', () => {
  describe('1. Explicit Primary Fixture', () => {
    it('sorts [3, 1, 2] to [1, 2, 3] with exact expected trace and intermediate states', () => {
      const input = [3, 1, 2]
      const result = pancakeSort(input)

      expect(result.sorted).toEqual([1, 2, 3])

      // Verification of intermediate states:
      // Initial: [3, 1, 2]
      // Step 1: max (3) at idx 0 is flipped to position 2 with k = 3 -> [2, 1, 3]
      // Step 2: max in [2, 1] is 2 at idx 0, flipped to position 1 with k = 2 -> [1, 2, 3]
      expect(result.operations).toHaveLength(2)

      expect(result.operations[0]).toMatchObject({
        type: 'flip',
        k: 3,
        index: 2,
        array: [2, 1, 3],
      })

      expect(result.operations[1]).toMatchObject({
        type: 'flip',
        k: 2,
        index: 1,
        array: [1, 2, 3],
      })

      expect(result.steps).toHaveLength(3)
      expect(result.steps[0]).toMatchObject({
        type: 'initial',
        array: [3, 1, 2],
      })
      expect(result.steps[1]).toMatchObject({
        type: 'flip',
        k: 3,
        array: [2, 1, 3],
      })
      expect(result.steps[2]).toMatchObject({
        type: 'flip',
        k: 2,
        array: [1, 2, 3],
      })
    })
  })

  describe('2. Algorithm Correctness', () => {
    it('produces a correctly sorted array in ascending order for various inputs', () => {
      const testCases = [
        [3, 1, 2],
        [4, 2, 5, 1, 3],
        [10, -3, 0, 8, -5, 2, 7],
        [100, 50, 20, 10, 5, 1],
        [15, 8, 20, 3, 11, 6, 18, 2],
      ]

      for (const testCase of testCases) {
        const result = pancakeSort(testCase)
        expect(isAscending(result.sorted)).toBe(true)
        expect(result.sorted).toEqual(
          [...testCase].sort((a, b) => a - b)
        )
      }
    })
  })

  describe('3. Operation Validity', () => {
    it('ensures every recorded operation reverses a valid non-empty prefix within bounds', () => {
      const inputs = [
        [3, 1, 2],
        [9, 7, 5, 3, 1],
        [2, 4, 1, 5, 3],
        [-2, -5, 0, 3, -1],
      ]

      for (const input of inputs) {
        const result = pancakeSort(input)
        let currentState = [...input]

        for (const op of result.operations) {
          expect(op.type).toBe('flip')
          expect(Number.isInteger(op.k)).toBe(true)
          expect(op.k).toBeGreaterThanOrEqual(2)
          expect(op.k).toBeLessThanOrEqual(input.length)
          expect(op.index).toBe(op.k - 1)

          // Verify prefix reversal manually
          const expectedReversal = [
            ...currentState.slice(0, op.k).reverse(),
            ...currentState.slice(op.k),
          ]
          expect(op.array).toEqual(expectedReversal)
          currentState = op.array
        }

        expect(currentState).toEqual(result.sorted)
      }
    })
  })

  describe('4. Replay Correctness', () => {
    it('replaying all recorded operations reproduces the final sorted result', () => {
      const inputs = [
        [3, 1, 2],
        [6, 3, 8, 5, 2, 7, 4, 1],
        [1, 3, 2, 4],
        [5, 1, 4, 2, 3],
      ]

      for (const input of inputs) {
        const result = pancakeSort(input)
        const replayed = replayOperations(input, result.operations)
        expect(replayed).toEqual(result.sorted)

        const trace = replayTrace(input, result.operations)
        expect(trace[0]).toEqual(input)
        expect(trace[trace.length - 1]).toEqual(result.sorted)
        expect(trace.length).toBe(result.operations.length + 1)
      }
    })
  })

  describe('5. Multiplicity Preservation', () => {
    it('preserves all original elements and their exact counts without loss or duplication', () => {
      const inputs = [
        [3, 1, 2],
        [4, 2, 4, 3, 2, 1, 4],
        [5, 5, 5, 5],
        [1, 2, 1, 2, 1, 2],
        [-1, 0, -1, 2, 0, -1],
      ]

      for (const input of inputs) {
        const result = pancakeSort(input)
        const inputFreq = getFrequencyMap(input)
        const sortedFreq = getFrequencyMap(result.sorted)

        expect(result.sorted.length).toBe(input.length)
        expect(sortedFreq).toEqual(inputFreq)

        // Intermediate states must also preserve multiplicities
        for (const op of result.operations) {
          expect(getFrequencyMap(op.array)).toEqual(inputFreq)
        }
      }
    })
  })

  describe('6. Original Input Preservation (Pure-Function Contract)', () => {
    it('does not mutate the caller input array', () => {
      const input = [3, 1, 2]
      const frozenInput = Object.freeze([3, 1, 2])

      expect(() => pancakeSort(frozenInput)).not.toThrow()

      const inputCopy = [...input]
      const result = pancakeSort(input)

      expect(input).toEqual(inputCopy)
      expect(result.sorted).not.toBe(input)
    })
  })

  describe('7. Edge Cases', () => {
    it('handles empty array correctly', () => {
      const input = []
      const result = pancakeSort(input)

      expect(result.sorted).toEqual([])
      expect(result.operations).toEqual([])
      expect(result.steps).toHaveLength(1)
      expect(result.steps[0]).toMatchObject({
        type: 'initial',
        array: [],
      })
      expect(replayOperations(input, result.operations)).toEqual([])
    })

    it('handles single-element array correctly', () => {
      const input = [42]
      const result = pancakeSort(input)

      expect(result.sorted).toEqual([42])
      expect(result.operations).toEqual([])
      expect(result.steps).toHaveLength(1)
      expect(result.steps[0]).toMatchObject({
        type: 'initial',
        array: [42],
      })
      expect(replayOperations(input, result.operations)).toEqual([42])
    })

    it('handles already sorted array with zero operations', () => {
      const input = [1, 2, 3, 4, 5]
      const result = pancakeSort(input)

      expect(result.sorted).toEqual([1, 2, 3, 4, 5])
      expect(result.operations).toEqual([])
      expect(replayOperations(input, result.operations)).toEqual([1, 2, 3, 4, 5])
    })

    it('handles reverse-sorted array correctly', () => {
      const input = [5, 4, 3, 2, 1]
      const result = pancakeSort(input)

      expect(result.sorted).toEqual([1, 2, 3, 4, 5])
      expect(isAscending(result.sorted)).toBe(true)
      expect(replayOperations(input, result.operations)).toEqual([1, 2, 3, 4, 5])
    })

    it('handles array with duplicate values and retains stability/counts', () => {
      const input = [3, 1, 3, 2, 1, 2]
      const result = pancakeSort(input)

      expect(result.sorted).toEqual([1, 1, 2, 2, 3, 3])
      expect(isAscending(result.sorted)).toBe(true)
      expect(replayOperations(input, result.operations)).toEqual([1, 1, 2, 2, 3, 3])
      expect(getFrequencyMap(result.sorted)).toEqual(getFrequencyMap(input))
    })

    it('handles all elements identical with zero operations', () => {
      const input = [7, 7, 7, 7]
      const result = pancakeSort(input)

      expect(result.sorted).toEqual([7, 7, 7, 7])
      expect(result.operations).toHaveLength(0)
    })
  })

  describe('8. Prefix Flip Utility Contract', () => {
    it('reverses valid prefix without mutating source array', () => {
      const original = [10, 20, 30, 40]
      const flipped = flip(original, 3)

      expect(flipped).toEqual([30, 20, 10, 40])
      expect(original).toEqual([10, 20, 30, 40])
    })

    it('handles k = 0 and k = 1 as non-mutating identity copies', () => {
      const original = [1, 2, 3]
      expect(flip(original, 0)).toEqual([1, 2, 3])
      expect(flip(original, 1)).toEqual([1, 2, 3])
    })

    it('throws on out-of-range or non-integer k', () => {
      expect(() => flip([1, 2], -1)).toThrow(RangeError)
      expect(() => flip([1, 2], 3)).toThrow(RangeError)
      expect(() => flip([1, 2], 1.5)).toThrow(RangeError)
      expect(() => flip('not-array', 1)).toThrow(TypeError)
    })

    it('throws TypeError when pancakeSort or replay receives non-array', () => {
      expect(() => pancakeSort(null)).toThrow(TypeError)
      expect(() => pancakeSort('string')).toThrow(TypeError)
      expect(() => replayOperations(null, [])).toThrow(TypeError)
      expect(() => replayOperations([1], null)).toThrow(TypeError)
    })
  })
})

