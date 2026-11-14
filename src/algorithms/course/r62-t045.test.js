import { describe, it, expect } from 'vitest'
import {
  fastPow,
  fastExponentiation,
  getExpoComplexity,
  replayFastExpoTrace,
  createPRNG,
  validateInputs,
} from './fast-exponentiation'

describe('R62-T045: Fast Exponentiation — Deterministic Execution & Trace Replay', () => {
  describe('1. Mathematical Correctness (Issue Done When Criteria)', () => {
    it('calculates 2^10 = 1024 correctly via fastPow and fastExponentiation', () => {
      expect(fastPow(2, 10)).toBe(1024)
      const res = fastExponentiation(2, 10)
      expect(res.result).toBe(1024)
      expect(res.isDeterministic).toBe(true)
    })

    it('returns 1 for exponent 0 across all valid bases under the stated domain', () => {
      expect(fastPow(2, 0)).toBe(1)
      expect(fastPow(10, 0)).toBe(1)
      expect(fastPow(1, 0)).toBe(1)
      expect(fastPow(0, 0)).toBe(1) // Standard discrete math and JS Math.pow convention
      expect(fastPow(-5, 0)).toBe(1)
      expect(fastPow(999999, 0)).toBe(1)

      const traceZero = fastExponentiation(2, 0)
      expect(traceZero.result).toBe(1)
    })

    it('returns the base for exponent 1', () => {
      expect(fastPow(2, 1)).toBe(2)
      expect(fastPow(7, 1)).toBe(7)
      expect(fastPow(-3, 1)).toBe(-3)
      expect(fastPow(0, 1)).toBe(0)
    })

    it('correctly computes even exponents', () => {
      expect(fastPow(3, 2)).toBe(9)
      expect(fastPow(3, 4)).toBe(81)
      expect(fastPow(2, 8)).toBe(256)
      expect(fastPow(2, 16)).toBe(65536)
      expect(fastPow(-2, 4)).toBe(16)
    })

    it('correctly computes odd exponents', () => {
      expect(fastPow(2, 3)).toBe(8)
      expect(fastPow(2, 5)).toBe(32)
      expect(fastPow(3, 3)).toBe(27)
      expect(fastPow(5, 3)).toBe(125)
      expect(fastPow(-2, 3)).toBe(-8)
      expect(fastPow(-3, 5)).toBe(-243)
    })

    it('handles base 0 and base 1 correctly', () => {
      expect(fastPow(0, 5)).toBe(0)
      expect(fastPow(0, 100)).toBe(0)
      expect(fastPow(1, 50)).toBe(1)
      expect(fastPow(1, 1000)).toBe(1)
    })

    it('matches JavaScript native Math.pow and ** operator across deterministic test vectors', () => {
      const testCases = [
        [2, 0],
        [2, 1],
        [2, 2],
        [2, 10],
        [2, 20],
        [3, 0],
        [3, 5],
        [3, 7],
        [4, 6],
        [5, 4],
        [7, 3],
        [10, 5],
        [1.5, 3],
        [0.5, 4],
      ]

      for (const [b, e] of testCases) {
        const expected = Math.pow(b, e)
        const actual = fastPow(b, e)
        expect(actual).toBeCloseTo(expected, 10)
      }
    })
  })

  describe('2. Deterministic Execution & Trace Replay', () => {
    it('produces identical results and step traces on repeated identical invocations', () => {
      const run1 = fastExponentiation(2, 10)
      const run2 = fastExponentiation(2, 10)
      const run3 = fastExponentiation(2, 10)

      expect(run1.result).toBe(run2.result)
      expect(run2.result).toBe(run3.result)

      // Step count, step types, variables, messages must be strictly equal
      expect(run1.steps.length).toBe(run2.steps.length)
      expect(JSON.stringify(run1.steps)).toBe(JSON.stringify(run2.steps))
      expect(JSON.stringify(run2.steps)).toBe(JSON.stringify(run3.steps))
    })

    it('replays a recorded trace deterministically and confirms intermediate calculations', () => {
      const { steps } = fastExponentiation(2, 10)
      const replayResult = replayFastExpoTrace(steps)

      expect(replayResult.valid).toBe(true)
      expect(replayResult.finalResult).toBe(1024)
      expect(replayResult.stepCount).toBe(steps.length)
      expect(replayResult.error).toBeNull()
      expect(replayResult.replayedStates.length).toBeGreaterThan(0)
    })

    it('replays edge case traces (exp = 0, exp = 1) cleanly', () => {
      const trace0 = fastExponentiation(5, 0).steps
      const replay0 = replayFastExpoTrace(trace0)
      expect(replay0.valid).toBe(true)
      expect(replay0.finalResult).toBe(1)

      const trace1 = fastExponentiation(5, 1).steps
      const replay1 = replayFastExpoTrace(trace1)
      expect(replay1.valid).toBe(true)
      expect(replay1.finalResult).toBe(5)
    })

    it('freezes step objects so they are immutable and protected against retrospective mutation', () => {
      const { steps } = fastExponentiation(2, 10)
      for (const step of steps) {
        expect(Object.isFrozen(step)).toBe(true)
        expect(Object.isFrozen(step.variables)).toBe(true)
        expect(() => {
          step.result = 99999
        }).toThrow(TypeError)
      }
    })

    it('allows deterministic seeded random execution using createPRNG', () => {
      const prng1 = createPRNG(42)
      const prng2 = createPRNG(42)

      const seq1 = Array.from({ length: 10 }, () => prng1())
      const seq2 = Array.from({ length: 10 }, () => prng2())

      expect(seq1).toEqual(seq2)
    })
  })

  describe('3. Step Count Complexity (Grows with Bit Length, O(log2 exp))', () => {
    it('verifies step count grows logarithmically with exponent bit length rather than linearly', () => {
      // Exponent 10: binary 1010, bit length 4
      const exp10Trace = fastExponentiation(2, 10)
      const bitSteps10 = exp10Trace.steps.filter(s => s.type === 'checkBit')
      expect(bitSteps10.length).toBe(4) // 4 bits in binary 1010
      expect(bitSteps10.length).toBeLessThan(10) // strictly less than naive 10 operations

      // Exponent 32: 2^5, binary 100000, bit length 6
      const exp32Trace = fastExponentiation(2, 32)
      const bitSteps32 = exp32Trace.steps.filter(s => s.type === 'checkBit')
      expect(bitSteps32.length).toBe(6) // 6 bits in binary 100000
      expect(bitSteps32.length).toBeLessThan(32) // log2(32) + 1 = 6 vs 32 naive

      // Exponent 1024: 2^10, binary 10000000000, bit length 11
      const complexity1024 = getExpoComplexity(1024)
      expect(complexity1024.bitLength).toBe(11)
      expect(complexity1024.totalOperations).toBe(11) // 1 multiplication + 10 squarings
      expect(complexity1024.naiveMultiplications).toBe(1024)
    })

    it('getExpoComplexity accurately analyzes bit length and operation counts', () => {
      const c0 = getExpoComplexity(0)
      expect(c0.bitLength).toBe(0)
      expect(c0.totalOperations).toBe(0)

      const c10 = getExpoComplexity(10)
      expect(c10.binaryString).toBe('1010')
      expect(c10.bitLength).toBe(4)
      expect(c10.multiplications).toBe(2) // two 1-bits
      expect(c10.squarings).toBe(3) // 3 squarings (4 bits - 1)
      expect(c10.totalOperations).toBe(5)
      expect(c10.naiveMultiplications).toBe(10)
    })

    it('rejects invalid inputs to getExpoComplexity', () => {
      expect(() => getExpoComplexity(-5)).toThrow(TypeError)
      expect(() => getExpoComplexity('10')).toThrow(TypeError)
      expect(() => getExpoComplexity(2.5)).toThrow(TypeError)
    })
  })

  describe('4. Animation Timing & Isolated Control', () => {
    it('sets step duration explicitly from options without real-time delay interference', () => {
      const traceDefault = fastExponentiation(2, 10)
      expect(traceDefault.steps[0].duration).toBe(0)

      const traceCustom = fastExponentiation(2, 10, { stepDuration: 750 })
      expect(traceCustom.steps[0].duration).toBe(750)
      expect(traceCustom.steps[1].duration).toBe(750)

      // Test executes synchronously and immediately
      expect(traceCustom.result).toBe(1024)
    })
  })

  describe('5. Input Validation & Error Handling', () => {
    it('rejects negative exponents with RangeError', () => {
      expect(() => fastPow(2, -1)).toThrow(RangeError)
      expect(() => fastPow(2, -10)).toThrow(RangeError)
      expect(() => fastExponentiation(2, -5)).toThrow(RangeError)
    })

    it('rejects non-integer exponents with TypeError', () => {
      expect(() => fastPow(2, 2.5)).toThrow(TypeError)
      expect(() => fastPow(2, 0.1)).toThrow(TypeError)
      expect(() => fastExponentiation(2, 1.5)).toThrow(TypeError)
    })

    it('rejects non-number exponents with TypeError', () => {
      expect(() => fastPow(2, '10')).toThrow(TypeError)
      expect(() => fastPow(2, null)).toThrow(TypeError)
      expect(() => fastPow(2, undefined)).toThrow(TypeError)
    })

    it('rejects NaN or non-finite bases with TypeError', () => {
      expect(() => fastPow(NaN, 2)).toThrow(TypeError)
      expect(() => fastPow(Infinity, 2)).toThrow(TypeError)
      expect(() => fastPow(-Infinity, 2)).toThrow(TypeError)
      expect(() => fastPow('2', 2)).toThrow(TypeError)
    })

    it('validateInputs throws appropriately', () => {
      expect(() => validateInputs(NaN, 2)).toThrow(TypeError)
      expect(() => validateInputs(2, -3)).toThrow(RangeError)
      expect(() => validateInputs(2, 1.2)).toThrow(TypeError)
    })
  })

  describe('6. Invariant & Trace Sensitivity Checks (Negative Testing)', () => {
    it('replayFastExpoTrace rejects empty or non-array traces', () => {
      expect(replayFastExpoTrace(null).valid).toBe(false)
      expect(replayFastExpoTrace([]).valid).toBe(false)
      expect(replayFastExpoTrace('bad').valid).toBe(false)
    })

    it('replayFastExpoTrace detects corrupted initial step', () => {
      const badTrace = [{ type: 'not-start', base: 2, exp: 10, stepIndex: 0 }]
      const res = replayFastExpoTrace(badTrace)
      expect(res.valid).toBe(false)
      expect(res.error).toContain('First step must have type "start"')
    })

    it('replayFastExpoTrace detects broken step index sequence', () => {
      const { steps } = fastExponentiation(2, 10)
      const corrupted = steps.map((s, idx) => ({ ...s, stepIndex: idx === 2 ? 99 : s.stepIndex }))
      const res = replayFastExpoTrace(corrupted)
      expect(res.valid).toBe(false)
      expect(res.error).toContain('Step index sequence broken')
    })

    it('replayFastExpoTrace detects corrupted multiplication result', () => {
      const { steps } = fastExponentiation(2, 10)
      // Corrupt the multiply step result
      const corrupted = steps.map(s => {
        if (s.type === 'multiply') {
          return { ...s, result: 9999 } // incorrect
        }
        return s
      })
      const res = replayFastExpoTrace(corrupted)
      expect(res.valid).toBe(false)
      expect(res.error).toContain('Result mismatch after multiplication')
    })

    it('replayFastExpoTrace detects corrupted squaring state', () => {
      const { steps } = fastExponentiation(2, 10)
      // Corrupt a square step base
      const corrupted = steps.map(s => {
        if (s.type === 'square') {
          return { ...s, base: 777 } // incorrect
        }
        return s
      })
      const res = replayFastExpoTrace(corrupted)
      expect(res.valid).toBe(false)
      expect(res.error).toContain('State mismatch after squaring')
    })

    it('replayFastExpoTrace detects corrupted final result', () => {
      const { steps } = fastExponentiation(2, 10)
      const corrupted = steps.map((s, idx) => {
        if (idx === steps.length - 1) {
          return { ...s, result: 1023 } // 1023 instead of 1024
        }
        return s
      })
      const res = replayFastExpoTrace(corrupted)
      expect(res.valid).toBe(false)
      expect(res.error).toContain('Final result mismatch')
    })
  })
})

