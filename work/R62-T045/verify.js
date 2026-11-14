import assert from 'node:assert/strict'
import {
  fastPow,
  fastExponentiation,
  getExpoComplexity,
  replayFastExpoTrace,
  createPRNG,
} from '../../src/algorithms/course/fast-exponentiation.js'

console.log('--- R62-T045 Fast Exponentiation: Deterministic Execution Verification ---')

// 1. Primary mathematical requirements: 2^10 = 1024, exponent 0 returns 1, exponent 1 returns base
console.log('1. Verifying Primary Mathematical Requirements (2^10 = 1024, exp=0, exp=1)...')
const p10 = fastPow(2, 10)
assert.strictEqual(p10, 1024, '2^10 must equal 1024')

const trace10 = fastExponentiation(2, 10)
assert.strictEqual(trace10.result, 1024, 'fastExponentiation(2, 10).result must equal 1024')
assert.strictEqual(trace10.isDeterministic, true, 'Execution must be marked deterministic')

assert.strictEqual(fastPow(2, 0), 1, '2^0 must equal 1')
assert.strictEqual(fastPow(10, 0), 1, '10^0 must equal 1')
assert.strictEqual(fastPow(0, 0), 1, '0^0 must equal 1')
assert.strictEqual(fastPow(-5, 0), 1, '-5^0 must equal 1')

assert.strictEqual(fastPow(2, 1), 2, '2^1 must equal 2')
assert.strictEqual(fastPow(99, 1), 99, '99^1 must equal 99')
assert.strictEqual(fastPow(-7, 1), -7, '-7^1 must equal -7')
console.log('  PASS: Mathematical baseline requirements verified.')

// 2. Deterministic execution and trace repeatability
console.log('2. Verifying Deterministic Execution and Trace Repeatability...')
const runA = fastExponentiation(2, 10)
const runB = fastExponentiation(2, 10)
assert.strictEqual(runA.result, runB.result, 'Results across runs must be identical')
assert.strictEqual(runA.steps.length, runB.steps.length, 'Step count across runs must be identical')
assert.strictEqual(JSON.stringify(runA.steps), JSON.stringify(runB.steps), 'Full step traces must be byte-for-byte identical')

// PRNG seed determinism
const prngA = createPRNG(987654321)
const prngB = createPRNG(987654321)
for (let i = 0; i < 20; i++) {
  assert.strictEqual(prngA(), prngB(), `PRNG output mismatch at index ${i}`)
}
console.log('  PASS: Determinism and repeatability verified.')

// 3. Step count complexity (grows with exponent bit length, O(log2 exp))
console.log('3. Verifying Logarithmic Step Count Complexity...')
const c10 = getExpoComplexity(10)
assert.strictEqual(c10.bitLength, 4, '10 has bit length 4 (1010 in binary)')
assert.strictEqual(c10.multiplications, 2, '10 has two 1-bits (multiplications = 2)')
assert.strictEqual(c10.squarings, 3, '10 requires 3 squarings')
assert.strictEqual(c10.totalOperations, 5, '10 requires 5 total operations vs 10 naive')

const c1024 = getExpoComplexity(1024)
assert.strictEqual(c1024.bitLength, 11, '1024 has bit length 11 (2^10)')
assert.strictEqual(c1024.totalOperations, 11, '1024 requires 11 total operations vs 1024 naive multiplications')
assert(c1024.totalOperations < c1024.naiveMultiplications, 'Step count must grow logarithmically, strictly less than naive')
console.log('  PASS: Logarithmic complexity verified.')

// 4. Trace replay verification
console.log('4. Verifying Trace Replay Integrity...')
const replayResult = replayFastExpoTrace(runA.steps)
assert.strictEqual(replayResult.valid, true, `Trace replay failed: ${replayResult.error}`)
assert.strictEqual(replayResult.finalResult, 1024, 'Replayed final result must be 1024')
assert.strictEqual(replayResult.stepCount, runA.steps.length, 'Replayed step count must match trace')

// Edge case replay
const replayZero = replayFastExpoTrace(fastExponentiation(3, 0).steps)
assert.strictEqual(replayZero.valid, true)
assert.strictEqual(replayZero.finalResult, 1)
console.log('  PASS: Trace replay verified successfully.')

// 5. Input validation & sensitivity
console.log('5. Verifying Input Validation and Replay Sensitivity...')
assert.throws(() => fastPow(2, -1), RangeError, 'Negative exponent must throw RangeError')
assert.throws(() => fastPow(2, 3.5), TypeError, 'Non-integer exponent must throw TypeError')
assert.throws(() => fastPow(NaN, 3), TypeError, 'NaN base must throw TypeError')

// Replay sensitivity: corrupted trace
const corruptedTrace = runA.steps.map(s => (s.type === 'multiply' ? { ...s, result: 9999 } : s))
const corruptedReplay = replayFastExpoTrace(corruptedTrace)
assert.strictEqual(corruptedReplay.valid, false, 'Replay validator must reject corrupted intermediate multiplication')
console.log('  PASS: Input validation and negative sensitivity verified.')

console.log('ALL VERIFICATIONS PASSED (Exit Code 0).')

