import assert from 'node:assert/strict'
import vm from 'node:vm'
import {
  selectionSort,
  generateSelectionSortSteps,
  selectionSortSources,
  resolveSelectionSortLine,
} from '../../src/algorithms/sorting/selectionSortSteps.js'

console.log('--- R62-T047 Selection Sort Steps: Executable Documentation Verification ---')

// 1. Mandatory Fixtures
console.log('1. Verifying Mandatory Fixtures...')

// Fixture 1: Unsorted [3, 1, 2] -> [1, 2, 3]
const f1 = selectionSort([3, 1, 2])
assert.deepStrictEqual(f1, [1, 2, 3], 'Fixture 1 [3, 1, 2] must sort to [1, 2, 3]')
const steps1 = generateSelectionSortSteps([3, 1, 2])
assert.deepStrictEqual(steps1[steps1.length - 1].array, [1, 2, 3])
assert.strictEqual(steps1.filter((s) => s.type === 'swap').length, 2)
console.log('  PASS: Fixture 1 [3, 1, 2] -> [1, 2, 3] verified.')

// Fixture 2: Duplicates [2, 2, 1] -> [1, 2, 2]
const f2 = selectionSort([2, 2, 1])
assert.deepStrictEqual(f2, [1, 2, 2], 'Fixture 2 [2, 2, 1] must sort to [1, 2, 2]')
const steps2 = generateSelectionSortSteps([2, 2, 1])
assert.deepStrictEqual(steps2[steps2.length - 1].array, [1, 2, 2])
console.log('  PASS: Fixture 2 [2, 2, 1] -> [1, 2, 2] verified.')

// Fixture 3: Already sorted [1, 2, 3] -> [1, 2, 3] (0 swaps)
const f3 = selectionSort([1, 2, 3])
assert.deepStrictEqual(f3, [1, 2, 3], 'Fixture 3 [1, 2, 3] must remain [1, 2, 3]')
const steps3 = generateSelectionSortSteps([1, 2, 3])
assert.deepStrictEqual(steps3[steps3.length - 1].array, [1, 2, 3])
assert.strictEqual(steps3.filter((s) => s.type === 'swap').length, 0, 'Already sorted array must perform 0 swaps')
console.log('  PASS: Fixture 3 [1, 2, 3] -> [1, 2, 3] (0 swaps) verified.')

// Fixture 4: Reversed [3, 2, 1] -> [1, 2, 3]
const f4 = selectionSort([3, 2, 1])
assert.deepStrictEqual(f4, [1, 2, 3], 'Fixture 4 [3, 2, 1] must sort to [1, 2, 3]')
const steps4 = generateSelectionSortSteps([3, 2, 1])
assert.deepStrictEqual(steps4[steps4.length - 1].array, [1, 2, 3])
assert.strictEqual(steps4.filter((s) => s.type === 'swap').length, 1)
console.log('  PASS: Fixture 4 [3, 2, 1] -> [1, 2, 3] verified.')

// Fixture 5: Smallest supported collections
assert.deepStrictEqual(selectionSort([]), [])
assert.deepStrictEqual(selectionSort([42]), [42])
const emptySteps = generateSelectionSortSteps([])
assert.strictEqual(emptySteps.length, 2)
assert.deepStrictEqual(emptySteps[1].array, [])
console.log('  PASS: Fixture 5 smallest collections [] and [42] verified.')

// 2. Executable Documentation & VM Execution
console.log('2. Verifying Executable Documentation in Node VM...')
const jsCode = selectionSortSources.javascript.code
const logs = []
const sandbox = {
  console: {
    log: (...args) => {
      logs.push(args.length === 1 ? args[0] : args)
    },
    error: () => {},
    warn: () => {},
  },
}
const context = vm.createContext(sandbox)
const script = new vm.Script(jsCode)
script.runInContext(context)

assert.strictEqual(logs.length, 1)
assert.deepStrictEqual([...logs[0]], [1, 2, 3], 'VM execution of concrete fixture must log [1, 2, 3]')
assert.strictEqual(typeof context.selectionSort, 'function')
assert.deepStrictEqual([...context.selectionSort([3, 1, 2])], [1, 2, 3])
console.log('  PASS: Source string VM execution verified.')

// 3. Line-Map Alignment
console.log('3. Verifying Source-Line Mapping Alignment...')
const lines = jsCode.split('\n')
const checkLine = (key, expectedSubstring) => {
  const lineNo = resolveSelectionSortLine('javascript', key)
  assert(lineNo >= 1 && lineNo <= lines.length, `Line number for ${key} out of bounds: ${lineNo}`)
  const text = lines[lineNo - 1]
  assert(text.includes(expectedSubstring), `Line ${lineNo} for "${key}" should contain "${expectedSubstring}", got "${text}"`)
}

checkLine('function', 'function selectionSort')
checkLine('setup', 'const n = arr.length')
checkLine('outerLoop', 'for (let i = 0; i < n - 1; i++)')
checkLine('initMin', 'let minIdx = i')
checkLine('innerLoop', 'for (let j = i + 1; j < n; j++)')
checkLine('compare', 'if (arr[j] < arr[minIdx])')
checkLine('updateMin', 'minIdx = j')
checkLine('swap', '[arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]')
checkLine('complete', 'return arr')
console.log('  PASS: All line mappings accurately align with displayed source.')

console.log('ALL VERIFICATIONS PASSED (Exit Code 0).')
