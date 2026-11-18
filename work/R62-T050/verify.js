/**
 * R62-T050 Longest Common Subsequence — Standalone Verification & Mutation Experiment Script
 *
 * Verifies:
 *   1. Required LCS Example: "ABCBDAB" & "BDCABA" -> length 4, valid in both strings.
 *   2. Subsequence order preservation: isSubsequence check on multiple valid ties.
 *   3. Empty string behavior: returns length 0 and empty subsequence.
 *   4. No common characters: returns length 0 and empty subsequence.
 *   5. Identical strings: returns full string.
 *   6. Determinism: identical inputs yield identical outputs.
 *   7. Decisive Condition Mutation Experiment:
 *      - Correct implementation (first[i - 1] === second[j - 1]): PASS
 *      - Deliberate mutant (first[i - 1] !== second[j - 1]): FAILS regression assertion
 *      - Correct implementation restored: PASS
 *   8. Input validation: rejects non-string inputs.
 *   9. Replay visualizer step frames generator.
 *  10. Isolated Node VM source snippet evaluation.
 *
 * Usage: node work/R62-T050/verify.js
 * Exit Code: 0 on success, non-zero on assertion error.
 */

import assert from 'node:assert/strict'
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
} from '../../src/algorithms/course/longest-common-subsequence.js'

console.log('=== R62-T050 Longest Common Subsequence: Verification & Mutation Experiment ===\n')

// ── Assertion Helper ─────────────────────────────────────────────────────────
function assertValidLCS(first, second, expectedLength, algorithmFn = longestCommonSubsequence) {
  const result = algorithmFn(first, second)

  assert.ok(result !== null && typeof result === 'object', 'LCS result must be an object')
  assert.strictEqual(
    result.length,
    expectedLength,
    `LCS length mismatch: expected ${expectedLength}, got ${result.length}`
  )
  assert.strictEqual(
    result.subsequence.length,
    expectedLength,
    `Subsequence length mismatch: expected ${expectedLength}, got ${result.subsequence.length}`
  )
  assert.ok(
    isSubsequence(result.subsequence, first),
    `"${result.subsequence}" is not a valid subsequence of first string "${first}"`
  )
  assert.ok(
    isSubsequence(result.subsequence, second),
    `"${result.subsequence}" is not a valid subsequence of second string "${second}"`
  )
  return true
}

// ── 1. Required LCS Example ──────────────────────────────────────────────────
console.log('1. Verifying Required LCS Example ("ABCBDAB" & "BDCABA")...')
{
  const first = 'ABCBDAB'
  const second = 'BDCABA'
  const result = longestCommonSubsequence(first, second)

  assert.strictEqual(result.length, 4, 'Reported LCS length must be 4')
  assert.strictEqual(result.subsequence.length, 4, 'Subsequence length must be 4')
  assert.ok(isSubsequence(result.subsequence, first), 'Must be subsequence of first')
  assert.ok(isSubsequence(result.subsequence, second), 'Must be subsequence of second')
  console.log(`  PASS: Length = ${result.length}, Subsequence = "${result.subsequence}"`)
}

// ── 2. Different Valid Tied Results ──────────────────────────────────────────
console.log('\n2. Verifying Multiple Valid Tied Subsequences...')
{
  const first = 'ABCBDAB'
  const second = 'BDCABA'
  const validTies = ['BCBA', 'BDAB', 'BCAB']

  for (const tie of validTies) {
    assert.strictEqual(tie.length, 4)
    assert.ok(isSubsequence(tie, first), `"${tie}" must be a subsequence of "${first}"`)
    assert.ok(isSubsequence(tie, second), `"${tie}" must be a subsequence of "${second}"`)
  }
  console.log('  PASS: All valid ties ("BCBA", "BDAB", "BCAB") verified mathematically.')
}

// ── 3. Edge Cases: Empty Strings ─────────────────────────────────────────────
console.log('\n3. Verifying Empty String Behavior...')
{
  const r1 = longestCommonSubsequence('', 'ABC')
  assert.strictEqual(r1.length, 0)
  assert.strictEqual(r1.subsequence, '')

  const r2 = longestCommonSubsequence('XYZ', '')
  assert.strictEqual(r2.length, 0)
  assert.strictEqual(r2.subsequence, '')

  const r3 = longestCommonSubsequence('', '')
  assert.strictEqual(r3.length, 0)
  assert.strictEqual(r3.subsequence, '')
  console.log('  PASS: Empty string edge cases handled correctly.')
}

// ── 4. No Common Characters & Identical Strings ───────────────────────────────
console.log('\n4. Verifying Disjoint & Identical Strings...')
{
  const rDisjoint = longestCommonSubsequence('ABC', 'DEF')
  assert.strictEqual(rDisjoint.length, 0)
  assert.strictEqual(rDisjoint.subsequence, '')
  console.log('  PASS: Disjoint strings return length 0.')

  const rIdentical = longestCommonSubsequence('ALGORITHM', 'ALGORITHM')
  assert.strictEqual(rIdentical.length, 9)
  assert.strictEqual(rIdentical.subsequence, 'ALGORITHM')
  console.log('  PASS: Identical strings return full string.')
}

// ── 5. Determinism ───────────────────────────────────────────────────────────
console.log('\n5. Verifying Determinism Across Repeated Invocations...')
{
  const first = 'ABCBDAB'
  const second = 'BDCABA'
  const r1 = longestCommonSubsequence(first, second)
  const r2 = longestCommonSubsequence(first, second)
  const r3 = lcs(first, second)

  assert.deepStrictEqual(r1, r2)
  assert.deepStrictEqual(r1, r3)
  console.log('  PASS: Identical outputs and DP tables on repeated execution.')
}

// ── 6. Decisive Operation Mutation Experiment ────────────────────────────────
console.log('\n6. Conducting Decisive Operation Mutation Experiment...')
{
  const first = 'ABCBDAB'
  const second = 'BDCABA'

  // Step 6a: Correct Implementation
  console.log('  [Stage 1] Testing Correct Implementation (first[i - 1] === second[j - 1])...')
  assert.doesNotThrow(() => {
    assertValidLCS(first, second, 4, longestCommonSubsequence)
  })
  const correctResult = longestCommonSubsequence(first, second)
  console.log(
    `  PASS: Correct implementation produces valid LCS: "${correctResult.subsequence}" (len ${correctResult.length})`
  )

  // Step 6b: Mutant Implementation (first[i - 1] !== second[j - 1])
  console.log(
    '  [Stage 2] Testing One-Condition Mutant (equality inverted: first[i - 1] !== second[j - 1])...'
  )
  const mutantResult = mutantLongestCommonSubsequence(first, second)
  console.log(
    `  Mutant output: length = ${mutantResult.length}, subsequence = "${mutantResult.subsequence}"`
  )

  // Assert that the regression FAILS against the mutant
  assert.throws(
    () => {
      assertValidLCS(first, second, 4, mutantLongestCommonSubsequence)
    },
    /LCS length mismatch|not a valid subsequence/,
    'Regression assertion MUST fail against the mutant!'
  )
  console.log('  PASS: Regression test successfully REJECTED the mutant!')

  // Step 6c: Restore & Verify
  console.log('  [Stage 3] Verifying Correct Implementation Remains Intact...')
  assert.doesNotThrow(() => {
    assertValidLCS(first, second, 4, longestCommonSubsequence)
  })
  console.log('  PASS: Production implementation verified intact.')
}

// ── 7. Input Validation ──────────────────────────────────────────────────────
console.log('\n7. Verifying Input Validation...')
{
  assert.throws(() => longestCommonSubsequence(null, 'ABC'), TypeError)
  assert.throws(() => longestCommonSubsequence('ABC', undefined), TypeError)
  assert.throws(() => longestCommonSubsequence(42, 'ABC'), TypeError)
  assert.throws(() => validateLCSInputs(null, 'test'), TypeError)
  console.log('  PASS: Invalid non-string inputs rejected with TypeError.')
}

// ── 8. Source Code VM Execution & Line Mapping ────────────────────────────────
console.log('\n8. Verifying Source Code in Isolated Node VM...')
{
  const src = getLCSSource('javascript')
  const logs = []
  const sandbox = {
    console: { log: (...args) => logs.push(args) },
    Array,
    Math,
  }
  const context = vm.createContext(sandbox)
  const script = new vm.Script(src.code)
  script.runInContext(context)

  assert.strictEqual(logs.length, 1)
  assert.strictEqual(logs[0][0], 4) // length
  assert.strictEqual(logs[0][1].length, 4) // subsequence length
  assert.ok(isSubsequence(logs[0][1], 'ABCBDAB'))
  assert.ok(isSubsequence(logs[0][1], 'BDCABA'))

  assert.strictEqual(resolveLCSLine('javascript', 'compare'), 8)
  assert.strictEqual(resolveLCSLine('javascript', 'complete'), 28)
  console.log('  PASS: Source snippet runs in VM sandbox and matches expected LCS output.')
}

// ── 9. Visualizer Replay Steps Generator ─────────────────────────────────────
console.log('\n9. Verifying Visualizer Step Frames Generator...')
{
  const steps = generateLCSSteps('ABC', 'AC')
  assert.strictEqual(steps[0].type, 'start')
  assert.strictEqual(steps[1].type, 'dpInit')
  assert.strictEqual(steps[steps.length - 1].type, 'complete')
  console.log(`  PASS: ${steps.length} structured replay step frames generated.`)
}

console.log('\nALL VERIFICATIONS PASSED (Exit Code 0).\n')
