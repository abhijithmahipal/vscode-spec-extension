import * as assert from "assert";
import * as path from "path";
import { ValidationSystem, ValidationContext } from "../validationSystem";
import { SpecPhase } from "../specWorkflowManager";

suite("ValidationSystem Tests", () => {
  const mockContext: ValidationContext = {
    specPath: "/test/spec",
    featureName: "test-feature",
    phase: SpecPhase.REQUIREMENTS,
    files: {},
    workspaceRoot: "/test",
  };

  test("Should initialize validation system", () => {
    ValidationSystem.initialize();
    // Should not throw any errors
    assert.ok(true);
  });

  test("Should validate requirements phase with missing file", async () => {
    const context = {
      ...mockContext,
      files: {}, // No requirements.md file
    };

    const report = await ValidationSystem.validatePhase(
      SpecPhase.REQUIREMENTS,
      context
    );

    assert.strictEqual(report.phase, SpecPhase.REQUIREMENTS);
    assert.strictEqual(report.overallStatus, "failed");
    assert.ok(report.summary.errors > 0);

    // Should have file existence error
    const fileError = report.results.find(
      (r) => r.rule.id === "req-file-exists" && !r.result.passed
    );
    assert.ok(fileError);
  });

  test("Should validate requirements phase with valid content", async () => {
    const context = {
      ...mockContext,
      files: {
        "requirements.md": `# Requirements Document

## Requirements

### Requirement 1
**User Story:** As a user, I want to test, so that it works

#### Acceptance Criteria
1. WHEN user clicks THEN system SHALL respond
2. IF condition THEN system SHALL handle it
`,
      },
    };

    const report = await ValidationSystem.validatePhase(
      SpecPhase.REQUIREMENTS,
      context
    );

    assert.strictEqual(report.phase, SpecPhase.REQUIREMENTS);
    // Should pass most validations with this content
    assert.ok(report.summary.passed > 0);
  });

  test("Should validate tasks phase with checkboxes", async () => {
    const context = {
      ...mockContext,
      phase: SpecPhase.TASKS,
      files: {
        "tasks.md": `# Implementation Plan

- [ ] 1. First task
  - Task details
  - _Requirements: 1.1_

- [x] 2. Completed task
  - Already done
  - _Requirements: 1.2_
`,
      },
    };

    const report = await ValidationSystem.validatePhase(
      SpecPhase.TASKS,
      context
    );

    assert.strictEqual(report.phase, SpecPhase.TASKS);

    // Should find checkboxes
    const checkboxRule = report.results.find(
      (r) => r.rule.id === "tasks-has-checkboxes"
    );
    assert.ok(checkboxRule);
    assert.strictEqual(checkboxRule.result.passed, true);
  });

  test("Should validate execution phase", async () => {
    const context = {
      ...mockContext,
      phase: SpecPhase.EXECUTION,
      files: {
        "tasks.md": `# Implementation Plan

- [ ] 1. Task to do
- [x] 2. Completed task
`,
      },
    };

    const report = await ValidationSystem.validatePhase(
      SpecPhase.EXECUTION,
      context
    );

    assert.strictEqual(report.phase, SpecPhase.EXECUTION);
    assert.ok(report.results.length > 0);
  });

  test("Should handle validation errors gracefully", async () => {
    const contextWithError = {
      ...mockContext,
      specPath: "/invalid/path",
    };

    // Should not throw, but handle errors gracefully
    const report = await ValidationSystem.validatePhase(
      SpecPhase.REQUIREMENTS,
      contextWithError
    );

    assert.strictEqual(report.phase, SpecPhase.REQUIREMENTS);
    // Should still return a report even with errors
    assert.ok(report.summary);
  });
});
