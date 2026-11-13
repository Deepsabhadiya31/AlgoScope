# Task Evidence: R62-T043 — Sliding Window Maximum: Independent Reference Comparison

- **Task ID**: R62-T043
- **GitHub Issue**: #43
- **Assigned Working Branch**: `student/e26b07f0665/R62-T043`
- **Objective**: Implement focused, pure Sliding Window Maximum algorithm using optimal monotonic deque ($O(n)$ time, $O(k)$ auxiliary space) and compare against an independent $O(n \cdot k)$ reference implementation in regression tests.

---

## 1. Tool Versions

- **Node**: `v24.19.0`
- **npm**: `11.17.0`
- **git**: `git version 2.55.0`
- **Vitest**: `4.1.7`
- **Vite**: `7.1.11`
- **ESLint**: `9.38.0`

---

## 2. Required Example Verification

- **Input**: `arr = [1, 3, -1, -3, 5, 3, 6, 7]`, `k = 3`
- **Expected Output**: `[3, 3, 5, 5, 6, 7]`
- **Optimized Output**: `[3, 3, 5, 5, 6, 7]`
- **Independent Reference Output**: `[3, 3, 5, 5, 6, 7]`
- **Status**: PASSED

---

## 3. Window Validation & Error Handling

| Case | Input | Window `k` | Expected Behavior | Actual Behavior | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| Invalid window zero | `[1, 3, -1]` | `0` | Throws `RangeError` | Throws `RangeError` | **PASS** |
| Invalid negative window | `[1, 2, 3]` | `-1` | Throws `RangeError` | Throws `RangeError` | **PASS** |
| Window exceeds array | `[1, 2]` | `3` | Throws `RangeError` | Throws `RangeError` | **PASS** |
| Empty array input | `[]` | `1` | Throws `RangeError` | Throws `RangeError` | **PASS** |
| Empty array with zero | `[]` | `0` | Throws `RangeError` | Throws `RangeError` | **PASS** |
| Non-integer window | `[1, 2, 3]` | `1.5` | Throws `TypeError` | Throws `TypeError` | **PASS** |
| Non-array input | `null` | `2` | Throws `TypeError` | Throws `TypeError` | **PASS** |

---

## 4. Independent Reference Comparison

Both implementations were tested against multiple deterministic suites:
1. `arr = [9, -2, 5, -1, 3, 7, -4, 8, 2]`, `k = 2` $\rightarrow$ Match
2. `arr = [1, 10, 2, 9, 3, 8, 4, 7]`, `k = 3` $\rightarrow$ Match
3. `arr = [5, 5, 2, 2, 8, 8, 1, 1]`, `k = 4` $\rightarrow$ Match
4. `arr = [-10, 20, -30, 40, -50, 60, -70, 80, -90, 100]`, `k = 5` $\rightarrow$ Match
5. `arr = [3, 1, 4, 1, 5, 9, 2, 6]`, `k = 1` $\rightarrow$ Match

---

## 5. Automated Checks

- **Vitest**: `npm test -- src/algorithms/course/r62-t043.test.js`
  - 22 passing tests.
- **Vite Build**: `npm run build`
  - Production build completed in 2.60s.
- **ESLint**: `npm run lint`
  - 0 errors, 0 warnings.
- **Standalone Verify**: `node work/R62-T043/verify.js`
  - All assertions verified.

