import { describe, it, expect } from 'vitest'
import {
  slidingWindowMaximum,
  maxSlidingWindow,
} from './sliding-window-maximum'

/**
 * Independent Reference Implementation (Brute-Force Baseline).
 *
 * Uses a straightforward nested-loop approach with O(n * k) time complexity
 * and O(1) auxiliary space (excluding result).
 *
 * Genuinely independent of the monotonic deque implementation under test.
 *
 * @param {Array<number>} arr - Input array.
 * @param {number} k - Window size.
 * @returns {Array<number>} Maximum element in each sliding window.
 */
function referenceSlidingWindowMax(arr, k) {
  if (!Array.isArray(arr)) {
    throw new TypeError('First argument must be an array')
  }
  if (typeof k !== 'number' || !Number.isInteger(k)) {
    throw new TypeError('Window size k must be an integer')
  }
  if (k <= 0) {
    throw new RangeError(
      `Window size k must be a positive integer greater than 0, received: ${k}`
    )
  }
  if (k > arr.length) {
    throw new RangeError(
      `Window size k (${k}) cannot be greater than array length (${arr.length})`
    )
  }

  const result = []
  const numWindows = arr.length - k + 1

  for (let i = 0; i < numWindows; i++) {
    let windowMax = arr[i]
    for (let j = 1; j < k; j++) {
      if (arr[i + j] > windowMax) {
        windowMax = arr[i + j]
      }
    }
    result.push(windowMax)
  }

  return result
}

describe('R62-T043: Sliding Window Maximum Regression & Reference Comparison', () => {
  describe('1. Explicit Required Example', () => {
    it('correctly calculates maximums for [1, 3, -1, -3, 5, 3, 6, 7] with k = 3', () => {
      const input = [1, 3, -1, -3, 5, 3, 6, 7]
      const k = 3
      const expected = [3, 3, 5, 5, 6, 7]

      const actual = slidingWindowMaximum(input, k)
      const refActual = referenceSlidingWindowMax(input, k)

      expect(actual).toEqual(expected)
      expect(actual).toEqual(refActual)
      expect(actual).toHaveLength(input.length - k + 1)
    })
  })

  describe('2. Window Validation & Error Handling', () => {
    it('rejects window size k = 0 with a clear RangeError', () => {
      expect(() => slidingWindowMaximum([1, 3, -1], 0)).toThrow(RangeError)
    })

    it('rejects negative window size with RangeError', () => {
      expect(() => slidingWindowMaximum([1, 2, 3], -1)).toThrow(RangeError)
      expect(() => slidingWindowMaximum([1, 2, 3], -5)).toThrow(RangeError)
    })

    it('rejects window size greater than array length with RangeError', () => {
      expect(() => slidingWindowMaximum([1, 2], 3)).toThrow(RangeError)
      expect(() => slidingWindowMaximum([10], 2)).toThrow(RangeError)
    })

    it('handles empty input consistently according to contract (k > arr.length throws RangeError)', () => {
      expect(() => slidingWindowMaximum([], 1)).toThrow(RangeError)
      expect(() => slidingWindowMaximum([], 0)).toThrow(RangeError)
    })

    it('rejects non-integer k with TypeError', () => {
      expect(() => slidingWindowMaximum([1, 2, 3], 1.5)).toThrow(TypeError)
      expect(() => slidingWindowMaximum([1, 2, 3], '3')).toThrow(TypeError)
      expect(() => slidingWindowMaximum([1, 2, 3], null)).toThrow(TypeError)
    })

    it('rejects non-array input with TypeError', () => {
      expect(() => slidingWindowMaximum(null, 2)).toThrow(TypeError)
      expect(() => slidingWindowMaximum('123', 2)).toThrow(TypeError)
      expect(() => slidingWindowMaximum({ length: 3 }, 2)).toThrow(TypeError)
    })
  })

  describe('3. Edge Cases', () => {
    it('handles single-element array with k = 1', () => {
      const input = [42]
      const k = 1
      const expected = [42]

      expect(slidingWindowMaximum(input, k)).toEqual(expected)
      expect(slidingWindowMaximum(input, k)).toEqual(
        referenceSlidingWindowMax(input, k)
      )
    })

    it('handles window size equal to entire array length', () => {
      const input = [2, 8, 4, 1, 9, 3]
      const k = input.length
      const expected = [9]

      expect(slidingWindowMaximum(input, k)).toEqual(expected)
      expect(slidingWindowMaximum(input, k)).toEqual(
        referenceSlidingWindowMax(input, k)
      )
    })

    it('handles strictly increasing (already sorted) array', () => {
      const input = [1, 2, 3, 4, 5, 6]
      const k = 3
      const expected = [3, 4, 5, 6]

      expect(slidingWindowMaximum(input, k)).toEqual(expected)
      expect(slidingWindowMaximum(input, k)).toEqual(
        referenceSlidingWindowMax(input, k)
      )
    })

    it('handles strictly decreasing (reverse-sorted) array', () => {
      const input = [6, 5, 4, 3, 2, 1]
      const k = 3
      const expected = [6, 5, 4, 3]

      expect(slidingWindowMaximum(input, k)).toEqual(expected)
      expect(slidingWindowMaximum(input, k)).toEqual(
        referenceSlidingWindowMax(input, k)
      )
    })

    it('handles array containing duplicate values', () => {
      const input = [4, 4, 4, 4, 4]
      const k = 3
      const expected = [4, 4, 4]

      expect(slidingWindowMaximum(input, k)).toEqual(expected)
      expect(slidingWindowMaximum(input, k)).toEqual(
        referenceSlidingWindowMax(input, k)
      )

      const mixedDups = [1, 3, 1, 2, 0, 5, 5, 2]
      expect(slidingWindowMaximum(mixedDups, 3)).toEqual(
        referenceSlidingWindowMax(mixedDups, 3)
      )
    })

    it('handles array containing all negative values', () => {
      const input = [-7, -8, -6, -9, -4, -5]
      const k = 3
      const expected = [-6, -6, -4, -4]

      expect(slidingWindowMaximum(input, k)).toEqual(expected)
      expect(slidingWindowMaximum(input, k)).toEqual(
        referenceSlidingWindowMax(input, k)
      )
    })
  })

  describe('4. Independent Reference Comparison', () => {
    const testSuites = [
      {
        name: 'Mixed positive and negative values with small window',
        arr: [9, -2, 5, -1, 3, 7, -4, 8, 2],
        k: 2,
      },
      {
        name: 'Alternating peaks and valleys',
        arr: [1, 10, 2, 9, 3, 8, 4, 7],
        k: 3,
      },
      {
        name: 'Repeated plateaus and drop-offs',
        arr: [5, 5, 2, 2, 8, 8, 1, 1],
        k: 4,
      },
      {
        name: 'Larger array with wide window',
        arr: [-10, 20, -30, 40, -50, 60, -70, 80, -90, 100],
        k: 5,
      },
      {
        name: 'k = 1 identity mapping',
        arr: [3, 1, 4, 1, 5, 9, 2, 6],
        k: 1,
      },
    ]

    for (const { name, arr, k } of testSuites) {
      it(`matches independent reference for: ${name}`, () => {
        const optimized = slidingWindowMaximum(arr, k)
        const reference = referenceSlidingWindowMax(arr, k)

        expect(optimized).toEqual(reference)
        expect(optimized).toHaveLength(arr.length - k + 1)
      })
    }

    it('fails when result is intentionally mismatched (sensitivity check)', () => {
      const input = [1, 3, -1, -3, 5, 3, 6, 7]
      const actual = slidingWindowMaximum(input, 3)
      const wrong = [3, 3, 5, 5, 6, 999]

      expect(actual).not.toEqual(wrong)
    })
  })

  describe('5. Original Input Preservation (Pure Function Contract)', () => {
    it('does not mutate the input array during execution', () => {
      const original = [1, 3, -1, -3, 5, 3, 6, 7]
      const frozen = Object.freeze([...original])

      // Should execute without throwing on frozen array
      let actual
      expect(() => {
        actual = slidingWindowMaximum(frozen, 3)
      }).not.toThrow()

      expect(actual).toEqual([3, 3, 5, 5, 6, 7])
      expect(frozen).toEqual(original)
    })

    it('returns a new array and does not return caller array references', () => {
      const input = [1, 2, 3]
      const result = slidingWindowMaximum(input, 1)

      expect(result).not.toBe(input)
    })
  })

  describe('6. Module Export Convention', () => {
    it('exports alias maxSlidingWindow matching slidingWindowMaximum', () => {
      expect(maxSlidingWindow).toBe(slidingWindowMaximum)
    })
  })
})

