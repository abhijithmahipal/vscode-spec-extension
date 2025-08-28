import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { SpecPhase } from "./specWorkflowManager";
import { ErrorHandler, SpecError, ErrorCode } from "./errorHandler";

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: "error" | "warning" | "info";
  phase: SpecPhase;
  check: (context: ValidationContext) => Promise<ValidationResult>;
}

export interface ValidationContext {
  specPath: string;
  featureName: string;
  phase: SpecPhase;
  files: { [key: string]: string };
  workspaceRoot: string;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  suggestions: string[];
  fixAction?: {
    label: string;
    action: () => Promise<void>;
  };
}

export interface ValidationReport {
  phase: SpecPhase;
  overallStatus: "passed" | "warning" | "failed";
  results: Array<{
    rule: ValidationRule;
    result: ValidationResult;
  }>;
  summary: {
    total: number;
    passed: number;
    warnings: number;
    errors: number;
  };
}

export class ValidationSystem {
  private static rules: ValidationRule[] = [];
  private static initialized = false;

  /**
   * Initialize validation system with all rules
   */
  static initialize(): void {
    if (this.initialized) return;

    this.rules = [
      ...this.getRequirementsRules(),
      ...this.getDesignRules(),
      ...this.getTasksRules(),
      ...this.getExecutionRules(),
      ...this.getGeneralRules(),
    ];

    this.initialized = true;
  }

  /**
   * Validate current phase with comprehensive checks
   * Addresses requirement 4.4, 2.4
   */
  static async validatePhase(
    phase: SpecPhase,
    context: ValidationContext
  ): Promise<ValidationReport> {
    this.initialize();

    const phaseRules = this.rules.filter(
      (rule) => rule.phase === phase || rule.phase === SpecPhase.REQUIREMENTS // General rules apply to all phases
    );

    const results: Array<{ rule: ValidationRule; result: ValidationResult }> =
      [];
    let passed = 0;
    let warnings = 0;
    let errors = 0;

    for (const rule of phaseRules) {
      try {
        const result = await rule.check(context);
        results.push({ rule, result });

        if (result.passed) {
          passed++;
        } else if (rule.severity === "warning") {
          warnings++;
        } else if (rule.severity === "error") {
          errors++;
        }
      } catch (error) {
        // If validation rule fails, treat as error
        results.push({
          rule,
          result: {
            passed: false,
            message: `Validation rule failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            suggestions: ["Check the validation rule implementation"],
          },
        });
        errors++;
      }
    }

    const overallStatus =
      errors > 0 ? "failed" : warnings > 0 ? "warning" : "passed";

    return {
      phase,
      overallStatus,
      results,
      summary: {
        total: results.length,
        passed,
        warnings,
        errors,
      },
    };
  }

  /**
   * Show validation results to user with actionable feedback
   */
  static async showValidationResults(report: ValidationReport): Promise<void> {
    const { summary, results } = report;

    if (summary.errors === 0 && summary.warnings === 0) {
      vscode.window.showInformationMessage(
        `✅ All ${summary.total} validation checks passed!`
      );
      return;
    }

    const errorResults = results.filter(
      (r) => !r.result.passed && r.rule.severity === "error"
    );
    const warningResults = results.filter(
      (r) => !r.result.passed && r.rule.severity === "warning"
    );

    // Show errors first
    if (errorResults.length > 0) {
      await this.showValidationIssues(
        "Validation Errors",
        errorResults,
        "error"
      );
    }

    // Then show warnings
    if (warningResults.length > 0) {
      await this.showValidationIssues(
        "Validation Warnings",
        warningResults,
        "warning"
      );
    }
  }

  /**
   * Show validation issues with fix actions
   */
  private static async showValidationIssues(
    title: string,
    issues: Array<{ rule: ValidationRule; result: ValidationResult }>,
    severity: "error" | "warning"
  ): Promise<void> {
    const firstIssue = issues[0];
    const moreCount = issues.length - 1;

    const message =
      moreCount > 0
        ? `${firstIssue.result.message} (+${moreCount} more)`
        : firstIssue.result.message;

    const actions = ["View All Issues"];
    if (firstIssue.result.fixAction) {
      actions.unshift(firstIssue.result.fixAction.label);
    }
    actions.push("Dismiss");

    const showMethod =
      severity === "error"
        ? vscode.window.showErrorMessage
        : vscode.window.showWarningMessage;

    const result = await showMethod(
      message,
      { detail: `${title}: ${firstIssue.rule.name}` },
      ...actions
    );

    if (
      result === firstIssue.result.fixAction?.label &&
      firstIssue.result.fixAction
    ) {
      try {
        await firstIssue.result.fixAction.action();
        vscode.window.showInformationMessage("✅ Fix applied successfully!");
      } catch (error) {
        await ErrorHandler.handleError(
          error instanceof Error ? error : new Error(String(error))
        );
      }
    } else if (result === "View All Issues") {
      await this.showDetailedValidationReport(title, issues);
    }
  }

  /**
   * Show detailed validation report
   */
  private static async showDetailedValidationReport(
    title: string,
    issues: Array<{ rule: ValidationRule; result: ValidationResult }>
  ): Promise<void> {
    const content = `# ${title}

${issues
  .map(
    (issue, index) => `## ${index + 1}. ${issue.rule.name}

**Severity:** ${issue.rule.severity.toUpperCase()}

**Issue:** ${issue.result.message}

**Description:** ${issue.rule.description}

${
  issue.result.suggestions.length > 0
    ? `**Suggestions:**
${issue.result.suggestions.map((s) => `- ${s}`).join("\n")}`
    : ""
}

${
  issue.result.fixAction ? `**Quick Fix:** ${issue.result.fixAction.label}` : ""
}

---
`
  )
  .join("\n")}

*Generated by VSCode Spec-Driven Development Extension*
`;

    try {
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: "markdown",
      });

      await vscode.window.showTextDocument(doc, {
        preview: true,
        viewColumn: vscode.ViewColumn.Beside,
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to show validation report: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Requirements phase validation rules
   */
  private static getRequirementsRules(): ValidationRule[] {
    return [
      {
        id: "req-file-exists",
        name: "Requirements File Exists",
        description: "Requirements document must exist",
        severity: "error",
        phase: SpecPhase.REQUIREMENTS,
        check: async (context) => {
          const reqFile = path.join(context.specPath, "requirements.md");
          const exists = fs.existsSync(reqFile);

          return {
            passed: exists,
            message: exists
              ? "Requirements file exists"
              : "Requirements file is missing",
            suggestions: exists
              ? []
              : [
                  "Create requirements.md file",
                  "Copy the requirements prompt and work with Copilot",
                  "Use the template provided in the spec panel",
                ],
            fixAction: exists
              ? undefined
              : {
                  label: "Create Requirements File",
                  action: async () => {
                    const template = this.getRequirementsTemplate(
                      context.featureName
                    );
                    fs.writeFileSync(reqFile, template);
                    await vscode.window.showTextDocument(
                      vscode.Uri.file(reqFile)
                    );
                  },
                },
          };
        },
      },
      {
        id: "req-has-user-stories",
        name: "Contains User Stories",
        description: "Requirements should include user stories",
        severity: "error",
        phase: SpecPhase.REQUIREMENTS,
        check: async (context) => {
          const content = context.files["requirements.md"] || "";
          const hasUserStories =
            content.includes("User Story:") || content.includes("As a");

          return {
            passed: hasUserStories,
            message: hasUserStories
              ? "User stories found"
              : "No user stories found",
            suggestions: hasUserStories
              ? []
              : [
                  "Add user stories in format: 'As a [role], I want [feature], so that [benefit]'",
                  "Consider different user types and their needs",
                  "Focus on the 'why' behind each feature",
                ],
          };
        },
      },
      {
        id: "req-has-acceptance-criteria",
        name: "Contains Acceptance Criteria",
        description:
          "Requirements should include EARS format acceptance criteria",
        severity: "error",
        phase: SpecPhase.REQUIREMENTS,
        check: async (context) => {
          const content = context.files["requirements.md"] || "";
          const hasEARS = content.includes("WHEN") && content.includes("SHALL");

          return {
            passed: hasEARS,
            message: hasEARS
              ? "EARS format acceptance criteria found"
              : "Missing EARS format acceptance criteria",
            suggestions: hasEARS
              ? []
              : [
                  "Add acceptance criteria using EARS format",
                  "Use: 'WHEN [event] THEN [system] SHALL [response]'",
                  "Make criteria specific and testable",
                ],
          };
        },
      },
      {
        id: "req-sufficient-detail",
        name: "Sufficient Detail",
        description: "Requirements should have adequate detail",
        severity: "warning",
        phase: SpecPhase.REQUIREMENTS,
        check: async (context) => {
          const content = context.files["requirements.md"] || "";
          const wordCount = content.split(/\s+/).length;
          const sufficient = wordCount >= 200;

          return {
            passed: sufficient,
            message: sufficient
              ? `Requirements have sufficient detail (${wordCount} words)`
              : `Requirements may need more detail (${wordCount} words)`,
            suggestions: sufficient
              ? []
              : [
                  "Add more detailed descriptions",
                  "Consider edge cases and error scenarios",
                  "Include more acceptance criteria",
                  "Think about different user workflows",
                ],
          };
        },
      },
    ];
  }

  /**
   * Design phase validation rules
   */
  private static getDesignRules(): ValidationRule[] {
    return [
      {
        id: "design-file-exists",
        name: "Design File Exists",
        description: "Design document must exist",
        severity: "error",
        phase: SpecPhase.DESIGN,
        check: async (context) => {
          const designFile = path.join(context.specPath, "design.md");
          const exists = fs.existsSync(designFile);

          return {
            passed: exists,
            message: exists ? "Design file exists" : "Design file is missing",
            suggestions: exists
              ? []
              : [
                  "Create design.md file",
                  "Copy the design prompt and work with Copilot",
                  "Review requirements before creating design",
                ],
            fixAction: exists
              ? undefined
              : {
                  label: "Create Design File",
                  action: async () => {
                    const template = this.getDesignTemplate(
                      context.featureName
                    );
                    fs.writeFileSync(designFile, template);
                    await vscode.window.showTextDocument(
                      vscode.Uri.file(designFile)
                    );
                  },
                },
          };
        },
      },
      {
        id: "design-has-architecture",
        name: "Contains Architecture Section",
        description: "Design should include architecture overview",
        severity: "error",
        phase: SpecPhase.DESIGN,
        check: async (context) => {
          const content = context.files["design.md"] || "";
          const hasArchitecture =
            content.includes("Architecture") ||
            content.includes("architecture");

          return {
            passed: hasArchitecture,
            message: hasArchitecture
              ? "Architecture section found"
              : "Missing architecture section",
            suggestions: hasArchitecture
              ? []
              : [
                  "Add an Architecture section to your design",
                  "Describe the high-level system structure",
                  "Consider using Mermaid diagrams for visualization",
                ],
          };
        },
      },
      {
        id: "design-addresses-requirements",
        name: "Addresses Requirements",
        description: "Design should reference requirements",
        severity: "warning",
        phase: SpecPhase.DESIGN,
        check: async (context) => {
          const designContent = context.files["design.md"] || "";
          const reqContent = context.files["requirements.md"] || "";

          // Simple check for requirement references
          const hasReqReferences =
            designContent.includes("requirement") ||
            designContent.includes("Requirement") ||
            designContent.includes("user story");

          return {
            passed: hasReqReferences,
            message: hasReqReferences
              ? "Design references requirements"
              : "Design should reference requirements",
            suggestions: hasReqReferences
              ? []
              : [
                  "Reference specific requirements in your design",
                  "Ensure all requirements are addressed",
                  "Explain how the design meets each requirement",
                ],
          };
        },
      },
    ];
  }

  /**
   * Tasks phase validation rules
   */
  private static getTasksRules(): ValidationRule[] {
    return [
      {
        id: "tasks-file-exists",
        name: "Tasks File Exists",
        description: "Tasks document must exist",
        severity: "error",
        phase: SpecPhase.TASKS,
        check: async (context) => {
          const tasksFile = path.join(context.specPath, "tasks.md");
          const exists = fs.existsSync(tasksFile);

          return {
            passed: exists,
            message: exists ? "Tasks file exists" : "Tasks file is missing",
            suggestions: exists
              ? []
              : [
                  "Create tasks.md file",
                  "Copy the tasks prompt and work with Copilot",
                  "Break down design into actionable tasks",
                ],
            fixAction: exists
              ? undefined
              : {
                  label: "Create Tasks File",
                  action: async () => {
                    const template = this.getTasksTemplate(context.featureName);
                    fs.writeFileSync(tasksFile, template);
                    await vscode.window.showTextDocument(
                      vscode.Uri.file(tasksFile)
                    );
                  },
                },
          };
        },
      },
      {
        id: "tasks-has-checkboxes",
        name: "Contains Task Checkboxes",
        description: "Tasks should be formatted as checkboxes",
        severity: "error",
        phase: SpecPhase.TASKS,
        check: async (context) => {
          const content = context.files["tasks.md"] || "";
          const checkboxes = content.match(/- \[[ x]\]/g);
          const hasCheckboxes = Boolean(checkboxes && checkboxes.length > 0);

          return {
            passed: hasCheckboxes,
            message: hasCheckboxes
              ? `Found ${checkboxes!.length} task checkboxes`
              : "No task checkboxes found",
            suggestions: hasCheckboxes
              ? []
              : [
                  "Format tasks as checkboxes: - [ ] Task name",
                  "Use - [x] for completed tasks",
                  "Break down work into specific, actionable tasks",
                ],
          };
        },
      },
      {
        id: "tasks-reference-requirements",
        name: "Tasks Reference Requirements",
        description: "Tasks should reference specific requirements",
        severity: "warning",
        phase: SpecPhase.TASKS,
        check: async (context) => {
          const content = context.files["tasks.md"] || "";
          const hasReqReferences =
            content.includes("_Requirements:") ||
            content.includes("Requirements:");

          return {
            passed: hasReqReferences,
            message: hasReqReferences
              ? "Tasks reference requirements"
              : "Tasks should reference requirements",
            suggestions: hasReqReferences
              ? []
              : [
                  "Add requirement references to tasks: _Requirements: 1.1, 2.3_",
                  "Link each task to specific requirements",
                  "Ensure all requirements are covered by tasks",
                ],
          };
        },
      },
      {
        id: "tasks-appropriate-size",
        name: "Tasks Are Appropriately Sized",
        description: "Tasks should be small and manageable",
        severity: "warning",
        phase: SpecPhase.TASKS,
        check: async (context) => {
          const content = context.files["tasks.md"] || "";
          const checkboxes = content.match(/- \[[ x]\]/g);
          const taskCount = checkboxes ? checkboxes.length : 0;
          const appropriate = taskCount >= 3 && taskCount <= 20;

          return {
            passed: appropriate,
            message: appropriate
              ? `Task count is appropriate (${taskCount} tasks)`
              : taskCount < 3
              ? `Too few tasks (${taskCount}). Consider breaking down further`
              : `Many tasks (${taskCount}). Consider grouping or prioritizing`,
            suggestions: appropriate
              ? []
              : taskCount < 3
              ? [
                  "Break down complex work into smaller tasks",
                  "Each task should be completable in 1-2 hours",
                  "Add testing and documentation tasks",
                ]
              : [
                  "Consider grouping related tasks",
                  "Prioritize the most important tasks first",
                  "Some tasks might be combined",
                ],
          };
        },
      },
    ];
  }

  /**
   * Execution phase validation rules
   */
  private static getExecutionRules(): ValidationRule[] {
    return [
      {
        id: "exec-has-tasks",
        name: "Has Tasks to Execute",
        description: "Should have tasks available for execution",
        severity: "error",
        phase: SpecPhase.EXECUTION,
        check: async (context) => {
          const content = context.files["tasks.md"] || "";
          const checkboxes = content.match(/- \[[ x]\]/g);
          const hasTasks = Boolean(checkboxes && checkboxes.length > 0);

          return {
            passed: hasTasks,
            message: hasTasks
              ? "Tasks available for execution"
              : "No tasks found for execution",
            suggestions: hasTasks
              ? []
              : [
                  "Complete the Tasks phase first",
                  "Ensure tasks.md contains actionable tasks",
                  "Go back and create implementation tasks",
                ],
          };
        },
      },
      {
        id: "exec-progress-tracking",
        name: "Progress Tracking",
        description: "Task completion should be tracked",
        severity: "info",
        phase: SpecPhase.EXECUTION,
        check: async (context) => {
          const content = context.files["tasks.md"] || "";
          const totalTasks = (content.match(/- \[[ x]\]/g) || []).length;
          const completedTasks = (content.match(/- \[x\]/g) || []).length;
          const hasProgress = completedTasks > 0;

          return {
            passed: true, // This is informational
            message: `Progress: ${completedTasks}/${totalTasks} tasks completed`,
            suggestions: hasProgress
              ? [
                  "Keep up the great work!",
                  "Remember to test as you implement",
                  "Commit your changes frequently",
                ]
              : [
                  "Start with the first task",
                  "Focus on one task at a time",
                  "Mark tasks as complete when finished",
                ],
          };
        },
      },
    ];
  }

  /**
   * General validation rules that apply to all phases
   */
  private static getGeneralRules(): ValidationRule[] {
    return [
      {
        id: "general-workspace-valid",
        name: "Valid Workspace",
        description: "Workspace should be properly configured",
        severity: "error",
        phase: SpecPhase.REQUIREMENTS, // Used as general phase
        check: async (context) => {
          const workspaceValid = fs.existsSync(context.workspaceRoot);

          return {
            passed: workspaceValid,
            message: workspaceValid
              ? "Workspace is valid"
              : "Invalid workspace",
            suggestions: workspaceValid
              ? []
              : [
                  "Open a valid workspace folder",
                  "Ensure you have write permissions",
                  "Check that the workspace path exists",
                ],
          };
        },
      },
      {
        id: "general-spec-directory",
        name: "Spec Directory Structure",
        description: "Spec directory should be properly structured",
        severity: "warning",
        phase: SpecPhase.REQUIREMENTS,
        check: async (context) => {
          const specDirExists = fs.existsSync(context.specPath);

          return {
            passed: specDirExists,
            message: specDirExists
              ? "Spec directory exists"
              : "Spec directory missing",
            suggestions: specDirExists
              ? []
              : [
                  "Spec directory will be created automatically",
                  "Ensure you have write permissions",
                  "Check workspace configuration",
                ],
            fixAction: specDirExists
              ? undefined
              : {
                  label: "Create Spec Directory",
                  action: async () => {
                    fs.mkdirSync(context.specPath, { recursive: true });
                    vscode.window.showInformationMessage(
                      `Created spec directory: ${context.specPath}`
                    );
                  },
                },
          };
        },
      },
    ];
  }

  /**
   * Template generators for fix actions
   */
  private static getRequirementsTemplate(featureName: string): string {
    return `# Requirements Document

## Introduction

This document outlines the requirements for the ${featureName} feature.

## Requirements

### Requirement 1

**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria

1. WHEN [event] THEN [system] SHALL [response]
2. IF [precondition] THEN [system] SHALL [response]

### Requirement 2

**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria

1. WHEN [event] THEN [system] SHALL [response]
2. WHEN [event] AND [condition] THEN [system] SHALL [response]
`;
  }

  private static getDesignTemplate(featureName: string): string {
    return `# Design Document

## Overview

High-level overview of the ${featureName} feature design.

## Architecture

Describe the system architecture and main components.

## Components and Interfaces

Detail the key components and their interfaces.

## Data Models

Define the data structures and relationships.

## Error Handling

Describe error handling strategies.

## Testing Strategy

Outline the testing approach.
`;
  }

  private static getTasksTemplate(featureName: string): string {
    return `# Implementation Plan

## ${featureName} Tasks

- [ ] 1. Set up basic structure
  - Create necessary files and directories
  - _Requirements: 1.1_

- [ ] 2. Implement core functionality
  - Add main feature implementation
  - _Requirements: 1.2, 2.1_

- [ ] 3. Add tests
  - Write unit tests for core functionality
  - _Requirements: 1.1_

- [ ] 4. Integration and polish
  - Integrate with existing system
  - Polish user experience
  - _Requirements: 2.1_
`;
  }
}
