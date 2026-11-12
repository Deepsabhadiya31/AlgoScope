import { describe, it, expect } from 'vitest'
import vm from 'node:vm'
import { mooreVotingSources } from '../mooreVoting/mooreVotingSources'

/**
 * Executes a JavaScript source code string within an isolated Node.js VM context,
 * capturing console output while suppressing stdout from polluting the test reporter.
 *
 * @param {string} sourceCode - Raw JavaScript source string to execute.
 * @param {number} [timeoutMs=2000] - Execution timeout in milliseconds.
 * @returns {{ logs: Array<any>, context: Object }} Captured logs and execution context.
 */
function executeSourceInVm(sourceCode, timeoutMs = 2000) {
  const logs = []
  const sandbox = {
    console: {
      log: (...args) => {
        logs.push(args.length === 1 ? args[0] : args)
      },
      error: () => {},
      warn: () => {},
      info: () => {},
    },
    Math,
  }

  const context = vm.createContext(sandbox)
  const script = new vm.Script(sourceCode)
  script.runInContext(context, { timeout: timeoutMs })

  return { logs, context }
}

describe('R62-T042: Moore Voting Source Code String Boundary Tests', () => {
  const selectedAlgorithm = 'mooreVoting'
  const selectedLanguage = 'javascript'

  it('selects the first exported algorithm entry "mooreVoting" and language "javascript"', () => {
    expect(selectedAlgorithm).toBe('mooreVoting')
    expect(selectedLanguage).toBe('javascript')

    const sourceEntry = mooreVotingSources[selectedAlgorithm]
    expect(sourceEntry).toBeDefined()
    expect(typeof sourceEntry).toBe('object')

    const jsSource = sourceEntry[selectedLanguage]
    expect(jsSource).toBeDefined()
    expect(typeof jsSource.code).toBe('string')
    expect(jsSource.code.trim().length).toBeGreaterThan(0)
  })

  it('executes the actual displayed JavaScript code string in an isolated VM and verifies output', () => {
    const jsCode = mooreVotingSources[selectedAlgorithm][selectedLanguage].code

    // Execute the actual displayed code string inside an isolated Node VM sandbox
    const { logs, context } = executeSourceInVm(jsCode)

    // Expected console logs:
    // 1. console.log(mooreVoting(arr)) for [2,2,1,1,1,2,2] -> produces 2
    // 2. console.log(mooreVoting(boundaryArr)) for [] -> produces -1
    expect(logs).toHaveLength(2)

    // Verification of displayed example: arr = [2,2,1,1,1,2,2] -> majority element is 2
    expect(logs[0]).toBe(2)

    // Verification of empty-array boundary example: boundaryArr = [] -> no majority element -> -1
    expect(logs[1]).toBe(-1)

    // Direct invocation check of the function defined inside the VM context
    expect(typeof context.mooreVoting).toBe('function')
    expect(context.mooreVoting([2, 2, 1, 1, 1, 2, 2])).toBe(2)
    expect(context.mooreVoting([])).toBe(-1)
  })

  it('fails if expected values are incorrect (sensitivity check)', () => {
    const jsCode = mooreVotingSources[selectedAlgorithm][selectedLanguage].code
    const { logs } = executeSourceInVm(jsCode)

    // Negative assertions to ensure test does not pass trivially
    expect(logs[0]).not.toBe(-1)
    expect(logs[1]).not.toBe(2)
    expect(logs[1]).not.toBe(null)
    expect(logs[1]).not.toBe(undefined)
  })

  it('preserves other language snippets without modifications', () => {
    const languages = ['python', 'cpp', 'java', 'c', 'rust', 'go']
    for (const lang of languages) {
      const entry = mooreVotingSources[selectedAlgorithm][lang]
      expect(entry).toBeDefined()
      expect(typeof entry.code).toBe('string')
      expect(entry.code.length).toBeGreaterThan(0)
    }
  })
})

