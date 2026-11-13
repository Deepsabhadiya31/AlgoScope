import assert from 'node:assert/strict'
import {
  slidingWindowMaximum,
  maxSlidingWindow,
} from '../../src/algorithms/course/sliding-window-maximum.js'

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

console.log('--- R62-T043 Sliding Window Maximum Verification ---')

// 1. Required example
console.log('1. Verifying Required Example: [1, 3, -1, -3, 5, 3, 6, 7], k = 3...')
const reqInput = [1, 3, -1, -3, 5, 3, 6, 7]
const reqExpected = [3, 3, 5, 5, 6, 7]
const reqActual = slidingWindowMaximum(reqInput, 3)
assert.deepStrictEqual(reqActual, reqExpected, 'Required example output must match expected')
assert.deepStrictEqual(reqActual, referenceSlidingWindowMax(reqInput, 3), 'Output must match reference')
console.log('  PASS: Required example verified.')

// 2. Reject k = 0 with RangeError
console.log('2. Verifying rejection of k = 0...')
assert.throws(() => slidingWindowMaximum([1, 3, -1], 0), RangeError)
console.log('  PASS: k = 0 correctly throws RangeError.')

// 3. Reject negative k and k > arr.length
console.log('3. Verifying rejection of invalid window sizes...')
assert.throws(() => slidingWindowMaximum([1, 2, 3], -1), RangeError)
assert.throws(() => slidingWindowMaximum([1, 2], 3), RangeError)
assert.throws(() => slidingWindowMaximum([], 1), RangeError)
assert.throws(() => slidingWindowMaximum([], 0), RangeError)
console.log('  PASS: Invalid window sizes correctly throw RangeError.')

// 4. Edge cases
console.log('4. Verifying Edge Cases...')
// Single element k=1
assert.deepStrictEqual(slidingWindowMaximum([42], 1), [42])
// k = arr.length
assert.deepStrictEqual(slidingWindowMaximum([2, 8, 4, 1, 9, 3], 6), [9])
// Already sorted
assert.deepStrictEqual(slidingWindowMaximum([1, 2, 3, 4, 5, 6], 3), [3, 4, 5, 6])
// Reverse sorted
assert.deepStrictEqual(slidingWindowMaximum([6, 5, 4, 3, 2, 1], 3), [6, 5, 4, 3])
// Duplicates
assert.deepStrictEqual(slidingWindowMaximum([4, 4, 4, 4], 2), [4, 4, 4])
// Negative numbers
assert.deepStrictEqual(slidingWindowMaximum([-7, -8, -6, -9], 2), [-7, -6, -6])
console.log('  PASS: Edge cases verified.')

// 5. Independent comparison across multiple arrays
console.log('5. Verifying against Independent Reference across multiple test cases...')
const testCases = [
  { arr: [9, -2, 5, -1, 3, 7, -4, 8, 2], k: 2 },
  { arr: [1, 10, 2, 9, 3, 8, 4, 7], k: 3 },
  { arr: [5, 5, 2, 2, 8, 8, 1, 1], k: 4 },
  { arr: [-10, 20, -30, 40, -50, 60, -70, 80], k: 5 },
  { arr: [3, 1, 4, 1, 5, 9, 2, 6], k: 1 },
]
for (const { arr, k } of testCases) {
  const opt = slidingWindowMaximum(arr, k)
  const ref = referenceSlidingWindowMax(arr, k)
  assert.deepStrictEqual(opt, ref, `Optimized must match reference for window size ${k}`)
}
console.log('  PASS: Independent reference comparisons verified.')

// 6. Non-mutation of original input
console.log('6. Verifying Non-Mutation Contract...')
const frozen = Object.freeze([1, 3, -1, -3, 5, 3, 6, 7])
assert.doesNotThrow(() => slidingWindowMaximum(frozen, 3))
assert.deepStrictEqual(frozen, [1, 3, -1, -3, 5, 3, 6, 7])
console.log('  PASS: Input non-mutation verified.')

// 7. Alias export check
console.log('7. Verifying Alias Export...')
assert.strictEqual(maxSlidingWindow, slidingWindowMaximum)
console.log('  PASS: Alias export verified.')

console.log('ALL VERIFICATIONS PASSED.')

