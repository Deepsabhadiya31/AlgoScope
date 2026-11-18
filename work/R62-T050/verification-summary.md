# Verification Summary: R62-T050 Longest Common Subsequence — Mutation-Resistant Tests

## Task Overview
- **Task ID**: R62-T050 (Task 10 of 10)
- **GitHub Issue**: https://github.com/S-AI-Projects/AlgoScope/issues/50
- **Assigned Branch**: `student/e26b07f0665/R62-T050`
- **Primary Source File**: `src/algorithms/course/longest-common-subsequence.js`
- **Regression Test File**: `src/algorithms/course/r62-t050.test.js`
- **Evidence Directory**: `work/R62-T050/`
- **Standalone Verification Script**: `work/R62-T050/verify.js`

---

## 1. Algorithm Implementation & Concrete Fixture

### DP Recurrence
For strings $A$ of length $m$ and $B$ of length $n$:
- If $A[i - 1] === B[j - 1]$:
  $$\text{dp}[i][j] = \text{dp}[i - 1][j - 1] + 1$$
- Else:
  $$\text{dp}[i][j] = \max(\text{dp}[i - 1][j], \text{dp}[i][j - 1])$$

### Subsequence Reconstruction
Traceback from $(m, n)$ to $(0, 0)$ collects matching characters in reverse order.

### Concrete Fixture
- **First String:** `"ABCBDAB"` ($m = 7$)
- **Second String:** `"BDCABA"` ($n = 6$)
- **Expected LCS Length:** $4$
- **Actual Returned LCS:** `"BCBA"` (Length $4$)
- **Valid Tied Subsequences:** `"BCBA"`, `"BDAB"`, `"BCAB"`.
- **Subsequence Invariant:** Verified that the returned string is an order-preserving subsequence of both `"ABCBDAB"` and `"BDCABA"`.

---

## 2. Decisive Operation Mutation Experiment

### Mutation Hypothesis & Selection
The decisive operation in the DP algorithm is the character match condition:
$$\text{Correct Condition: } \quad \text{first}[i - 1] === \text{second}[j - 1]$$
The one-condition mutant deliberately inverts this equality:
$$\text{Mutant Condition: } \quad \text{first}[i - 1] \ne \text{second}[j - 1]$$

### Experiment Results

| Stage | Implementation | Input | Output Length | Output Subsequence | Regression Result |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **Stage 1** | Correct Implementation | `"ABCBDAB"`, `"BDCABA"` | **4** | `"BCBA"` | **PASS** (Valid in both) |
| **Stage 2** | One-Condition Mutant | `"ABCBDAB"`, `"BDCABA"` | **6** | `"ACBDAB"` | **REJECTED** (Assertion Failed) |
| **Stage 3** | Restored Implementation | `"ABCBDAB"`, `"BDCABA"` | **4** | `"BCBA"` | **PASS** (Intact in production) |

### Rejection Proof
Against the mutant, the assertion function throws:
`Error: LCS length mismatch: expected 4, got 6`
and proves `"ACBDAB"` is not a valid common subsequence of the inputs.
The production source remains 100% clean and unmutated.

---

## 3. Automated Verification Results

| Check | Command | Result |
| :--- | :--- | :--- |
| **Vitest Regression Suite** | `npm test -- src/algorithms/course/r62-t050.test.js --run` | **16 / 16 Passed (4ms)** |
| **Vite Production Build** | `npm run build` | **Clean production build (2.57s)** |
| **ESLint Check** | `npm run lint` | **0 errors, 0 warnings** |
| **Standalone Node Check** | `node work/R62-T050/verify.js` | **All verifications passed (Exit Code 0)** |

---

## 4. Issue #50 Checklists

### Done when
- [x] ABCBDAB and BDCABA have LCS length 4; do not require one particular valid tied subsequence.
- [x] The distinction between source strings, pure algorithm results, replay steps and UI components is preserved.
- [x] The focused test has explicit result/state assertions and fails on an incorrect implementation; existing build and lint checks pass.

### Submission checklist
- [x] Complete this task and its checks.
- [x] Add the required evidence and link your pull request here.
- [x] Select this S-AI-Projects fork as the PR base repository.
- [x] Request instructor review.
