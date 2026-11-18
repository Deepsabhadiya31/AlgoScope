/**
 * Longest Common Subsequence (LCS) — Focused Pure Algorithm Module
 *
 * Implements a pure, deterministic Dynamic Programming algorithm for finding the
 * Longest Common Subsequence (LCS) and its length between two sequences.
 *
 * Problem Statement:
 *   Given two strings first and second, find the length and a valid subsequence
 *   common to both strings that has maximum length.
 *
 * Recurrence Relation:
 *   For 1 <= i <= m and 1 <= j <= n:
 *     - If first[i - 1] === second[j - 1]:
 *         dp[i][j] = dp[i - 1][j - 1] + 1
 *     - Else:
 *         dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
 *
 * Concrete Fixture:
 *   first:  "ABCBDAB"
 *   second: "BDCABA"
 *   LCS length: 4 (Valid subsequences include "BCBA", "BDAB", "BCAB")
 *
 * Task ID  : R62-T050
 * Issue    : https://github.com/S-AI-Projects/AlgoScope/issues/50
 *
 * @module longest-common-subsequence
 */

import { createStep } from '../../lib/utils.js'

// ── Validation & Subsequence Helpers ─────────────────────────────────────────

/**
 * Validates that both arguments are strings.
 *
 * @param {any} first
 * @param {any} second
 * @throws {TypeError} If either argument is not a string.
 */
export function validateLCSInputs(first, second) {
  if (typeof first !== 'string' || typeof second !== 'string') {
    throw new TypeError(
      `Both inputs must be strings, received (${typeof first}, ${typeof second})`
    )
  }
}

/**
 * Checks whether candidate is a valid subsequence of mainString.
 * A subsequence preserves character ordering but does not require consecutive characters.
 *
 * @param {string} candidate - Potential subsequence.
 * @param {string} mainString - Source string.
 * @returns {boolean} True if candidate is a valid subsequence of mainString.
 */
export function isSubsequence(candidate, mainString) {
  if (typeof candidate !== 'string' || typeof mainString !== 'string') {
    return false
  }
  let i = 0
  let j = 0
  while (i < candidate.length && j < mainString.length) {
    if (candidate[i] === mainString[j]) {
      i++
    }
    j++
  }
  return i === candidate.length
}

// ── Pure LCS Algorithm ───────────────────────────────────────────────────────

/**
 * Computes the Longest Common Subsequence of two strings using dynamic programming.
 *
 * Pure function: does not mutate inputs, has no side effects, and returns a result
 * object with both the length and a valid subsequence string.
 *
 * @param {string} first - First input string.
 * @param {string} second - Second input string.
 * @param {Object} [options={}] - Optional configuration.
 * @param {boolean} [options.preferHorizontalTie=false] - Optional tie-breaking flag for traceback.
 * @param {boolean} [options._mutantInvertMatch=false] - For mutation testing only: inverts decisive condition.
 * @returns {{ length: number, subsequence: string, dpTable: number[][] }}
 * @throws {TypeError} If either argument is not a string.
 */
export function longestCommonSubsequence(first, second, options = {}) {
  validateLCSInputs(first, second)

  const m = first.length
  const n = second.length

  if (m === 0 || n === 0) {
    return {
      length: 0,
      subsequence: '',
      dpTable: Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0)),
    }
  }

  // 1. Build DP table
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      // Decisive condition: character match check
      const isMatch = options._mutantInvertMatch
        ? first[i - 1] !== second[j - 1] // Deliberate mutant condition
        : first[i - 1] === second[j - 1] // Correct decisive condition

      if (isMatch) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // 2. Traceback to reconstruct the subsequence
  let i = m
  let j = n
  const chars = []

  while (i > 0 && j > 0) {
    const isMatch = options._mutantInvertMatch
      ? first[i - 1] !== second[j - 1]
      : first[i - 1] === second[j - 1]

    if (isMatch) {
      chars.push(first[i - 1])
      i--
      j--
    } else if (
      options.preferHorizontalTie
        ? dp[i - 1][j] > dp[i][j - 1]
        : dp[i - 1][j] >= dp[i][j - 1]
    ) {
      i--
    } else {
      j--
    }
  }

  const subsequence = chars.reverse().join('')

  return {
    length: dp[m][n],
    subsequence,
    dpTable: dp,
  }
}

/**
 * Shorthand alias for longestCommonSubsequence.
 */
export const lcs = longestCommonSubsequence

/**
 * Mutant LCS implementation with the decisive character-match condition deliberately inverted:
 *   if (first[i - 1] !== second[j - 1]) instead of (first[i - 1] === second[j - 1])
 *
 * Used exclusively for mutation-resistant regression assertions.
 *
 * @param {string} first
 * @param {string} second
 * @returns {{ length: number, subsequence: string, dpTable: number[][] }}
 */
export function mutantLongestCommonSubsequence(first, second) {
  return longestCommonSubsequence(first, second, { _mutantInvertMatch: true })
}

// ── Source Strings & Line Mapping ────────────────────────────────────────────

export const lcsSources = {
  javascript: {
    code: `function longestCommonSubsequence(first, second) {
  const m = first.length;
  const n = second.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (first[i - 1] === second[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = m, j = n;
  const chars = [];
  while (i > 0 && j > 0) {
    if (first[i - 1] === second[j - 1]) {
      chars.push(first[i - 1]);
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return { length: dp[m][n], subsequence: chars.reverse().join('') };
}

// Concrete fixture:
// first: "ABCBDAB", second: "BDCABA" -> length 4
const result = longestCommonSubsequence("ABCBDAB", "BDCABA");
console.log(result.length, result.subsequence);`,
    lineMap: {
      function: 1,
      setup: 2,
      dpInit: 4,
      outerLoop: 6,
      innerLoop: 7,
      compare: 8,
      matchBranch: 9,
      mismatchBranch: 11,
      tracebackInit: 16,
      tracebackLoop: 18,
      tracebackMatch: 19,
      tracebackMove: 22,
      returnResult: 28,
      complete: 28,
    },
  },
}

/**
 * Retrieves displayed source code string for LCS.
 *
 * @param {string} [language='javascript']
 * @returns {{ code: string, lineMap: Object }}
 */
export function getLCSSource(language = 'javascript') {
  return lcsSources[language] ?? lcsSources.javascript
}

/**
 * Resolves a semantic action key to its source line number.
 *
 * @param {string} [language='javascript']
 * @param {string} lineKey
 * @returns {number | undefined}
 */
export function resolveLCSLine(language = 'javascript', lineKey) {
  if (!lineKey) return undefined
  const src = lcsSources[language] ?? lcsSources.javascript
  if (!src) return undefined
  return src.lineMap[lineKey]
}

// ── Replay Step Generator ────────────────────────────────────────────────────

/**
 * Generates visualizer replay step frames for the LCS algorithm.
 *
 * @param {string} first - First string.
 * @param {string} second - Second string.
 * @returns {Array<Object>} Sequence of visualizer step frames.
 */
export function generateLCSSteps(first, second) {
  const steps = []

  try {
    validateLCSInputs(first, second)
  } catch (err) {
    steps.push(
      createStep({
        lineKey: 'function',
        type: 'error',
        array: [],
        message: `Validation Error: ${err.message}`,
        variables: { error: true, message: err.message },
      })
    )
    return steps
  }

  const m = first.length
  const n = second.length

  // Start step
  steps.push(
    createStep({
      lineKey: 'function',
      type: 'start',
      array: [],
      message: `Starting LCS for "${first}" (len ${m}) and "${second}" (len ${n})`,
      variables: { m, n, phase: 'init' },
    })
  )

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))

  // DP table initialization step
  steps.push(
    createStep({
      lineKey: 'dpInit',
      type: 'dpInit',
      array: dp.flat(),
      message: `Initialized ${m + 1}x${n + 1} DP table with zeros`,
      variables: { phase: 'table_init' },
      table: dp.map((row) => [...row]),
    })
  )

  // Table filling
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const match = first[i - 1] === second[j - 1]
      if (match) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }

      steps.push(
        createStep({
          lineKey: match ? 'matchBranch' : 'mismatchBranch',
          type: match ? 'match' : 'mismatch',
          array: dp.flat(),
          indices: [i * (n + 1) + j],
          message: match
            ? `Match: first[${i - 1}] === second[${j - 1}] ('${first[i - 1]}') -> dp[${i}][${j}] = ${dp[i][j]}`
            : `Mismatch: first[${i - 1}] ('${first[i - 1]}') !== second[${j - 1}] ('${second[j - 1]}') -> dp[${i}][${j}] = ${dp[i][j]}`,
          variables: {
            i,
            j,
            char1: first[i - 1],
            char2: second[j - 1],
            match,
            val: dp[i][j],
          },
          table: dp.map((row) => [...row]),
        })
      )
    }
  }

  // Traceback
  let i = m
  let j = n
  const chars = []
  const path = []

  while (i > 0 && j > 0) {
    if (first[i - 1] === second[j - 1]) {
      chars.push(first[i - 1])
      path.push([i, j])
      steps.push(
        createStep({
          lineKey: 'tracebackMatch',
          type: 'traceback_match',
          array: dp.flat(),
          indices: [i * (n + 1) + j],
          message: `Traceback matched '${first[i - 1]}' at [${i}, ${j}]`,
          variables: { i, j, char: first[i - 1], path: [...path] },
          table: dp.map((row) => [...row]),
        })
      )
      i--
      j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  const subsequence = chars.reverse().join('')
  const lcsLength = dp[m][n]

  // Complete step
  steps.push(
    createStep({
      lineKey: 'complete',
      type: 'complete',
      array: dp.flat(),
      message: `LCS Complete: length = ${lcsLength}, subsequence = "${subsequence}"`,
      variables: { length: lcsLength, subsequence, completed: true },
      table: dp.map((row) => [...row]),
    })
  )

  return steps
}
