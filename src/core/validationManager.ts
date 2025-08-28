import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { SpecPhase } from "./workflowManager";

export interface ValidationContext {
  specPath: string;
  featureName: string;
  phase: SpecPhase;
  files: { [key: string]: string };
  workspaceRoot: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Consolidated Validation Manager
 * Combines validation logic from ValidationSystem and workflow validation
 * Addresses requirements 1.2, 1.3
 */
export class ValidationManager {
  private static instance: ValidationManager;

  static getInstance(): ValidationManager {
    if (!ValidationManager.instance) {
      ValidationManager.instance = new ValidationManager();
    }
    return ValidationManager.instance;
  }

  /**
   * Validate current phase with comprehensive checks
   */
  async validatePhase(
    phase: SpecPhase,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      switch (phase) {
        case SpecPhase.REQUIREMENTS:
          const reqResult = await this.validateRequirementsPhase(context);
          errors.push(...reqResult.errors);
          warnings.push(...reqResult.warnings);
          break;

        case SpecPhase.DESIGN:
          const designResult = await this.validateDesignPhase(context);
          errors.push(...designResult.errors);
          warnings.push(...designResult.warnings);
          break;

        case SpecPhase.TASKS:
          const tasksResult = await this.validateTasksPhase(context);
          errors.push(...tasksResult.errors);
          warnings.push(...tasksResult.warnings);
          break;

        case SpecPhase.EXECUTION:
          const execResult = await this.validateExecutionPhase(context);
          errors.push(...execResult.errors);
          warnings.push(...execResult.warnings);
          break;
      }

      // General validations that apply to all phases
      const generalResult = await this.validateGeneral(context);
      errors.push(...generalResult.errors);
      warnings.push(...generalResult.warnings);
    } catch (error) {
      errors.push(
        `Validation failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate requirements phase
   */
  private async validateRequirementsPhase(
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const reqFile = path.join(context.specPath, "requirements.md");

    if (!fs.existsSync(reqFile)) {
      errors.push("Requirements file (requirements.md) does not exist.");
      return { isValid: false, errors, warnings };
    }

    const content = context.files["requirements.md"] || "";

    // Check for basic structure
    if (!content.includes("# Requirements Document")) {
      warnings.push("Requirements document should have a proper header.");
    }

    if (!content.includes("User Story:")) {
      errors.push("Requirements should include user stories.");
    }

    if (!content.includes("WHEN") && !content.includes("SHALL")) {
      errors.push(
        "Requirements should include EARS format acceptance criteria."
      );
    }

    if (content.trim().length < 200) {
      warnings.push(
        "Requirements document seems quite short. Consider adding more detail."
      );
    }

    // Check for multiple requirements
    const requirementSections = content.match(/### Requirement \d+/g);
    if (!requirementSections || requirementSections.length < 2) {
      warnings.push(
        "Consider adding more requirements to cover different aspects of the feature."
      );
    }

    // Check for acceptance criteria
    const acceptanceCriteria = content.match(/#### Acceptance Criteria/g);
    if (!acceptanceCriteria || acceptanceCriteria.length === 0) {
      errors.push("Requirements should include acceptance criteria sections.");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate design phase
   */
  private async validateDesignPhase(
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const designFile = path.join(context.specPath, "design.md");

    if (!fs.existsSync(designFile)) {
      errors.push("Design file (design.md) does not exist.");
      return { isValid: false, errors, warnings };
    }

    const content = context.files["design.md"] || "";

    // Check for basic structure
    if (!content.includes("# Design Document")) {
      warnings.push("Design document should have a proper header.");
    }

    const requiredSections = ["Overview", "Architecture", "Components"];
    for (const section of requiredSections) {
      if (!content.includes(section)) {
        warnings.push(`Design document should include a ${section} section.`);
      }
    }

    if (content.trim().length < 300) {
      warnings.push(
        "Design document seems quite short. Consider adding more detail."
      );
    }

    // Check if design references requirements
    const reqContent = context.files["requirements.md"] || "";
    if (reqContent && !content.toLowerCase().includes("requirement")) {
      warnings.push("Design should reference specific requirements.");
    }

    // Check for diagrams or visual elements
    if (!content.includes("```mermaid") && !content.includes("diagram")) {
      warnings.push("Consider adding diagrams to visualize the architecture.");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate tasks phase
   */
  private async validateTasksPhase(
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const tasksFile = path.join(context.specPath, "tasks.md");

    if (!fs.existsSync(tasksFile)) {
      errors.push("Tasks file (tasks.md) does not exist.");
      return { isValid: false, errors, warnings };
    }

    const content = context.files["tasks.md"] || "";

    // Check for task checkboxes
    const taskMatches = content.match(/- \[[ x]\]/g);
    if (!taskMatches || taskMatches.length === 0) {
      errors.push(
        "Tasks document should contain actionable tasks with checkboxes."
      );
    } else if (taskMatches.length < 3) {
      warnings.push(
        "Consider breaking down the work into more granular tasks."
      );
    } else if (taskMatches.length > 20) {
      warnings.push(
        "Consider grouping related tasks or prioritizing the most important ones."
      );
    }

    // Check for requirement references
    if (!content.includes("_Requirements:")) {
      warnings.push("Tasks should reference specific requirements.");
    }

    // Check for proper task numbering
    const numberedTasks = content.match(/- \[[ x]\] \d+\./g);
    if (!numberedTasks || numberedTasks.length === 0) {
      warnings.push("Consider numbering tasks for better organization.");
    }

    // Check for sub-tasks
    const subTasks = content.match(/- \[[ x]\] \d+\.\d+/g);
    if (
      taskMatches &&
      taskMatches.length > 5 &&
      (!subTasks || subTasks.length === 0)
    ) {
      warnings.push("Consider breaking down complex tasks into sub-tasks.");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate execution phase
   */
  private async validateExecutionPhase(
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const tasksFile = path.join(context.specPath, "tasks.md");

    if (!fs.existsSync(tasksFile)) {
      errors.push("Tasks file is required for execution phase.");
      return { isValid: false, errors, warnings };
    }

    const content = context.files["tasks.md"] || "";
    const taskMatches = content.match(/- \[[ x]\]/g);

    if (!taskMatches || taskMatches.length === 0) {
      errors.push("No tasks found for execution.");
      return { isValid: false, errors, warnings };
    }

    const completedTasks = content.match(/- \[x\]/g);
    const completedCount = completedTasks ? completedTasks.length : 0;
    const totalCount = taskMatches.length;
    const progress = (completedCount / totalCount) * 100;

    if (progress === 0) {
      warnings.push(
        "No tasks have been completed yet. Start with the first task."
      );
    } else if (progress < 50) {
      warnings.push(
        `${Math.round(progress)}% complete. Keep up the good work!`
      );
    } else if (progress < 100) {
      warnings.push(
        `${Math.round(progress)}% complete. You're making great progress!`
      );
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * General validations that apply to all phases
   */
  private async validateGeneral(
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check workspace
    if (!context.workspaceRoot || !fs.existsSync(context.workspaceRoot)) {
      errors.push("Invalid workspace. Please open a valid workspace folder.");
    }

    // Check spec directory
    if (!fs.existsSync(context.specPath)) {
      warnings.push("Spec directory will be created automatically.");
    }

    // Check feature name
    if (!context.featureName || context.featureName.length < 3) {
      errors.push("Feature name should be at least 3 characters long.");
    }

    // Check for proper naming convention
    if (context.featureName && !/^[a-z0-9-]+$/.test(context.featureName)) {
      warnings.push(
        "Feature name should use kebab-case format (lowercase letters, numbers, and hyphens only)."
      );
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Quick validation for specific file
   */
  async validateFile(
    filePath: string,
    expectedContent?: string[]
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!fs.existsSync(filePath)) {
      errors.push(`File does not exist: ${filePath}`);
      return { isValid: false, errors, warnings };
    }

    if (expectedContent && expectedContent.length > 0) {
      try {
        const content = fs.readFileSync(filePath, "utf8");

        for (const expected of expectedContent) {
          if (!content.includes(expected)) {
            warnings.push(`File should contain: ${expected}`);
          }
        }
      } catch (error) {
        errors.push(
          `Failed to read file: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate task format
   */
  validateTaskFormat(taskContent: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for checkbox format
    if (!taskContent.match(/^- \[[ x]\]/)) {
      errors.push("Task should start with checkbox format: - [ ] or - [x]");
    }

    // Check for task numbering
    if (!taskContent.match(/^- \[[ x]\] \d+/)) {
      warnings.push("Consider numbering tasks for better organization");
    }

    // Check for requirement references
    if (!taskContent.includes("_Requirements:")) {
      warnings.push("Task should reference specific requirements");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate user story format
   */
  validateUserStoryFormat(storyContent: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for proper user story format
    if (
      !storyContent.includes("As a") ||
      !storyContent.includes("I want") ||
      !storyContent.includes("so that")
    ) {
      errors.push(
        "User story should follow format: 'As a [role], I want [feature], so that [benefit]'"
      );
    }

    // Check for acceptance criteria
    if (!storyContent.includes("Acceptance Criteria")) {
      errors.push("User story should include acceptance criteria");
    }

    // Check for EARS format
    if (!storyContent.includes("WHEN") && !storyContent.includes("SHALL")) {
      warnings.push("Consider using EARS format for acceptance criteria");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Get validation suggestions based on phase
   */
  getValidationSuggestions(phase: SpecPhase): string[] {
    switch (phase) {
      case SpecPhase.REQUIREMENTS:
        return [
          "Include multiple user stories for different user types",
          "Use EARS format for acceptance criteria",
          "Consider edge cases and error scenarios",
          "Add sufficient detail to each requirement",
        ];

      case SpecPhase.DESIGN:
        return [
          "Include architecture diagrams using Mermaid",
          "Address all requirements from the previous phase",
          "Define clear component interfaces",
          "Consider error handling strategies",
        ];

      case SpecPhase.TASKS:
        return [
          "Break down work into 1-2 hour tasks",
          "Reference specific requirements in each task",
          "Order tasks to build incrementally",
          "Include testing tasks alongside implementation",
        ];

      case SpecPhase.EXECUTION:
        return [
          "Focus on one task at a time",
          "Test functionality as you implement",
          "Mark tasks complete when finished",
          "Commit changes frequently",
        ];

      default:
        return [];
    }
  }
}
