/**
 * R62-T049 Rotate Matrix 90° — Standalone Verification & Complexity Experiment Script
 *
 * Verifies:
 *   1. Required 2x2 rotation: [[1, 2], [3, 4]] -> [[3, 1], [4, 2]]
 *   2. Four-rotation recovery invariant: R^4(M) === M
 *   3. Larger square matrices: 3x3 and 4x4
 *   4. Input preservation: input matrix is not mutated
 *   5. Deterministic complexity experiment for 3 bounded sizes (2x2, 3x3, 4x4)
 *   6. Invalid input handling: rejection of non-square, non-array, null
 *   7. Replay visualizer step frames
 *
 * Usage: node work/R62-T049/verify.js
 * Exit Code: 0 on success, non-zero on assertion error.
 */

import assert from 'node:assert/strict'
import vm from 'node:vm'
import {
  rotateMatrix90,
  rotateMatrix90WithMetrics,
  generateMatrixRotationSteps,
  getMatrixRotationSource,
  resolveMatrixRotationLine,
  validateSquareMatrix,
} from '../../src/algorithms/course/rotate-matrix-90.js'

console.log('=== R62-T049 Rotate Matrix 90° Clockwise: Verification & Complexity Experiment ===\n')

// ── 1. Basic Clockwise Rotation ──────────────────────────────────────────────
console.log('1. Verifying Required 2x2 Rotation Example...')
{
  const input = [
    [1, 2],
    [3, 4],
  ]
  const expected = [
    [3, 1],
    [4, 2],
  ]
  const actual = rotateMatrix90(input)
  assert.deepStrictEqual(actual, expected, '2x2 rotation must match expected output')
  console.log('  PASS: [[1, 2], [3, 4]] -> [[3, 1], [4, 2]]')
}

// ── 2. Four-Rotation Recovery Invariant ───────────────────────────────────────
console.log('\n2. Verifying Four-Rotation Recovery Invariant (R^4(M) = M)...')
{
  const original = [
    [1, 2],
    [3, 4],
  ]

  let current = original
  for (let i = 1; i <= 4; i++) {
    current = rotateMatrix90(current)
  }

  assert.deepStrictEqual(
    current,
    original,
    'Four consecutive rotations must recover the original matrix exactly'
  )
  console.log('  PASS: 4x 90° rotations on 2x2 recovered original matrix identically.')

  const orig3x3 = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ]
  let cur3 = orig3x3
  for (let i = 1; i <= 4; i++) {
    cur3 = rotateMatrix90(cur3)
  }
  assert.deepStrictEqual(cur3, orig3x3, 'Four rotations on 3x3 must recover original matrix')
  console.log('  PASS: 4x 90° rotations on 3x3 recovered original matrix identically.')
}

// ── 3. Larger Matrices & Edge Cases ──────────────────────────────────────────
console.log('\n3. Verifying Larger Matrices (3x3, 4x4) and Edge Cases...')
{
  const input3 = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ]
  const expected3 = [
    [7, 4, 1],
    [8, 5, 2],
    [9, 6, 3],
  ]
  assert.deepStrictEqual(rotateMatrix90(input3), expected3)
  console.log('  PASS: 3x3 rotation verified.')

  const input4 = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
  ]
  const expected4 = [
    [13, 9, 5, 1],
    [14, 10, 6, 2],
    [15, 11, 7, 3],
    [16, 12, 8, 4],
  ]
  assert.deepStrictEqual(rotateMatrix90(input4), expected4)
  console.log('  PASS: 4x4 rotation verified.')

  assert.deepStrictEqual(rotateMatrix90([]), [])
  assert.deepStrictEqual(rotateMatrix90([[99]]), [[99]])
  console.log('  PASS: Edge cases (0x0 and 1x1) verified.')
}

// ── 4. Input Preservation ────────────────────────────────────────────────────
console.log('\n4. Verifying Input Preservation (Non-mutating pure function)...')
{
  const input = [
    [1, 2],
    [3, 4],
  ]
  const snapshot = JSON.stringify(input)
  const output = rotateMatrix90(input)

  assert.strictEqual(
    JSON.stringify(input),
    snapshot,
    'Original input matrix must not be mutated'
  )
  assert.notStrictEqual(output, input, 'Output matrix must be a new instance')
  assert.notStrictEqual(output[0], input[0], 'Output row must be a new array')
  console.log('  PASS: Input array is strictly preserved.')
}

// ── 5. Complexity Experiment ─────────────────────────────────────────────────
console.log('\n5. Conducting Deterministic Complexity Experiment...')
{
  const sizes = [
    {
      label: '2x2',
      n: 2,
      matrix: [
        [1, 2],
        [3, 4],
      ],
    },
    {
      label: '3x3',
      n: 3,
      matrix: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
    },
    {
      label: '4x4',
      n: 4,
      matrix: [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16],
      ],
    },
  ]

  console.log('  ------------------------------------------------------------------------------------------')
  console.log('  | Size | Dimension N | Total Cells (N^2) | Element Placements | Coord Calcs | Total Ops  |')
  console.log('  ------------------------------------------------------------------------------------------')

  for (const s of sizes) {
    const res = rotateMatrix90WithMetrics(s.matrix)
    const m = res.metrics
    assert.strictEqual(m.dimension, s.n)
    assert.strictEqual(m.totalElements, s.n * s.n)
    assert.strictEqual(m.elementPlacements, s.n * s.n)
    assert.strictEqual(m.coordinateCalculations, s.n * s.n)
    assert.strictEqual(m.totalOperations, 2 * s.n * s.n)

    console.log(
      `  | ${s.label.padEnd(4)} | N = ${s.n}       | ${String(m.totalElements).padStart(17)} | ${String(m.elementPlacements).padStart(18)} | ${String(m.coordinateCalculations).padStart(11)} | ${String(m.totalOperations).padStart(10)} |`
    )
  }
  console.log('  ------------------------------------------------------------------------------------------')
  console.log('  Observed Growth: Element placements scale exactly as N^2 (quadratic with respect to N).')
  console.log('  PASS: Complexity experiment results deterministic and verified.')
}

// ── 6. Invalid Input Behavior ────────────────────────────────────────────────
console.log('\n6. Verifying Invalid Input Rejection...')
{
  assert.throws(() => rotateMatrix90(null), TypeError)
  assert.throws(() => rotateMatrix90(undefined), TypeError)
  assert.throws(() => rotateMatrix90('not an array'), TypeError)
  assert.throws(() => rotateMatrix90([[1, 2], 'invalid row']), TypeError)
  assert.throws(
    () =>
      rotateMatrix90([
        [1, 2, 3],
        [4, 5, 6],
      ]),
    /square/
  )
  assert.throws(
    () =>
      rotateMatrix90([
        [1, 2, 3],
        [4, 5],
        [6, 7, 8],
      ]),
    /square/
  )
  assert.throws(() => validateSquareMatrix(null), TypeError)
  assert.throws(() => validateSquareMatrix([[1, 2], [3]]), /square/)
  console.log('  PASS: Null, non-array, jagged, and non-square matrices rejected cleanly.')
}

// ── 7. Source Code Sandbox Execution ─────────────────────────────────────────
console.log('\n7. Verifying Source Strings in Isolated Node VM...')
{
  const src = getMatrixRotationSource('javascript')
  const logs = []
  const sandbox = {
    console: { log: (...args) => logs.push(args[0]) },
    Array,
  }
  const context = vm.createContext(sandbox)
  const script = new vm.Script(src.code)
  script.runInContext(context)

  assert.deepStrictEqual([...logs[0]], [
    [3, 1],
    [4, 2],
  ])
  assert.strictEqual(resolveMatrixRotationLine('javascript', 'place'), 6)
  assert.strictEqual(resolveMatrixRotationLine('javascript', 'complete'), 9)
  console.log('  PASS: Displayed source code runs in sandbox and matches expected fixture.')
}

// ── 8. Replay Step Generator ─────────────────────────────────────────────────
console.log('\n8. Verifying Replay Step Frame Generator...')
{
  const steps = generateMatrixRotationSteps([
    [1, 2],
    [3, 4],
  ])
  assert.strictEqual(steps[0].type, 'start')
  assert.strictEqual(steps[1].type, 'alloc')
  assert.strictEqual(steps.filter((s) => s.type === 'place').length, 4)
  assert.strictEqual(steps[steps.length - 1].type, 'complete')
  console.log(`  PASS: ${steps.length} structured replay step frames generated.`)
}

console.log('\nALL VERIFICATIONS PASSED (Exit Code 0).\n')
