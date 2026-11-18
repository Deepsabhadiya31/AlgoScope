import { describe, it, expect } from 'vitest'
import vm from 'node:vm'
import {
  longestCommonSubsequence,
  lcs,
  mutantLongestCommonSubsequence,
  isSubsequence,
  validateLCSInputs,
  getLCSSource,
  resolveLCSLine,
  generateLCSSteps,
} from './longest-common-subsequence'

/**
 * Asserts that a given LCS result is mathematically valid for two input strings:
 * 1. Result must have the expected length.
 * 2. Subsequence string must have length equal to expected length.
 * 3. Subsequence must be an order-preserving subsequence of first.
 * 4. Subsequence must be an order-preserving subsequence of second.
 *
 * @param {string} first - First input string.
 * @param {string} second - Second input string.
 * @param {number} expectedLength - Expected maximum common subsequence length.
 * @param {Function} [algorithmFn=longestCommonSubsequence] - Algorithm implementation under test.
 */
function assertValidLCS(first, second, expectedLength, algorithmFn = longestCommonSubsequence) {
  const result = algorithmFn(first, second)

  if (typeof result !== 'object' || result === null) {
    throw new Error('LCS result must be an object')
  }

  if (result.length !== expectedLength) {
    throw new Error(
      `LCS length mismatch: expected ${expectedLength}, got ${result.length}`
    )
  }

  if (result.subsequence.length !== expectedLength) {
    throw new Error(
      `Subsequence length mismatch: expected ${expectedLength}, got ${result.subsequence.length} ("${result.subsequence}")`
    )
  }

  if (!isSubsequence(result.subsequence, first)) {
    throw new Error(
      `"${result.subsequence}" is not a valid subsequence of first string "${first}"`
    )
  }

  if (!isSubsequence(result.subsequence, second)) {
    throw new Error(
      `"${result.subsequence}" is not a valid subsequence of second string "${second}"`
    )
  }

  return true
}

/**
 * Executes a JavaScript source code snippet in an isolated Node VM sandbox,
 * capturing console.log output.
 *
 * @param {string} sourceCode
 * @param {number} [timeoutMs=2000]
 * @returns {Array<any>}
 */
function executeSourceInVm(sourceCode, timeoutMs = 2000) {
  const logs = []
  const sandbox = {
    console: {
      log: (...args) => logs.push(args),
      error: () => {},
      warn: () => {},
    },
    Array,
    Math,
  }
  const context = vm.createContext(sandbox)
  const script = new vm.Script(sourceCode)
  script.runInContext(context, { timeout: timeoutMs })
  return logs
}

describe('R62-T050: Longest Common Subsequence — Mutation-Resistant Regression', () => {
  // ── Test A — Required LCS Example ──────────────────────────────────────────
  describe('Test A — Required LCS example ("ABCBDAB" & "BDCABA")', () => {
    it('produces an LCS of length 4 that is a valid subsequence of both inputs', () => {
      const first = 'ABCBDAB'
      const second = 'BDCABA'

      const result = longestCommonSubsequence(first, second)

      // 1. Reported LCS length is exactly 4
      expect(result.length).toBe(4)

      // 2. Returned subsequence has length 4
      expect(result.subsequence.length).toBe(4)

      // 3. Returned subsequence is an order-preserving subsequence of first
      expect(isSubsequence(result.subsequence, first)).toBe(true)

      // 4. Returned subsequence is an order-preserving subsequence of second
      expect(isSubsequence(result.subsequence, second)).toBe(true)

      // Strict validation through helper
      expect(assertValidLCS(first, second, 4)).toBe(true)
    })
  })

  // ── Test B — Different Valid Tied Results ───────────────────────────────────
  describe('Test B — Different valid tied results', () => {
    it('recognizes multiple mathematically valid 4-character tied subsequences', () => {
      const first = 'ABCBDAB'
      const second = 'BDCABA'

      // Valid known length-4 common subsequences for these strings:
      const validTies = ['BCBA', 'BDAB', 'BCAB']

      for (const candidate of validTies) {
        expect(candidate.length).toBe(4)
        expect(isSubsequence(candidate, first)).toBe(true)
        expect(isSubsequence(candidate, second)).toBe(true)
      }

      // Default DP traceback yields one valid tie (e.g. "BDAB" or "BCBA")
      const result = longestCommonSubsequence(first, second)
      expect(validTies).toContain(result.subsequence)

      // Alternative tie-breaking option still produces a valid length-4 subsequence
      const altResult = longestCommonSubsequence(first, second, { preferHorizontalTie: true })
      expect(altResult.length).toBe(4)
      expect(isSubsequence(altResult.subsequence, first)).toBe(true)
      expect(isSubsequence(altResult.subsequence, second)).toBe(true)
    })
  })

  // ── Test C — Empty-String Behavior ─────────────────────────────────────────
  describe('Test C — Empty-string behavior', () => {
    it('returns length 0 and empty string when first input is empty', () => {
      const result = longestCommonSubsequence('', 'ABC')
      expect(result.length).toBe(0)
      expect(result.subsequence).toBe('')
    })

    it('returns length 0 and empty string when second input is empty', () => {
      const result = longestCommonSubsequence('XYZ', '')
      expect(result.length).toBe(0)
      expect(result.subsequence).toBe('')
    })

    it('returns length 0 when both inputs are empty', () => {
      const result = longestCommonSubsequence('', '')
      expect(result.length).toBe(0)
      expect(result.subsequence).toBe('')
    })
  })

  // ── Test D — No Common Characters ──────────────────────────────────────────
  describe('Test D — No common characters', () => {
    it('returns length 0 and empty subsequence when strings share no characters', () => {
      const result = longestCommonSubsequence('ABC', 'DEF')
      expect(result.length).toBe(0)
      expect(result.subsequence).toBe('')
    })
  })

  // ── Test E — Identical Strings ─────────────────────────────────────────────
  describe('Test E — Identical strings', () => {
    it('returns the entire string when inputs are identical', () => {
      const input = 'ALGORITHM'
      const result = longestCommonSubsequence(input, input)
      expect(result.length).toBe(input.length)
      expect(result.subsequence).toBe(input)
    })
  })

  // ── Test F — Determinism ───────────────────────────────────────────────────
  describe('Test F — Determinism', () => {
    it('repeated executions produce identical results and DP tables', () => {
      const first = 'ABCBDAB'
      const second = 'BDCABA'

      const r1 = longestCommonSubsequence(first, second)
      const r2 = longestCommonSubsequence(first, second)
      const r3 = lcs(first, second)

      expect(r1.length).toBe(r2.length)
      expect(r1.subsequence).toBe(r2.subsequence)
      expect(r1.dpTable).toEqual(r2.dpTable)
      expect(r1).toEqual(r3)
    })
  })

  // ── Test G — Mutation Rejection (Decisive Condition Bug) ───────────────────
  describe('Test G — Mutation rejection (Decisive Condition Bug)', () => {
    it('rejects the one-condition mutant in the decisive operation (=== inverted to !==)', () => {
      const first = 'ABCBDAB'
      const second = 'BDCABA'

      // Correct implementation passes regression
      expect(() => assertValidLCS(first, second, 4, longestCommonSubsequence)).not.toThrow()

      // The mutant implementation has the decisive character match inverted:
      // if (first[i - 1] !== second[j - 1]) instead of ===
      const mutantResult = mutantLongestCommonSubsequence(first, second)

      // The mutant corrupts either the length or the subsequence validity
      const mutantPassed =
        mutantResult.length === 4 &&
        mutantResult.subsequence.length === 4 &&
        isSubsequence(mutantResult.subsequence, first) &&
        isSubsequence(mutantResult.subsequence, second)

      expect(mutantPassed).toBe(false)

      // Confirm our regression assertion function catches and throws on the mutant
      expect(() => {
        assertValidLCS(first, second, 4, mutantLongestCommonSubsequence)
      }).toThrow()
    })

    it('verifies that the correct implementation remains passing and unmutated', () => {
      // Re-verify after mutant test: original production implementation is intact
      const first = 'ABCBDAB'
      const second = 'BDCABA'
      const result = longestCommonSubsequence(first, second)

      expect(result.length).toBe(4)
      expect(result.subsequence.length).toBe(4)
      expect(isSubsequence(result.subsequence, first)).toBe(true)
      expect(isSubsequence(result.subsequence, second)).toBe(true)
    })
  })

  // ── Test H — Input Validation ──────────────────────────────────────────────
  describe('Test H — Input validation', () => {
    it('throws TypeError for null, undefined, or non-string inputs', () => {
      expect(() => longestCommonSubsequence(null, 'ABC')).toThrow(TypeError)
      expect(() => longestCommonSubsequence('ABC', undefined)).toThrow(TypeError)
      expect(() => longestCommonSubsequence(123, 'ABC')).toThrow(TypeError)
      expect(() => longestCommonSubsequence('ABC', ['A', 'B'])).toThrow(TypeError)
      expect(() => longestCommonSubsequence({}, {})).toThrow(TypeError)
    })

    it('validateLCSInputs helper enforces string types', () => {
      expect(() => validateLCSInputs('a', 'b')).not.toThrow()
      expect(() => validateLCSInputs(null, 'b')).toThrow(TypeError)
    })

    it('generateLCSSteps returns an error frame on invalid input', () => {
      const steps = generateLCSSteps(null, 'ABC')
      expect(steps.length).toBe(1)
      expect(steps[0].type).toBe('error')
      expect(steps[0].variables.error).toBe(true)
    })
  })

  // ── Source Strings & Line Mapping ──────────────────────────────────────────
  describe('Source strings & isolated Node VM execution', () => {
    it('evaluates displayed source code in isolated Node VM and matches output', () => {
      const src = getLCSSource('javascript')
      expect(src).toBeDefined()
      expect(typeof src.code).toBe('string')
      expect(src.code).toContain('longestCommonSubsequence')

      const logs = executeSourceInVm(src.code)
      expect(logs.length).toBe(1)
      expect(logs[0][0]).toBe(4) // length
      expect(typeof logs[0][1]).toBe('string') // subsequence
      expect(logs[0][1].length).toBe(4)
    })

    it('maps all semantic lineKeys accurately', () => {
      const expectedKeys = [
        'function',
        'setup',
        'dpInit',
        'outerLoop',
        'innerLoop',
        'compare',
        'matchBranch',
        'mismatchBranch',
        'tracebackInit',
        'tracebackLoop',
        'tracebackMatch',
        'tracebackMove',
        'returnResult',
        'complete',
      ]

      for (const key of expectedKeys) {
        const line = resolveLCSLine('javascript', key)
        expect(line).toBeGreaterThanOrEqual(1)
      }

      expect(resolveLCSLine('javascript', 'unknownKey')).toBeUndefined()
      expect(resolveLCSLine('javascript', null)).toBeUndefined()
    })
  })

  // ── Replay Step Generator ──────────────────────────────────────────────────
  describe('Replay step generator integrity', () => {
    it('generates structured visualizer steps from start to complete', () => {
      const steps = generateLCSSteps('ABC', 'AC')
      expect(steps[0].type).toBe('start')
      expect(steps[1].type).toBe('dpInit')
      expect(steps[steps.length - 1].type).toBe('complete')

      const lastStep = steps[steps.length - 1]
      expect(lastStep.variables.length).toBe(2)
      expect(lastStep.variables.subsequence).toBe('AC')
    })
  })
})
