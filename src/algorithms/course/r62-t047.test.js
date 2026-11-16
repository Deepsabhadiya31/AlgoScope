import { describe, it, expect } from 'vitest'
import vm from 'node:vm'
import {
  selectionSort,
  generateSelectionSortSteps,
  selectionSortSources,
  getSelectionSortSource,
  resolveSelectionSortLine,
} from '../sorting/selectionSortSteps'

/**
 * Executes a JavaScript source code string within an isolated Node.js VM context,
 * capturing console output for assertions.
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

describe('R62-T047: Selection Sort Steps — Executable Documentation', () => {
  describe('1. Mandatory Concrete Fixtures (Pure Implementation & Step Generator)', () => {
    it('Test Case 1 – Unsorted Array: [3, 1, 2] produces [1, 2, 3]', () => {
      const input = [3, 1, 2]

      // Pure function verification
      const sorted = selectionSort(input)
      expect(sorted).toEqual([1, 2, 3])

      // Step generator verification
      const steps = generateSelectionSortSteps(input)
      expect(steps.length).toBeGreaterThan(0)

      // Final step must match expected sorted output
      const finalStep = steps[steps.length - 1]
      expect(finalStep.type).toBe('complete')
      expect(finalStep.array).toEqual([1, 2, 3])
      expect(finalStep.sortedIndices).toEqual([0, 1, 2])

      // Verify comparisons occurred
      const compareSteps = steps.filter((s) => s.type === 'compare')
      expect(compareSteps.length).toBeGreaterThan(0)

      // Verify minimum-finding was recorded
      const minSteps = steps.filter((s) => s.type === 'min')
      expect(minSteps.length).toBeGreaterThan(0)

      // Verify swap occurred
      const swapSteps = steps.filter((s) => s.type === 'swap')
      expect(swapSteps.length).toBe(2) // 3 swapped with 1, then 3 swapped with 2
      expect(swapSteps[0].indices).toEqual([0, 1])
      expect(swapSteps[1].indices).toEqual([1, 2])
    })

    it('Test Case 2 – Duplicate Elements: [2, 2, 1] produces [1, 2, 2]', () => {
      const input = [2, 2, 1]

      const sorted = selectionSort(input)
      expect(sorted).toEqual([1, 2, 2])

      const steps = generateSelectionSortSteps(input)
      const finalStep = steps[steps.length - 1]
      expect(finalStep.array).toEqual([1, 2, 2])
      expect(finalStep.sortedIndices).toEqual([0, 1, 2])

      // Ensure multiplicities are preserved
      expect(finalStep.array.filter((x) => x === 2).length).toBe(2)
      expect(finalStep.array.filter((x) => x === 1).length).toBe(1)
    })

    it('Test Case 3 – Already Sorted Array: [1, 2, 3] produces [1, 2, 3] with 0 swaps', () => {
      const input = [1, 2, 3]

      const sorted = selectionSort(input)
      expect(sorted).toEqual([1, 2, 3])

      const steps = generateSelectionSortSteps(input)
      const finalStep = steps[steps.length - 1]
      expect(finalStep.array).toEqual([1, 2, 3])

      // Crucial requirement: algorithm must not perform unnecessary swaps
      const swapSteps = steps.filter((s) => s.type === 'swap')
      expect(swapSteps.length).toBe(0)
    })

    it('Test Case 4 – Reversed Array: [3, 2, 1] produces [1, 2, 3]', () => {
      const input = [3, 2, 1]

      const sorted = selectionSort(input)
      expect(sorted).toEqual([1, 2, 3])

      const steps = generateSelectionSortSteps(input)
      const finalStep = steps[steps.length - 1]
      expect(finalStep.array).toEqual([1, 2, 3])

      // Swaps should place minimum elements into their correct positions
      const swapSteps = steps.filter((s) => s.type === 'swap')
      expect(swapSteps.length).toBe(1) // 3 swapped with 1 -> [1, 2, 3], 2 is already at index 1
      expect(swapSteps[0].indices).toEqual([0, 2])
    })

    it('Test Case 5 – Smallest Supported Collections: empty array [] and single-element [42]', () => {
      // Empty collection []
      expect(selectionSort([])).toEqual([])
      const emptySteps = generateSelectionSortSteps([])
      expect(emptySteps.length).toBe(2) // start and complete
      expect(emptySteps[0].type).toBe('start')
      expect(emptySteps[1].type).toBe('complete')
      expect(emptySteps[1].array).toEqual([])

      // Single-element collection [42]
      expect(selectionSort([42])).toEqual([42])
      const singleSteps = generateSelectionSortSteps([42])
      expect(singleSteps.length).toBeGreaterThan(0)
      const finalSingle = singleSteps[singleSteps.length - 1]
      expect(finalSingle.array).toEqual([42])
      expect(finalSingle.sortedIndices).toEqual([0])
      expect(singleSteps.filter((s) => s.type === 'swap').length).toBe(0)
    })
  })

  describe('2. Executable Documentation & Isolated VM Execution', () => {
    it('executes the displayed JavaScript code string in an isolated VM and matches concrete fixture output', () => {
      const jsSource = selectionSortSources.javascript.code
      expect(typeof jsSource).toBe('string')
      expect(jsSource.length).toBeGreaterThan(0)

      // Run code in isolated VM
      const { logs, context } = executeSourceInVm(jsSource)

      // Verify that console.log(arr) was executed and emitted [1, 2, 3]
      expect(logs).toHaveLength(1)
      expect(logs[0]).toEqual([1, 2, 3])

      // Verify function defined in VM context works for all fixtures
      expect(typeof context.selectionSort).toBe('function')
      expect(context.selectionSort([3, 1, 2])).toEqual([1, 2, 3])
      expect(context.selectionSort([2, 2, 1])).toEqual([1, 2, 2])
      expect(context.selectionSort([1, 2, 3])).toEqual([1, 2, 3])
      expect(context.selectionSort([3, 2, 1])).toEqual([1, 2, 3])
      expect(context.selectionSort([])).toEqual([])
      expect(context.selectionSort([99])).toEqual([99])
    })

    it('contains the concrete fixture documentation comment within the displayed JavaScript snippet', () => {
      const jsSource = selectionSortSources.javascript.code
      expect(jsSource).toContain('const arr = [3, 1, 2]')
      expect(jsSource).toContain('selectionSort(arr)')
      expect(jsSource).toContain('[1, 2, 3]')
    })
  })

  describe('3. Source-Line Mapping Accuracy', () => {
    it('accurately maps each semantic step key to the corresponding displayed source line', () => {
      const jsSource = selectionSortSources.javascript.code
      const lines = jsSource.split('\n')
      const totalLines = lines.length

      const expectedKeys = [
        'function',
        'setup',
        'outerLoop',
        'initMin',
        'innerLoop',
        'compare',
        'updateMin',
        'swap',
        'complete',
      ]

      for (const key of expectedKeys) {
        const lineNum = resolveSelectionSortLine('javascript', key)
        expect(typeof lineNum).toBe('number')
        // Line number must be strictly within source line boundaries (1-indexed)
        expect(lineNum).toBeGreaterThanOrEqual(1)
        expect(lineNum).toBeLessThanOrEqual(totalLines)

        const lineText = lines[lineNum - 1]
        expect(lineText).toBeDefined()
      }

      // Verify exact line associations
      expect(lines[resolveSelectionSortLine('javascript', 'function') - 1]).toContain('function selectionSort')
      expect(lines[resolveSelectionSortLine('javascript', 'setup') - 1]).toContain('const n = arr.length')
      expect(lines[resolveSelectionSortLine('javascript', 'outerLoop') - 1]).toContain('for (let i = 0; i < n - 1; i++)')
      expect(lines[resolveSelectionSortLine('javascript', 'initMin') - 1]).toContain('let minIdx = i')
      expect(lines[resolveSelectionSortLine('javascript', 'innerLoop') - 1]).toContain('for (let j = i + 1; j < n; j++)')
      expect(lines[resolveSelectionSortLine('javascript', 'compare') - 1]).toContain('if (arr[j] < arr[minIdx])')
      expect(lines[resolveSelectionSortLine('javascript', 'updateMin') - 1]).toContain('minIdx = j')
      expect(lines[resolveSelectionSortLine('javascript', 'swap') - 1]).toContain('[arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]')
      expect(lines[resolveSelectionSortLine('javascript', 'complete') - 1]).toContain('return arr')
    })

    it('returns undefined for non-existent lineKeys or null input', () => {
      expect(resolveSelectionSortLine('javascript', null)).toBeUndefined()
      expect(resolveSelectionSortLine('javascript', undefined)).toBeUndefined()
      expect(resolveSelectionSortLine('javascript', 'nonExistentKey')).toBeUndefined()
    })

    it('defaults to javascript when requested language is unavailable or omitted', () => {
      const defaultSource = getSelectionSortSource()
      expect(defaultSource).toBe(selectionSortSources.javascript)

      const unknownSource = getSelectionSortSource('unknown_lang')
      expect(unknownSource).toBe(selectionSortSources.javascript)
    })
  })

  describe('4. Determinism, Non-Mutation & Step Structure', () => {
    it('produces identical step sequences on repeated invocations', () => {
      const input = [9, 3, 7, 1, 5]
      const run1 = generateSelectionSortSteps(input)
      const run2 = generateSelectionSortSteps(input)

      expect(run1.length).toBe(run2.length)
      expect(JSON.stringify(run1)).toBe(JSON.stringify(run2))
    })

    it('does not mutate the original caller input array', () => {
      const original = Object.freeze([3, 1, 2])
      expect(() => {
        generateSelectionSortSteps(original)
      }).not.toThrow()
      expect(original).toEqual([3, 1, 2])

      expect(() => {
        selectionSort(original)
      }).not.toThrow()
      expect(original).toEqual([3, 1, 2])
    })

    it('maintains proper step object properties at every step', () => {
      const steps = generateSelectionSortSteps([3, 1, 2])
      for (const step of steps) {
        expect(typeof step.type).toBe('string')
        expect(typeof step.lineKey).toBe('string')
        expect(Array.isArray(step.array)).toBe(true)
        expect(Array.isArray(step.sortedIndices)).toBe(true)
        expect(typeof step.message).toBe('string')
        expect(typeof step.duration).toBe('number')
      }
    })
  })

  describe('5. Negative Testing & Input Validation', () => {
    it('throws TypeError if pure selectionSort is called with non-array', () => {
      expect(() => selectionSort(null)).toThrow(TypeError)
      expect(() => selectionSort('not an array')).toThrow(TypeError)
      expect(() => selectionSort(123)).toThrow(TypeError)
    })

    it('fails sensitivity check when asserting incorrect sorted order', () => {
      const sorted = selectionSort([3, 1, 2])
      expect(sorted).not.toEqual([3, 1, 2])
      expect(sorted).not.toEqual([2, 1, 3])
      expect(sorted).not.toEqual([3, 2, 1])
    })

    it('handles negative numbers and large collections correctly', () => {
      const numbers = [-5, 10, -20, 0, 15, -1]
      expect(selectionSort(numbers)).toEqual([-20, -5, -1, 0, 10, 15])
    })
  })
})
