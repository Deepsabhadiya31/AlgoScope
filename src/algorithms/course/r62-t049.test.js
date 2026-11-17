import { describe, it, expect } from 'vitest'
import vm from 'node:vm'
import {
  rotateMatrix90,
  rotateMatrix90WithMetrics,
  generateMatrixRotationSteps,
  getMatrixRotationSource,
  resolveMatrixRotationLine,
  validateSquareMatrix,
} from './rotate-matrix-90'

/**
 * Executes a JavaScript source code snippet in an isolated Node VM sandbox,
 * capturing console.log output.
 *
 * @param {string} sourceCode
 * @param {number} [timeoutMs=2000]
 * @returns {Array<any>} Captured console.log arguments.
 */
function executeSourceInVm(sourceCode, timeoutMs = 2000) {
  const logs = []
  const sandbox = {
    console: {
      log: (...args) => logs.push(args.length === 1 ? args[0] : args),
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

describe('R62-T049: Rotate Matrix 90° Clockwise — Complexity Experiment', () => {
  // ── Test A — Basic Clockwise Rotation ─────────────────────────────────────
  describe('Test A — Basic clockwise rotation', () => {
    it('rotates required 2x2 matrix 90 degrees clockwise', () => {
      const input = [
        [1, 2],
        [3, 4],
      ]
      const expected = [
        [3, 1],
        [4, 2],
      ]

      const actual = rotateMatrix90(input)
      expect(actual).toEqual(expected)
    })
  })

  // ── Test B — Four Rotations Recover the Original Matrix ───────────────────
  describe('Test B — Four rotations recover the original matrix', () => {
    it('four consecutive 90° clockwise rotations return the exact original 2x2 matrix', () => {
      const original = [
        [1, 2],
        [3, 4],
      ]

      const r1 = rotateMatrix90(original) // 90°
      const r2 = rotateMatrix90(r1) // 180°
      const r3 = rotateMatrix90(r2) // 270°
      const r4 = rotateMatrix90(r3) // 360° (full cycle)

      expect(r1).toEqual([
        [3, 1],
        [4, 2],
      ])
      expect(r2).toEqual([
        [4, 3],
        [2, 1],
      ])
      expect(r3).toEqual([
        [2, 4],
        [1, 3],
      ])
      expect(r4).toEqual(original)
    })

    it('four consecutive rotations recover a 3x3 matrix', () => {
      const original = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]

      let current = original
      for (let i = 0; i < 4; i++) {
        current = rotateMatrix90(current)
      }

      expect(current).toEqual(original)
    })
  })

  // ── Test C — Larger Square Matrices ───────────────────────────────────────
  describe('Test C — Larger square matrix', () => {
    it('correctly rotates a 3x3 matrix', () => {
      const input = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]
      const expected = [
        [7, 4, 1],
        [8, 5, 2],
        [9, 6, 3],
      ]

      expect(rotateMatrix90(input)).toEqual(expected)
    })

    it('correctly rotates a 4x4 matrix', () => {
      const input = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16],
      ]
      const expected = [
        [13, 9, 5, 1],
        [14, 10, 6, 2],
        [15, 11, 7, 3],
        [16, 12, 8, 4],
      ]

      expect(rotateMatrix90(input)).toEqual(expected)
    })

    it('handles smallest valid square matrix collections (0x0 and 1x1)', () => {
      expect(rotateMatrix90([])).toEqual([])
      expect(rotateMatrix90([[42]])).toEqual([[42]])
    })
  })

  // ── Test D — Input Preservation ───────────────────────────────────────────
  describe('Test D — Input preservation (Non-mutating pure function)', () => {
    it('leaves the original input matrix unchanged after rotation', () => {
      const input = [
        [1, 2],
        [3, 4],
      ]
      const snapshot = JSON.parse(JSON.stringify(input))

      const output = rotateMatrix90(input)

      expect(input).toEqual(snapshot)
      expect(output).not.toBe(input)
      expect(output[0]).not.toBe(input[0])
      expect(output[1]).not.toBe(input[1])
    })

    it('does not mutate 3x3 input matrix', () => {
      const input = [
        [10, 20, 30],
        [40, 50, 60],
        [70, 80, 90],
      ]
      const snapshot = JSON.parse(JSON.stringify(input))

      rotateMatrix90(input)

      expect(input).toEqual(snapshot)
    })
  })

  // ── Test E — Complexity Experiment ────────────────────────────────────────
  describe('Test E — Complexity experiment (Deterministic operation counts)', () => {
    it('records deterministic operation/step counts for three bounded square sizes (2x2, 3x3, 4x4)', () => {
      const size2 = [
        [1, 2],
        [3, 4],
      ]
      const size3 = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]
      const size4 = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16],
      ]

      const exp2 = rotateMatrix90WithMetrics(size2)
      const exp3 = rotateMatrix90WithMetrics(size3)
      const exp4 = rotateMatrix90WithMetrics(size4)

      // Verify 2x2
      expect(exp2.metrics.dimension).toBe(2)
      expect(exp2.metrics.totalElements).toBe(4)
      expect(exp2.metrics.elementPlacements).toBe(4) // 2^2
      expect(exp2.metrics.coordinateCalculations).toBe(4)
      expect(exp2.metrics.totalOperations).toBe(8)

      // Verify 3x3
      expect(exp3.metrics.dimension).toBe(3)
      expect(exp3.metrics.totalElements).toBe(9)
      expect(exp3.metrics.elementPlacements).toBe(9) // 3^2
      expect(exp3.metrics.coordinateCalculations).toBe(9)
      expect(exp3.metrics.totalOperations).toBe(18)

      // Verify 4x4
      expect(exp4.metrics.dimension).toBe(4)
      expect(exp4.metrics.totalElements).toBe(16)
      expect(exp4.metrics.elementPlacements).toBe(16) // 4^2
      expect(exp4.metrics.coordinateCalculations).toBe(16)
      expect(exp4.metrics.totalOperations).toBe(32)

      // Quadratic growth check: elementPlacements = N^2
      expect(exp2.metrics.elementPlacements).toBe(2 ** 2)
      expect(exp3.metrics.elementPlacements).toBe(3 ** 2)
      expect(exp4.metrics.elementPlacements).toBe(4 ** 2)
    })

    it('verifies deterministic replay step progression across the three sizes', () => {
      const steps2 = generateMatrixRotationSteps([
        [1, 2],
        [3, 4],
      ])
      const steps3 = generateMatrixRotationSteps([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ])
      const steps4 = generateMatrixRotationSteps([
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16],
      ])

      // Each matrix has: 1 start step + 1 alloc step + N^2 placement steps + 1 complete step = N^2 + 3
      expect(steps2.length).toBe(2 ** 2 + 3) // 7
      expect(steps3.length).toBe(3 ** 2 + 3) // 12
      expect(steps4.length).toBe(4 ** 2 + 3) // 19

      // Only place steps count element placements
      expect(steps2.filter((s) => s.type === 'place').length).toBe(4)
      expect(steps3.filter((s) => s.type === 'place').length).toBe(9)
      expect(steps4.filter((s) => s.type === 'place').length).toBe(16)
    })

    it('does not assert hardware-dependent timing', () => {
      const res = rotateMatrix90WithMetrics([
        [1, 2],
        [3, 4],
      ])
      expect(res.metrics).not.toHaveProperty('executionTimeMs')
      expect(res.metrics).not.toHaveProperty('benchmarkMs')
    })
  })

  // ── Test F — Invalid Input Behavior ───────────────────────────────────────
  describe('Test F — Invalid input behavior', () => {
    it('throws TypeError for null, undefined, or non-array inputs', () => {
      expect(() => rotateMatrix90(null)).toThrow(TypeError)
      expect(() => rotateMatrix90(undefined)).toThrow(TypeError)
      expect(() => rotateMatrix90('matrix')).toThrow(TypeError)
      expect(() => rotateMatrix90(123)).toThrow(TypeError)
      expect(() => rotateMatrix90({ a: 1 })).toThrow(TypeError)
    })

    it('throws TypeError if any row is not an array', () => {
      expect(() => rotateMatrix90([ [1, 2], 'not-a-row' ])).toThrow(TypeError)
      expect(() => rotateMatrix90([ null, [3, 4] ])).toThrow(TypeError)
    })

    it('throws Error for rectangular non-square matrices', () => {
      // 2 rows, 3 columns
      expect(() =>
        rotateMatrix90([
          [1, 2, 3],
          [4, 5, 6],
        ])
      ).toThrow(/square/)

      // 3 rows, 2 columns
      expect(() =>
        rotateMatrix90([
          [1, 2],
          [3, 4],
          [5, 6],
        ])
      ).toThrow(/square/)
    })

    it('throws Error for jagged matrices', () => {
      expect(() =>
        rotateMatrix90([
          [1, 2, 3],
          [4, 5],
          [7, 8, 9],
        ])
      ).toThrow(/square/)
    })

    it('validateSquareMatrix throws expected errors on invalid structures', () => {
      expect(() => validateSquareMatrix(null)).toThrow(TypeError)
      expect(() => validateSquareMatrix([[1, 2], [3]])).toThrow(/square/)
    })

    it('generateMatrixRotationSteps returns an error step when given invalid input', () => {
      const steps = generateMatrixRotationSteps('invalid')
      expect(steps.length).toBe(1)
      expect(steps[0].type).toBe('error')
      expect(steps[0].variables.error).toBe(true)
    })
  })

  // ── Source Strings & Isolated VM Evaluation ───────────────────────────────
  describe('Source strings & isolated VM execution', () => {
    it('evaluates displayed JavaScript code in isolated Node VM and matches output', () => {
      const src = getMatrixRotationSource('javascript')
      expect(src).toBeDefined()
      expect(typeof src.code).toBe('string')

      const logs = executeSourceInVm(src.code)
      expect(logs.length).toBe(1)
      // Check cross-realm array equality
      expect(logs[0]).toEqual([
        [3, 1],
        [4, 2],
      ])
    })

    it('maps semantic lineKeys accurately to source code', () => {
      const expectedKeys = [
        'function',
        'setup',
        'alloc',
        'outerLoop',
        'innerLoop',
        'place',
        'returnResult',
        'complete',
      ]

      for (const key of expectedKeys) {
        const line = resolveMatrixRotationLine('javascript', key)
        expect(line).toBeGreaterThanOrEqual(1)
      }

      expect(resolveMatrixRotationLine('javascript', 'nonExistent')).toBeUndefined()
      expect(resolveMatrixRotationLine('javascript', null)).toBeUndefined()
    })
  })
})
