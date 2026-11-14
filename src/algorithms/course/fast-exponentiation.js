/**
 * Fast Exponentiation (Binary Exponentiation / Exponentiation by Squaring)
 * Pure Algorithm Module with Deterministic Execution, Seeded Trace Generation,
 * and Invariant Replay Capabilities.
 *
 * Mathematical Principles:
 *  - Calculates base^exp in O(log2(exp)) multiplications rather than O(exp).
 *  - Principle:
 *      base^0 = 1
 *      base^exp = (base^2)^(exp / 2)       if exp is even
 *      base^exp = base * base^(exp - 1)     if exp is odd
 *
 * Domain & Contract:
 *  - base: Any finite real number.
 *  - exp: Non-negative integer (exp >= 0, integer).
 *  - Special values:
 *      base^0 === 1 for any valid base (including 0^0 = 1 per discrete math and JS Math.pow standard).
 *      base^1 === base.
 *      0^exp === 0 for exp > 0.
 *  - Precision limits: Standard IEEE 754 64-bit float limits apply. Results exceeding
 *    ~1.797e308 evaluate to Infinity. Numbers larger than Number.MAX_SAFE_INTEGER (2^53 - 1)
 *    may lose precision in the least significant digits.
 *
 * Determinism & Reproducibility:
 *  - Identical inputs (base, exp) always produce identical results and traces.
 *  - Replay transitions are deterministic and completely isolated from real-time clocks or timers.
 *  - Optional seed support uses a deterministic Linear Congruential Generator (LCG) PRNG.
 */

/**
 * Creates a deterministic pseudo-random number generator (LCG) from an integer seed.
 *
 * @param {number} [seed=123456789] - Initial seed value.
 * @returns {() => number} Returns a float in [0, 1).
 */
export function createPRNG(seed = 123456789) {
  let state = (Math.abs(Math.floor(seed)) || 123456789) % 2147483647
  return function next() {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

/**
 * Validates input base and exponent for fast exponentiation.
 *
 * @param {number} base - The base number.
 * @param {number} exp - The exponent.
 * @throws {TypeError} If base or exp is not a number or exp is not an integer.
 * @throws {RangeError} If exp is negative.
 */
export function validateInputs(base, exp) {
  if (typeof base !== 'number' || Number.isNaN(base)) {
    throw new TypeError(`Base must be a valid number, received: ${base}`)
  }
  if (!Number.isFinite(base)) {
    throw new TypeError(`Base must be a finite number, received: ${base}`)
  }
  if (typeof exp !== 'number' || Number.isNaN(exp)) {
    throw new TypeError(`Exponent must be an integer number, received: ${exp}`)
  }
  if (!Number.isInteger(exp)) {
    throw new TypeError(`Exponent must be an integer, received: ${exp}`)
  }
  if (exp < 0) {
    throw new RangeError(`Exponent must be a non-negative integer (exp >= 0), received: ${exp}`)
  }
}

/**
 * Computes base^exp using exponentiation by squaring.
 * Pure mathematical function with zero side effects.
 *
 * @param {number} base - Base number.
 * @param {number} exp - Non-negative integer exponent.
 * @returns {number} The calculated value base^exp.
 */
export function fastPow(base, exp) {
  validateInputs(base, exp)

  if (exp === 0) return 1
  if (exp === 1) return base
  if (base === 0) return 0
  if (base === 1) return 1

  let result = 1
  let currentBase = base
  let currentExp = exp

  while (currentExp > 0) {
    // If lowest bit is 1, multiply result by currentBase
    if (currentExp % 2 === 1) {
      result *= currentBase
    }
    currentExp = Math.floor(currentExp / 2)
    if (currentExp > 0) {
      currentBase *= currentBase
    }
  }

  return result
}

/**
 * Computes theoretical complexity parameters for a given exponent.
 *
 * @param {number} exp - Non-negative integer exponent.
 * @returns {{
 *   exp: number,
 *   bitLength: number,
 *   binaryString: string,
 *   multiplications: number,
 *   squarings: number,
 *   totalOperations: number,
 *   naiveMultiplications: number
 * }}
 */
export function getExpoComplexity(exp) {
  if (typeof exp !== 'number' || !Number.isInteger(exp) || exp < 0) {
    throw new TypeError('Exponent must be a non-negative integer')
  }

  if (exp === 0) {
    return {
      exp: 0,
      bitLength: 0,
      binaryString: '0',
      multiplications: 0,
      squarings: 0,
      totalOperations: 0,
      naiveMultiplications: 0,
    }
  }

  const binaryString = exp.toString(2)
  const bitLength = binaryString.length
  let multiplications = 0
  for (let i = 0; i < binaryString.length; i++) {
    if (binaryString[i] === '1') {
      multiplications++
    }
  }
  const squarings = Math.max(0, bitLength - 1)

  return {
    exp,
    bitLength,
    binaryString,
    multiplications,
    squarings,
    totalOperations: multiplications + squarings,
    naiveMultiplications: exp,
  }
}

/**
 * Creates an immutable frozen step object for visualizer/replay consumption.
 *
 * @param {Object} stepData - Step payload.
 * @returns {Readonly<Object>} Frozen step object.
 */
function createFrozenStep(stepData) {
  const step = {
    ...stepData,
    variables: Object.freeze({ ...(stepData.variables || {}) }),
  }
  return Object.freeze(step)
}

/**
 * Calculates fast exponentiation and generates a deterministic execution trace.
 *
 * @param {number} base - Base number.
 * @param {number} exp - Non-negative integer exponent.
 * @param {Object} [options={}] - Execution options.
 * @param {number} [options.stepDuration=0] - Explicit duration for each step (ms).
 * @param {number} [options.seed] - Optional seed for deterministic PRNG if random variations are requested.
 * @returns {{
 *   result: number,
 *   steps: Array<Readonly<Object>>,
 *   complexity: Object,
 *   isDeterministic: boolean
 * }}
 */
export function fastExponentiation(base, exp, options = {}) {
  validateInputs(base, exp)

  const stepDuration = typeof options.stepDuration === 'number' ? options.stepDuration : 0
  const steps = []
  let stepIndex = 0

  const complexity = getExpoComplexity(exp)
  const bits = exp > 0 ? exp.toString(2).split('').map(Number) : [0]

  // Step 1: Start
  steps.push(
    createFrozenStep({
      stepIndex: stepIndex++,
      type: 'start',
      lineKey: 'start',
      base,
      exp,
      result: 1,
      bit: null,
      bitIndex: null,
      bits,
      message: `Compute ${base}^${exp}. Binary representation of ${exp} is ${complexity.binaryString} (bit length: ${complexity.bitLength}).`,
      variables: { base, exp, result: 1, currentBase: base, currentExp: exp },
      duration: stepDuration,
    })
  )

  let result = 1
  let currentBase = base
  let currentExp = exp
  let bitIndex = 0

  while (currentExp > 0) {
    const bit = currentExp % 2

    // Check bit step
    steps.push(
      createFrozenStep({
        stepIndex: stepIndex++,
        type: 'checkBit',
        lineKey: 'checkBit',
        base: currentBase,
        exp: currentExp,
        result,
        bit,
        bitIndex,
        bits,
        message: `Bit at index ${bitIndex} (LSB position) is ${bit}. ${
          bit === 1
            ? `Bit is 1: multiply result (${result}) by currentBase (${currentBase}) = ${result * currentBase}.`
            : 'Bit is 0: skip multiplication.'
        }`,
        variables: { base, exp, result, currentBase, currentExp, bit, bitIndex },
        duration: stepDuration,
      })
    )

    if (bit === 1) {
      result *= currentBase
      steps.push(
        createFrozenStep({
          stepIndex: stepIndex++,
          type: 'multiply',
          lineKey: 'multiply',
          base: currentBase,
          exp: currentExp,
          result,
          bit,
          bitIndex,
          bits,
          message: `Accumulated result updated to ${result}.`,
          variables: { base, exp, result, currentBase, currentExp, bit, bitIndex },
          duration: stepDuration,
        })
      )
    }

    currentExp = Math.floor(currentExp / 2)
    bitIndex++

    if (currentExp > 0) {
      const nextBase = currentBase * currentBase
      steps.push(
        createFrozenStep({
          stepIndex: stepIndex++,
          type: 'square',
          lineKey: 'square',
          base: nextBase,
          exp: currentExp,
          result,
          bit: null,
          bitIndex,
          bits,
          message: `Square base: ${currentBase}^2 = ${nextBase}. Shift exponent right to ${currentExp}.`,
          variables: { base, exp, result, currentBase: nextBase, currentExp, bitIndex },
          duration: stepDuration,
        })
      )
      currentBase = nextBase
    }
  }

  // Step final: Complete
  steps.push(
    createFrozenStep({
      stepIndex: stepIndex++,
      type: 'complete',
      lineKey: 'result',
      base,
      exp,
      result,
      bit: null,
      bitIndex: null,
      bits,
      message: `Completed fast exponentiation: ${base}^${exp} = ${result}.`,
      variables: { base, exp, result },
      duration: stepDuration,
    })
  )

  return {
    result,
    steps,
    complexity,
    isDeterministic: true,
  }
}

/**
 * Replays a recorded trace of steps and verifies mathematical transitions.
 *
 * @param {Array<Object>} steps - Recorded execution steps.
 * @returns {{
 *   valid: boolean,
 *   finalResult: number,
 *   stepCount: number,
 *   replayedStates: Array<Object>,
 *   error: string | null
 * }}
 */
export function replayFastExpoTrace(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return {
      valid: false,
      finalResult: NaN,
      stepCount: 0,
      replayedStates: [],
      error: 'Trace must be a non-empty array of steps',
    }
  }

  const initialStep = steps[0]
  if (initialStep.type !== 'start') {
    return {
      valid: false,
      finalResult: NaN,
      stepCount: steps.length,
      replayedStates: [],
      error: 'First step must have type "start"',
    }
  }

  const base = initialStep.base
  const exp = initialStep.exp
  const replayedStates = []

  let expectedResult = 1
  let expectedBase = base
  let expectedExp = exp

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i]

    if (s.stepIndex !== i) {
      return {
        valid: false,
        finalResult: NaN,
        stepCount: steps.length,
        replayedStates,
        error: `Step index sequence broken at index ${i}: stepIndex was ${s.stepIndex}`,
      }
    }

    if (s.type === 'start') {
      replayedStates.push({ step: i, type: 'start', result: expectedResult })
    } else if (s.type === 'checkBit') {
      const bit = expectedExp % 2
      if (s.bit !== bit) {
        return {
          valid: false,
          finalResult: NaN,
          stepCount: steps.length,
          replayedStates,
          error: `Bit mismatch at step ${i}: expected ${bit}, got ${s.bit}`,
        }
      }
      replayedStates.push({ step: i, type: 'checkBit', bit, currentExp: expectedExp })
    } else if (s.type === 'multiply') {
      expectedResult *= expectedBase
      if (s.result !== expectedResult) {
        return {
          valid: false,
          finalResult: NaN,
          stepCount: steps.length,
          replayedStates,
          error: `Result mismatch after multiplication at step ${i}: expected ${expectedResult}, got ${s.result}`,
        }
      }
      replayedStates.push({ step: i, type: 'multiply', result: expectedResult })
    } else if (s.type === 'square') {
      expectedExp = Math.floor(expectedExp / 2)
      expectedBase *= expectedBase
      if (s.base !== expectedBase || s.exp !== expectedExp) {
        return {
          valid: false,
          finalResult: NaN,
          stepCount: steps.length,
          replayedStates,
          error: `State mismatch after squaring at step ${i}: expected base ${expectedBase}, got ${s.base}`,
        }
      }
      replayedStates.push({ step: i, type: 'square', base: expectedBase, exp: expectedExp })
    } else if (s.type === 'complete') {
      if (s.result !== expectedResult) {
        return {
          valid: false,
          finalResult: NaN,
          stepCount: steps.length,
          replayedStates,
          error: `Final result mismatch: expected ${expectedResult}, got ${s.result}`,
        }
      }
      replayedStates.push({ step: i, type: 'complete', result: expectedResult })
    }
  }

  const finalStep = steps[steps.length - 1]
  if (finalStep.type !== 'complete') {
    return {
      valid: false,
      finalResult: NaN,
      stepCount: steps.length,
      replayedStates,
      error: 'Final step must have type "complete"',
    }
  }

  return {
    valid: true,
    finalResult: finalStep.result,
    stepCount: steps.length,
    replayedStates,
    error: null,
  }
}

export {
  fastExponentiation as default,
  replayFastExpoTrace as replay,
  fastPow as binaryExponentiation,
}

