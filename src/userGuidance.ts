import * as vscode from "vscode";
import { SpecPhase } from "./specWorkflowManager";

export interface GuidanceStep {
  id: string;
  title: string;
  description: string;
  action?: vscode.Command;
  priority: "high" | "medium" | "low";
  category: "next-step" | "suggestion" | "warning" | "tip";
}

export interface ContextualHelp {
  phase: SpecPhase;
  steps: GuidanceStep[];
  tips: string[];
  commonIssues: Array<{
    issue: string;
    solution: string;
    action?: vscode.Command;
  }>;
}

export class UserGuidanceProvider {
  private static readonly GUIDANCE_CACHE = new Map<string, ContextualHelp>();
  private static readonly TIP_DISPLAY_INTERVAL = 30000; // 30 seconds
  private static lastTipTime = 0;

  /**
   * Get contextual guidance for current phase and state
   * Addresses requirement 2.1, 2.2, 2.4
   */
  static async getContextualGuidance(
    phase: SpecPhase,
    context: {
      featureName?: string;
      hasFiles?: boolean;
      validationErrors?: string[];
      completedTasks?: number;
      totalTasks?: number;
    }
  ): Promise<ContextualHelp> {
    const cacheKey = `${phase}-${JSON.stringify(context)}`;

    if (this.GUIDANCE_CACHE.has(cacheKey)) {
      return this.GUIDANCE_CACHE.get(cacheKey)!;
    }

    const guidance = await this.generateGuidance(phase, context);
    this.GUIDANCE_CACHE.set(cacheKey, guidance);

    // Clear cache after 5 minutes to ensure fresh guidance
    setTimeout(() => {
      this.GUIDANCE_CACHE.delete(cacheKey);
    }, 300000);

    return guidance;
  }

  /**
   * Generate phase-specific guidance
   */
  private static async generateGuidance(
    phase: SpecPhase,
    context: any
  ): Promise<ContextualHelp> {
    switch (phase) {
      case SpecPhase.REQUIREMENTS:
        return this.getRequirementsGuidance(context);
      case SpecPhase.DESIGN:
        return this.getDesignGuidance(context);
      case SpecPhase.TASKS:
        return this.getTasksGuidance(context);
      case SpecPhase.EXECUTION:
        return this.getExecutionGuidance(context);
      default:
        return this.getDefaultGuidance(context);
    }
  }

  /**
   * Requirements phase guidance
   */
  private static getRequirementsGuidance(context: any): ContextualHelp {
    const steps: GuidanceStep[] = [];
    const tips = [
      "Start with user stories: 'As a [role], I want [feature], so that [benefit]'",
      "Use EARS format for acceptance criteria: 'WHEN [event] THEN [system] SHALL [response]'",
      "Consider edge cases and error scenarios early",
      "Think about different user types and their needs",
    ];

    // Next steps based on context
    if (!context.hasFiles) {
      steps.push({
        id: "create-requirements",
        title: "Create Requirements Document",
        description:
          "Start by copying the requirements prompt and working with Copilot",
        action: {
          command: "specMode.copyPrompts",
          title: "Copy Requirements Prompt",
        },
        priority: "high",
        category: "next-step",
      });
    } else {
      steps.push({
        id: "review-requirements",
        title: "Review and Refine Requirements",
        description: "Ensure all user stories have clear acceptance criteria",
        priority: "high",
        category: "next-step",
      });
    }

    // Validation-based guidance
    if (context.validationErrors?.length > 0) {
      steps.push({
        id: "fix-validation",
        title: "Fix Validation Issues",
        description: `Resolve ${context.validationErrors.length} validation issues before proceeding`,
        priority: "high",
        category: "warning",
      });
    }

    // Suggestions
    steps.push(
      {
        id: "add-user-stories",
        title: "Add More User Stories",
        description: "Consider different user roles and scenarios",
        priority: "medium",
        category: "suggestion",
      },
      {
        id: "review-acceptance-criteria",
        title: "Review Acceptance Criteria",
        description: "Ensure each story has testable acceptance criteria",
        priority: "medium",
        category: "suggestion",
      }
    );

    return {
      phase: SpecPhase.REQUIREMENTS,
      steps,
      tips,
      commonIssues: [
        {
          issue: "Requirements are too vague",
          solution: "Add specific acceptance criteria using EARS format",
          action: {
            command: "workbench.action.openSettings",
            title: "View EARS Examples",
            arguments: ["@ext:spec-driven-development"],
          },
        },
        {
          issue: "Missing user stories",
          solution: "Identify different user roles and their needs",
        },
        {
          issue: "No edge cases considered",
          solution: "Think about error scenarios and boundary conditions",
        },
      ],
    };
  }

  /**
   * Design phase guidance
   */
  private static getDesignGuidance(context: any): ContextualHelp {
    const steps: GuidanceStep[] = [];
    const tips = [
      "Start with high-level architecture before diving into details",
      "Consider data flow and component interactions",
      "Include error handling and edge cases in your design",
      "Think about testing strategy early",
    ];

    if (!context.hasFiles) {
      steps.push({
        id: "create-design",
        title: "Create Design Document",
        description:
          "Copy the design prompt and create your technical architecture",
        action: {
          command: "specMode.copyPrompts",
          title: "Copy Design Prompt",
        },
        priority: "high",
        category: "next-step",
      });
    } else {
      steps.push({
        id: "refine-design",
        title: "Refine Architecture",
        description: "Ensure all requirements are addressed in the design",
        priority: "high",
        category: "next-step",
      });
    }

    steps.push(
      {
        id: "add-diagrams",
        title: "Add Architecture Diagrams",
        description: "Use Mermaid diagrams to visualize your architecture",
        priority: "medium",
        category: "suggestion",
      },
      {
        id: "review-components",
        title: "Review Component Design",
        description: "Ensure components have clear responsibilities",
        priority: "medium",
        category: "suggestion",
      }
    );

    return {
      phase: SpecPhase.DESIGN,
      steps,
      tips,
      commonIssues: [
        {
          issue: "Design doesn't address all requirements",
          solution: "Review requirements document and ensure each is covered",
        },
        {
          issue: "Architecture is too complex",
          solution: "Break down into smaller, focused components",
        },
        {
          issue: "Missing error handling design",
          solution: "Add error handling and recovery strategies",
        },
      ],
    };
  }

  /**
   * Tasks phase guidance
   */
  private static getTasksGuidance(context: any): ContextualHelp {
    const steps: GuidanceStep[] = [];
    const tips = [
      "Break down complex features into small, manageable tasks",
      "Each task should be completable in 1-2 hours",
      "Reference specific requirements in each task",
      "Order tasks to build incrementally",
    ];

    if (!context.hasFiles) {
      steps.push({
        id: "create-tasks",
        title: "Create Task List",
        description:
          "Break down your design into actionable implementation tasks",
        action: {
          command: "specMode.copyPrompts",
          title: "Copy Tasks Prompt",
        },
        priority: "high",
        category: "next-step",
      });
    } else {
      steps.push({
        id: "review-tasks",
        title: "Review Task Breakdown",
        description: "Ensure tasks are small and well-ordered",
        priority: "high",
        category: "next-step",
      });
    }

    steps.push(
      {
        id: "add-tests",
        title: "Add Testing Tasks",
        description: "Include unit and integration testing tasks",
        priority: "medium",
        category: "suggestion",
      },
      {
        id: "check-dependencies",
        title: "Check Task Dependencies",
        description: "Ensure tasks are ordered correctly",
        priority: "medium",
        category: "suggestion",
      }
    );

    return {
      phase: SpecPhase.TASKS,
      steps,
      tips,
      commonIssues: [
        {
          issue: "Tasks are too large",
          solution: "Break down large tasks into smaller sub-tasks",
        },
        {
          issue: "Missing requirement references",
          solution: "Add requirement references to each task",
        },
        {
          issue: "Poor task ordering",
          solution: "Reorder tasks to build incrementally",
        },
      ],
    };
  }

  /**
   * Execution phase guidance
   */
  private static getExecutionGuidance(context: any): ContextualHelp {
    const steps: GuidanceStep[] = [];
    const tips = [
      "Focus on one task at a time",
      "Test each piece of functionality as you build it",
      "Commit your work frequently",
      "Ask for help if you get stuck on a task",
    ];

    const { completedTasks = 0, totalTasks = 0 } = context;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    if (completedTasks === 0) {
      steps.push({
        id: "start-first-task",
        title: "Start Your First Task",
        description: "Begin with the first task in your implementation plan",
        priority: "high",
        category: "next-step",
      });
    } else if (completedTasks < totalTasks) {
      steps.push({
        id: "continue-tasks",
        title: "Continue Implementation",
        description: `${completedTasks}/${totalTasks} tasks completed (${Math.round(
          progress
        )}%)`,
        priority: "high",
        category: "next-step",
      });
    } else {
      steps.push({
        id: "review-completion",
        title: "Review Completed Feature",
        description: "All tasks completed! Review and test your implementation",
        priority: "high",
        category: "next-step",
      });
    }

    steps.push(
      {
        id: "run-tests",
        title: "Run Tests",
        description: "Verify your implementation works correctly",
        priority: "medium",
        category: "suggestion",
      },
      {
        id: "update-documentation",
        title: "Update Documentation",
        description: "Document any changes or new functionality",
        priority: "low",
        category: "suggestion",
      }
    );

    return {
      phase: SpecPhase.EXECUTION,
      steps,
      tips,
      commonIssues: [
        {
          issue: "Task is too complex",
          solution: "Break it down into smaller steps or ask for help",
        },
        {
          issue: "Tests are failing",
          solution: "Review the requirements and fix the implementation",
        },
        {
          issue: "Stuck on implementation",
          solution: "Review the design document or ask Copilot for help",
        },
      ],
    };
  }

  /**
   * Default guidance for unknown states
   */
  private static getDefaultGuidance(context: any): ContextualHelp {
    return {
      phase: SpecPhase.REQUIREMENTS,
      steps: [
        {
          id: "start-spec",
          title: "Start a New Spec",
          description: "Begin by creating a new feature specification",
          action: {
            command: "specMode.start",
            title: "Start Spec Mode",
          },
          priority: "high",
          category: "next-step",
        },
      ],
      tips: [
        "Spec-driven development helps you plan before coding",
        "Each phase builds on the previous one",
        "Use Copilot integration for better results",
      ],
      commonIssues: [],
    };
  }

  /**
   * Show contextual guidance in the UI
   * Addresses requirement 2.2, 2.4
   */
  static async showGuidance(guidance: ContextualHelp): Promise<void> {
    const nextSteps = guidance.steps.filter((s) => s.category === "next-step");
    const warnings = guidance.steps.filter((s) => s.category === "warning");

    // Show warnings first
    if (warnings.length > 0) {
      const warning = warnings[0];
      const action = await vscode.window.showWarningMessage(
        warning.title,
        { detail: warning.description },
        "Fix Now",
        "Show All Issues",
        "Dismiss"
      );

      if (action === "Fix Now" && warning.action) {
        await vscode.commands.executeCommand(
          warning.action.command,
          ...(warning.action.arguments || [])
        );
      } else if (action === "Show All Issues") {
        await this.showAllIssues(warnings);
      }
      return;
    }

    // Show next steps
    if (nextSteps.length > 0) {
      const nextStep = nextSteps[0];
      const action = await vscode.window.showInformationMessage(
        `Next: ${nextStep.title}`,
        { detail: nextStep.description },
        "Do It",
        "Show Tips",
        "Dismiss"
      );

      if (action === "Do It" && nextStep.action) {
        await vscode.commands.executeCommand(
          nextStep.action.command,
          ...(nextStep.action.arguments || [])
        );
      } else if (action === "Show Tips") {
        await this.showTips(guidance.tips);
      }
    }
  }

  /**
   * Show all validation issues
   */
  private static async showAllIssues(issues: GuidanceStep[]): Promise<void> {
    const content = `# Validation Issues

${issues
  .map(
    (issue, index) => `## ${index + 1}. ${issue.title}

${issue.description}

${issue.action ? `**Action:** ${issue.action.title}` : ""}
`
  )
  .join("\n")}

---
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
        `Failed to show issues: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Show helpful tips
   */
  private static async showTips(tips: string[]): Promise<void> {
    const items = tips.map((tip) => ({
      label: "💡 " + tip.substring(0, 50) + (tip.length > 50 ? "..." : ""),
      detail: tip,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: "Select a tip to learn more",
      matchOnDetail: true,
    });

    if (selected) {
      vscode.window.showInformationMessage(selected.detail);
    }
  }

  /**
   * Show periodic helpful tips
   * Addresses requirement 2.4
   */
  static showPeriodicTip(phase: SpecPhase): void {
    const now = Date.now();
    if (now - this.lastTipTime < this.TIP_DISPLAY_INTERVAL) {
      return;
    }

    this.lastTipTime = now;

    const tips = this.getPhaseTips(phase);
    if (tips.length === 0) return;

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    vscode.window
      .showInformationMessage(`💡 Tip: ${randomTip}`, "More Tips", "Dismiss")
      .then((action) => {
        if (action === "More Tips") {
          this.showTips(tips);
        }
      });
  }

  /**
   * Get phase-specific tips
   */
  private static getPhaseTips(phase: SpecPhase): string[] {
    const allTips = {
      [SpecPhase.REQUIREMENTS]: [
        "Start with user stories to understand the 'why' behind features",
        "Use EARS format for clear, testable acceptance criteria",
        "Consider different user roles and their specific needs",
        "Think about edge cases and error scenarios early",
      ],
      [SpecPhase.DESIGN]: [
        "Begin with high-level architecture before diving into details",
        "Use Mermaid diagrams to visualize complex relationships",
        "Consider how components will communicate with each other",
        "Plan for error handling and recovery strategies",
      ],
      [SpecPhase.TASKS]: [
        "Break down complex features into 1-2 hour tasks",
        "Reference specific requirements in each task",
        "Order tasks to build functionality incrementally",
        "Include testing tasks alongside implementation tasks",
      ],
      [SpecPhase.EXECUTION]: [
        "Focus on completing one task at a time",
        "Test your code as you write it",
        "Commit your work frequently with clear messages",
        "Don't hesitate to ask Copilot for help with implementation",
      ],
    };

    return allTips[phase] || [];
  }

  /**
   * Validate user input and provide guidance
   * Addresses requirement 2.4
   */
  static validateInput(
    input: string,
    context: string
  ): {
    isValid: boolean;
    message?: string;
    suggestions?: string[];
  } {
    if (!input || input.trim().length === 0) {
      return {
        isValid: false,
        message: "Input cannot be empty",
        suggestions: ["Please provide a meaningful description"],
      };
    }

    if (context === "feature-name" && input.length < 3) {
      return {
        isValid: false,
        message: "Feature name is too short",
        suggestions: [
          "Use at least 3 characters",
          "Be descriptive about what the feature does",
          "Use kebab-case format (e.g., 'user-authentication')",
        ],
      };
    }

    if (context === "feature-description" && input.length < 10) {
      return {
        isValid: false,
        message: "Description is too brief",
        suggestions: [
          "Provide more details about what you want to build",
          "Explain the problem you're trying to solve",
          "Mention who will use this feature",
        ],
      };
    }

    return { isValid: true };
  }

  /**
   * Get progress-based encouragement messages
   */
  static getProgressEncouragement(
    completedTasks: number,
    totalTasks: number
  ): string {
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    if (progress === 0) {
      return "🚀 Ready to start implementation! Take it one task at a time.";
    } else if (progress < 25) {
      return "🌱 Great start! You're building momentum.";
    } else if (progress < 50) {
      return "💪 You're making solid progress! Keep going.";
    } else if (progress < 75) {
      return "🔥 More than halfway there! You're doing great.";
    } else if (progress < 100) {
      return "🏃‍♂️ Almost finished! The final stretch is always the most rewarding.";
    } else {
      return "🎉 Congratulations! You've completed all tasks. Time to celebrate!";
    }
  }
}
