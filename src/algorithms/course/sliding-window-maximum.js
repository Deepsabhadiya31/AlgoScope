/**
 * Calculates the maximum element in every contiguous sliding window of size k.
 *
 * Implements an optimal monotonic deque approach:
 * - Time Complexity: O(n) — each index is pushed and popped from the deque at most once.
 * - Auxiliary Space: O(k) — the deque stores at most k indices at any point.
 *
 * Contract & Validation:
 * - arr: Must be an Array. Throws TypeError if not an array.
 * - k: Must be a positive integer (k > 0).
 *      Throws TypeError if k is not an integer.
 *      Throws RangeError if k <= 0 (e.g. k = 0 or negative).
 *      Throws RangeError if k > arr.length (including when arr is empty).
 * - Pure function: Does not mutate the caller's input array.
 *
 * @param {Array<number>} arr - Array of numerical elements.
 * @param {number} k - Sliding window size.
 * @returns {Array<number>} Array of maximum values for each window of size k.
 * @throws {TypeError} If arr is not an array or k is not an integer.
 * @throws {RangeError} If k <= 0 or k > arr.length.
 */
export function slidingWindowMaximum(arr, k) {
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

  const n = arr.length
  const result = []

  // deque stores indices of array elements in strictly decreasing order of their values.
  // We use head index pointer for O(1) amortized pop-front operations.
  const deque = []
  let head = 0

  for (let i = 0; i < n; i++) {
    const currentVal = arr[i]

    // 1. Remove indices from front that fall outside the current sliding window [i - k + 1, i]
    while (head < deque.length && deque[head] <= i - k) {
      head++
    }

    // 2. Remove indices from back whose values are smaller than or equal to the incoming value.
    // An element <= currentVal that arrives earlier will never be the maximum of this or future windows.
    while (head < deque.length && arr[deque[deque.length - 1]] <= currentVal) {
      deque.pop()
    }

    // 3. Add current index to the back
    deque.push(i)

    // 4. Once the first window of size k is complete, record the maximum (at deque[head])
    if (i >= k - 1) {
      result.push(arr[deque[head]])
    }
  }

  return result
}

export { slidingWindowMaximum as maxSlidingWindow }
export default slidingWindowMaximum

