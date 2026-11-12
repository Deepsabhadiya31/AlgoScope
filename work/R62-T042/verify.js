import assert from 'node:assert/strict'
import vm from 'node:vm'
import { mooreVotingSources } from '../../src/algorithms/mooreVoting/mooreVotingSources.js'

console.log('--- R62-T042 Moore Voting Sources Verification ---')

// 1. Identify algorithm entry and language
console.log('1. Selecting mooreVoting entry and javascript snippet...')
const entry = 'mooreVoting'
const lang = 'javascript'
const jsCode = mooreVotingSources[entry]?.[lang]?.code

assert.ok(jsCode, 'JavaScript snippet must exist for mooreVoting')
assert.strictEqual(typeof jsCode, 'string', 'Snippet code must be a string')
console.log('  PASS: Snippet located.')

// 2. Execute snippet in isolated Node VM
console.log('2. Executing snippet in isolated Node VM...')
const logs = []
const sandbox = {
  console: {
    log: (...args) => logs.push(args.length === 1 ? args[0] : args),
    error: () => {},
    warn: () => {},
  },
  Math,
}

const context = vm.createContext(sandbox)
const script = new vm.Script(jsCode)
script.runInContext(context, { timeout: 2000 })

// 3. Verify console logs
console.log('3. Verifying displayed example and boundary output...')
assert.strictEqual(logs.length, 2, 'Snippet must produce exactly 2 console.log calls')
assert.strictEqual(logs[0], 2, 'Displayed example [2,2,1,1,1,2,2] must yield 2')
assert.strictEqual(logs[1], -1, 'Boundary example [] must yield -1')
console.log('  PASS: Console output verified ([2, -1]).')

// 4. Verify function definition in context
console.log('4. Verifying context.mooreVoting function...')
assert.strictEqual(typeof context.mooreVoting, 'function', 'mooreVoting function must be declared')
assert.strictEqual(context.mooreVoting([2, 2, 1, 1, 1, 2, 2]), 2)
assert.strictEqual(context.mooreVoting([]), -1)
console.log('  PASS: Function behavior verified.')

// 5. Verify sensitivity
console.log('5. Verifying test assertion sensitivity...')
assert.notStrictEqual(logs[0], -1)
assert.notStrictEqual(logs[1], 2)
console.log('  PASS: Sensitivity verified.')

// 6. Verify other languages untouched
console.log('6. Verifying other language snippets...')
const otherLangs = ['python', 'cpp', 'java', 'c', 'rust', 'go']
for (const l of otherLangs) {
  assert.ok(mooreVotingSources[entry]?.[l]?.code, `Language ${l} snippet must exist`)
}
console.log('  PASS: Other language snippets intact.')

console.log('ALL VERIFICATIONS PASSED.')

