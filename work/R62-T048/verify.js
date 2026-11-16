/**
 * R62-T048 Comb Sort — Standalone Verification Script
 *
 * Verifies: sorting correctness, gap behaviour, failure-path,
 * recovery after failure, determinism.
 *
 * Usage: node work/R62-T048/verify.js
 * Exit 0 = all checks pass, Exit 1 = failure.
 */

import assert from 'node:assert/strict'
import {
  combSort,
  generateCombSortSteps,
} from '../../src/algorithms/course/comb-sort.js'

console.log('--- R62-T048 Comb Sort: Failure-Path Coverage Verification ---')

// 1. Sorting correctness
console.log('1. Verifying sorting correctness...')
{
  const r = combSort([3, 1, 2, 2])
  assert.ok(r.success, 'Expected success=true')
  assert.deepStrictEqual(r.sorted, [1, 2, 2, 3])
  console.log('  PASS: [3, 1, 2, 2] -> [1, 2, 2, 3]')

  const r2 = combSort([4, 3, 2, 1])
  assert.deepStrictEqual(r2.sorted, [1, 2, 3, 4])
  console.log('  PASS: [4, 3, 2, 1] -> [1, 2, 3, 4]')

  const r3 = combSort([])
  assert.deepStrictEqual(r3.sorted, [])
  console.log('  PASS: [] -> []')

  const r4 = combSort([42])
  assert.deepStrictEqual(r4.sorted, [42])
  console.log('  PASS: [42] -> [42]')
}

// 2. Non-mutation
console.log('2. Verifying non-mutation...')
{
  const input = [3, 1, 2, 2]
  const copy = [...input]
  combSort(input)
  assert.deepStrictEqual(input, copy)
  console.log('  PASS: Original input not mutated.')
}

// 3. Gap behaviour
console.log('3. Verifying gap behaviour...')
{
  const r = combSort([3, 1, 2, 2])
  assert.strictEqual(r.gapProgression[0], 4, 'Initial gap should be array length')
  for (const g of r.gapProgression) {
    assert.ok(g >= 1, `Gap ${g} must be >= 1`)
  }
  assert.strictEqual(r.gapProgression[r.gapProgression.length - 1], 1, 'Final gap must be 1')
  console.log(`  PASS: Gap progression: [${r.gapProgression}]`)
}

// 4. Failure-path
console.log('4. Verifying failure-path...')
{
  const fNull = combSort(null)
  assert.ok(!fNull.success)
  assert.strictEqual(fNull.sorted, null)
  console.log('  PASS: null input -> failure')

  const fUndef = combSort(undefined)
  assert.ok(!fUndef.success)
  console.log('  PASS: undefined input -> failure')

  const fStr = combSort('not an array')
  assert.ok(!fStr.success)
  console.log('  PASS: string input -> failure')

  const fMixed = combSort([1, 'two', 3])
  assert.ok(!fMixed.success)
  console.log('  PASS: mixed-type array -> failure')
}

// 5. Recovery after failure
console.log('5. Verifying recovery after failure...')
{
  const fail1 = combSort(null)
  assert.ok(!fail1.success)

  const ok1 = combSort([3, 1, 2, 2])
  assert.ok(ok1.success)
  assert.deepStrictEqual(ok1.sorted, [1, 2, 2, 3])
  console.log('  PASS: Valid execution succeeds immediately after failure.')

  // Alternating pattern
  assert.ok(!combSort(undefined).success)
  assert.deepStrictEqual(combSort([2, 1]).sorted, [1, 2])
  assert.ok(!combSort('bad').success)
  assert.deepStrictEqual(combSort([4, 3, 2, 1]).sorted, [1, 2, 3, 4])
  console.log('  PASS: Alternating failure/success works correctly.')
}

// 6. Determinism
console.log('6. Verifying determinism...')
{
  const r1 = combSort([3, 1, 2, 2])
  const r2 = combSort([3, 1, 2, 2])
  assert.deepStrictEqual(r1.sorted, r2.sorted)
  assert.deepStrictEqual(r1.gapProgression, r2.gapProgression)
  assert.strictEqual(r1.totalComparisons, r2.totalComparisons)
  assert.strictEqual(r1.totalSwaps, r2.totalSwaps)
  console.log('  PASS: Identical inputs produce identical results.')
}

// 7. Replay steps
console.log('7. Verifying replay steps...')
{
  const steps = generateCombSortSteps([3, 1, 2, 2])
  assert.strictEqual(steps[0].type, 'start')
  assert.strictEqual(steps[steps.length - 1].type, 'complete')
  assert.deepStrictEqual(steps[steps.length - 1].array, [1, 2, 2, 3])
  console.log(`  PASS: ${steps.length} replay steps generated, start->complete.`)

  const errorSteps = generateCombSortSteps(null)
  assert.strictEqual(errorSteps[0].type, 'error')
  console.log('  PASS: Invalid input generates error step.')
}

console.log('ALL VERIFICATIONS PASSED (Exit Code 0).')
