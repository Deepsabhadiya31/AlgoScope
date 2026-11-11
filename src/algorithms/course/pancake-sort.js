/**
 * Reverses a prefix of length k in an array.
 * Pure function: returns a new array with the prefix reversed and does not mutate the input array.
 *
 * @param {Array} arr - The array whose prefix is to be reversed.
 * @param {number} k - The number of elements from the front to reverse (0 <= k <= arr.length).
 * @returns {Array} A new array with the prefix reversed.
 */
export function flip(arr, k) {
  if (!Array.isArray(arr)) {
    throw new TypeError('First argument must be an array')
  }
  if (!Number.isInteger(k) || k < 0 || k > arr.length) {
    throw new RangeError(
      `k must be an integer between 0 and array length (${arr.length}), received: ${k}`
    )
  }

  const result = [...arr]
  let left = 0
  let right = k - 1
  while (left < right) {
    const temp = result[left]
    result[left] = result[right]
    result[right] = temp
    left++
    right--
  }
  return result
}

/**
 * Replays a sequence of recorded prefix-reversal operations from an initial array.
 *
 * @param {Array} initialArray - The initial array before any operations.
 * @param {Array<Object|number>} operations - Array of recorded flip operations (objects with .k or integers).
 * @returns {Array} The final array resulting from applying the operations in sequence.
 */
export function replayOperations(initialArray, operations = []) {
  if (!Array.isArray(initialArray)) {
    throw new TypeError('initialArray must be an array')
  }
  if (!Array.isArray(operations)) {
    throw new TypeError('operations must be an array')
  }

  let current = [...initialArray]
  for (const op of operations) {
    const k = typeof op === 'number' ? op : op?.k
    if (
      typeof k !== 'number' ||
      !Number.isInteger(k) ||
      k < 1 ||
      k > current.length
    ) {
      throw new RangeError(
        `Invalid operation: k must be an integer between 1 and ${current.length}, received: ${k}`
      )
    }
    current = flip(current, k)
  }
  return current
}

export { replayOperations as replay }

/**
 * Replays operations and returns all intermediate states including initial and final.
 *
 * @param {Array} initialArray - The initial array before operations.
 * @param {Array<Object|number>} operations - Sequence of operations to replay.
 * @returns {Array<Array>} Sequence of array states: [initialState, ...afterEachOperation].
 */
export function replayTrace(initialArray, operations = []) {
  if (!Array.isArray(initialArray)) {
    throw new TypeError('initialArray must be an array')
  }
  if (!Array.isArray(operations)) {
    throw new TypeError('operations must be an array')
  }

  const states = [[...initialArray]]
  let current = [...initialArray]
  for (const op of operations) {
    const k = typeof op === 'number' ? op : op?.k
    if (
      typeof k !== 'number' ||
      !Number.isInteger(k) ||
      k < 1 ||
      k > current.length
    ) {
      throw new RangeError(
        `Invalid operation: k must be an integer between 1 and ${current.length}, received: ${k}`
      )
    }
    current = flip(current, k)
    states.push([...current])
  }
  return states
}

/**
 * Sorts an array using the Pancake Sort algorithm (prefix reversals only)
 * and records a replayable trace of all operations.
 *
 * Pure function: does not mutate the caller's input array.
 *
 * @param {Array<number>} inputArray - Array of comparable elements.
 * @returns {{ sorted: Array<number>, operations: Array<Object>, steps: Array<Object> }}
 */
export function pancakeSort(inputArray) {
  if (!Array.isArray(inputArray)) {
    throw new TypeError('inputArray must be an array')
  }

  const arr = [...inputArray]
  const n = arr.length
  const operations = []
  const steps = [
    {
      type: 'initial',
      k: 0,
      index: -1,
      array: [...arr],
      message: 'Initial array state',
    },
  ]

  if (n <= 1) {
    return {
      sorted: [...arr],
      operations,
      steps,
    }
  }

  for (let currSize = n; currSize > 1; currSize--) {
    let maxIdx = 0
    for (let i = 1; i < currSize; i++) {
      if (arr[i] > arr[maxIdx]) {
        maxIdx = i
      }
    }

    // Optimize duplicate handling:
    // If an instance of the maximum is already at the target index, no flip is needed.
    if (arr[currSize - 1] === arr[maxIdx]) {
      maxIdx = currSize - 1
    } else if (arr[0] === arr[maxIdx]) {
      // If an instance of the maximum is already at the front, skip the first flip.
      maxIdx = 0
    }

    if (maxIdx !== currSize - 1) {
      if (maxIdx > 0) {
        const k1 = maxIdx + 1
        let left = 0
        let right = maxIdx
        while (left < right) {
          const temp = arr[left]
          arr[left] = arr[right]
          arr[right] = temp
          left++
          right--
        }

        const op1 = {
          type: 'flip',
          k: k1,
          index: maxIdx,
          array: [...arr],
          message: `Flipped prefix of length ${k1} to bring max value ${arr[0]} to front`,
        }
        operations.push(op1)
        steps.push(op1)
      }

      const k2 = currSize
      let left = 0
      let right = currSize - 1
      while (left < right) {
        const temp = arr[left]
        arr[left] = arr[right]
        arr[right] = temp
        left++
        right--
      }

      const op2 = {
        type: 'flip',
        k: k2,
        index: currSize - 1,
        array: [...arr],
        message: `Flipped prefix of length ${k2} to place max value ${arr[currSize - 1]} at index ${currSize - 1}`,
      }
      operations.push(op2)
      steps.push(op2)
    }
  }

  return {
    sorted: [...arr],
    operations,
    steps,
  }
}

export default pancakeSort

