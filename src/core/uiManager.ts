import * as vscode from "vscode";
import { WorkflowManager, SpecPhase, TaskItem } from "./workflowManager";
import { NotificationManager } from "./notificationManager";

export interface SpecTreeItem extends vscode.TreeItem {
  contextValue?: string;
  task?: TaskItem;
}

/**
 * Consolidated UI Manager
 * Combines functionality from multiple panel providers
 * Addresses requirements 1.2, 1.3, 1.4
 */
export class UIManager implements vscode.TreeDataProvider<SpecTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    SpecTreeItem | undefined | null | void
  > = new vscode.EventEmitter<SpecTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    SpecTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private statusBarItem: vscode.StatusBarItem;

  constructor(
    private workflowManager: WorkflowManager,
    private notificationManager: NotificationManager
  ) {
    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = "workbench.view.extension.spec-container";
    this.updateStatusBar();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
    this.updateStatusBar();
  }

  getTreeItem(element: SpecTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SpecTreeItem): Promise<SpecTreeItem[]> {
    if (!element) {
      return this.getRootItems();
    }
    return [];
  }

  private async getRootItems(): Promise<SpecTreeItem[]> {
    const items: SpecTreeItem[] = [];
    const isActive = this.workflowManager.isActive();

    if (!isActive) {
      return this.getWelcomeItems();
    }

    const currentPhase = this.workflowManager.getCurrentPhase();
    const currentFeature = this.workflowManager.getCurrentFeature();

    // Feature header
    items.push(this.createFeatureHeader(currentFeature));

    // Phase indicator
    items.push(this.createPhaseIndicator(currentPhase));

    // Separator
    items.push(this.createSeparator());

    // Phase-specific content
    switch (currentPhase) {
      case SpecPhase.REQUIREMENTS:
        items.push(...(await this.getRequirementsItems()));
        break;
      case SpecPhase.DESIGN:
        items.push(...(await this.getDesignItems()));
        break;
      case SpecPhase.TASKS:
        items.push(...(await this.getTasksItems()));
        break;
      case SpecPhase.EXECUTION:
        items.push(...(await this.getExecutionItems()));
        break;
    }

    // Common actions
    items.push(this.createSeparator());
    items.push(...this.getCommonActions());

    // Phase hints
    items.push(this.createSeparator());
    items.push(...this.getPhaseHints(currentPhase));

    return items;
  }

  private getWelcomeItems(): SpecTreeItem[] {
    return [
      {
        label: "🚀 Start Your First Spec",
        description: "Click to begin spec-driven development",
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: "start-hint",
        command: {
          command: "specMode.start",
          title: "Start Spec Mode",
        },
        tooltip:
          "Create a new feature specification following the structured workflow process",
      },
      {
        label: "💡 What is Spec Mode?",
        description:
          "Structured workflow: Requirements → Design → Tasks → Code",
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: "info",
        tooltip:
          "A systematic approach to feature development that ensures thorough planning before implementation",
      },
      {
        label: "🤖 Works with GitHub Copilot",
        description: "Get context-aware prompts for each phase",
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: "info",
        tooltip:
          "Automatically generates contextual prompts that help Copilot understand your feature requirements and design",
      },
    ];
  }

  private createFeatureHeader(featureName: string): SpecTreeItem {
    const displayName =
      featureName.length > 30
        ? featureName.substring(0, 27) + "..."
        : featureName;
    return {
      label: `📋 ${displayName}`,
      description: "Current feature in development",
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: "feature-header",
      tooltip: `Full feature name: ${featureName}`,
    };
  }

  private createPhaseIndicator(phase: SpecPhase): SpecTreeItem {
    const phaseEmoji = this.getPhaseEmoji(phase);
    const phaseProgress = this.getPhaseProgress(phase);
    const phaseName = phase.charAt(0).toUpperCase() + phase.slice(1);
    const phaseDescription = this.getPhaseDescription(phase);

    return {
      label: `${phaseEmoji} ${phaseName} Phase`,
      description: `${phaseProgress} - ${phaseDescription}`,
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: "phase-indicator",
      tooltip: `Current phase: ${phaseName}. Progress: ${phaseProgress}. ${phaseDescription}`,
    };
  }

  private async getRequirementsItems(): Promise<SpecTreeItem[]> {
    const items: SpecTreeItem[] = [];
    const specFiles = await this.workflowManager.getSpecFiles();
    const hasRequirements = specFiles.some(
      (f) => f.name === "requirements.md" && f.exists
    );

    if (!hasRequirements) {
      items.push({
        label: "📝 Create Requirements",
        description: "Start by defining user stories and acceptance criteria",
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: "create-requirements",
        command: {
          command: "specMode.copyPrompts",
          title: "Copy Requirements Prompt",
        },
        tooltip:
          "Create a requirements document with user stories and EARS format acceptance criteria",
      });
    } else {
      items.push({
        label: "✅ Requirements Created",
        description: "Review and refine your requirements",
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: "requirements-done",
        tooltip:
          "Requirements document exists. Review and refine before moving to design phase.",
      });
    }

    items.push({
      label: "➡️ Move to Design Phase",
      description: "Ready to create technical design",
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: "next-phase",
      command: {
        command: "specMode.nextPhase",
        title: "Next Phase",
      },
      tooltip: "Advance to the design phase to create technical architecture",
    });

    return items;
  }

  private async getDesignItems(): Promise<SpecTreeItem[]> {
    const items: SpecTreeItem[] = [];
    const specFiles = await this.workflowManager.getSpecFiles();
    const hasDesign = specFiles.some((f) => f.name === "design.md" && f.exists);

    if (!hasDesign) {
      items.push({
        label: "🎨 Create Design",
        description: "Define architecture and technical approach",
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: "create-design",
        command: {
          command: "specMode.copyPrompts",
          title: "Copy Design Prompt",
        },
        tooltip:
          "Create a design document with architecture, components, and technical details",
      });
    } else {
      items.push({
        label: "✅ Design Created",
        description: "Review and refine your technical design",
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: "design-done",
        tooltip:
          "Design document exists. Review and refine before moving to tasks phase.",
      });
    }

    items.push({
      label: "➡️ Move to Tasks Phase",
      description: "Ready to break down into implementation tasks",
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: "next-phase",
      command: {
        command: "specMode.nextPhase",
        title: "Next Phase",
      },
      tooltip: "Advance to the tasks phase to create implementation plan",
    });

    return items;
  }

  private async getTasksItems(): Promise<SpecTreeItem[]> {
    const items: SpecTreeItem[] = [];
    const specFiles = await this.workflowManager.getSpecFiles();
    const hasTasks = specFiles.some((f) => f.name === "tasks.md" && f.exists);

    if (!hasTasks) {
      items.push({
        label: "📋 Create Task List",
        description: "Break down design into actionable tasks",
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: "create-tasks",
        command: {
          command: "specMode.copyPrompts",
          title: "Copy Tasks Prompt",
        },
        tooltip:
          "Create a task list with specific, actionable implementation steps",
      });
    } else {
      items.push({
        label: "✅ Tasks Created",
        description: "Review and refine your implementation plan",
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: "tasks-done",
        tooltip:
          "Tasks document exists. Review and refine before moving to execution phase.",
      });
    }

    items.push({
      label: "➡️ Move to Execution Phase",
      description: "Ready to start implementing tasks",
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: "next-phase",
      command: {
        command: "specMode.nextPhase",
        title: "Next Phase",
      },
      tooltip: "Advance to the execution phase to start implementing tasks",
    });

    return items;
  }

  private async getExecutionItems(): Promise<SpecTreeItem[]> {
    const items: SpecTreeItem[] = [];
    const tasks = await this.workflowManager.getTasks();
    const completedTasks = tasks.filter((t) => t.completed).length;

    // Progress indicator
    items.push(this.createProgressItem(completedTasks, tasks.length));

    // Task list
    if (tasks.length > 0) {
      items.push({
        label: "📋 Implementation Tasks",
        description: `${completedTasks}/${tasks.length} completed`,
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: "section-header",
        tooltip: `Task progress: ${completedTasks} out of ${tasks.length} tasks completed`,
      });

      // Show first few incomplete tasks
      const incompleteTasks = tasks.filter((t) => !t.completed).slice(0, 5);
      for (const task of incompleteTasks) {
        items.push({
          label: `⏳ ${task.title}`,
          description: "Ready to execute",
          collapsibleState: vscode.TreeItemCollapsibleState.None,
          contextValue: "task-incomplete",
          task: task,
          command: {
            command: "specMode.executeTask",
            title: "Execute Task",
            arguments: [{ task }],
          },
          tooltip: `Task: ${task.title}. Requirements: ${
            task.requirements.join(", ") || "None"
          }`,
        });
      }

      // Show completed tasks count if any
      if (completedTasks > 0) {
        items.push({
          label: `✅ ${completedTasks} tasks completed`,
          description: "Great progress!",
          collapsibleState: vscode.TreeItemCollapsibleState.None,
          contextValue: "progress-info",
          tooltip: `You have completed ${completedTasks} out of ${tasks.length} tasks`,
        });
      }
    } else {
      items.push({
        label: "⚠️ No tasks found",
        description: "Complete the Tasks phase first",
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: "warning",
        tooltip:
          "No implementation tasks found. Go back to the Tasks phase to create your implementation plan.",
      });
    }

    return items;
  }

  private getCommonActions(): SpecTreeItem[] {
    return [
      {
        label: "📋 Copy Prompts",
        description: "Choose from available prompts with preview",
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: "copy-prompts",
        command: {
          command: "specMode.copyPrompts",
          title: "Copy Prompts",
        },
        tooltip:
          "Access enhanced clipboard functionality with prompt preview and multiple options",
      },
      {
        label: "💡 Get Guidance",
        description: "Show contextual help and next steps",
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: "show-guidance",
        command: {
          command: "specMode.showGuidance",
          title: "Show Guidance",
        },
        tooltip:
          "Get personalized guidance based on your current phase and progress",
      },
      {
        label: "🔄 Refresh",
        description: "Update the spec view",
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: "refresh",
        command: {
          command: "specMode.refresh",
          title: "Refresh",
        },
        tooltip: "Refresh the spec view to show latest changes",
      },
    ];
  }

  private getPhaseHints(phase: SpecPhase): SpecTreeItem[] {
    const hints: SpecTreeItem[] = [];

    switch (phase) {
      case SpecPhase.REQUIREMENTS:
        hints.push(
          {
            label: "💡 Focus on user needs",
            description:
              'Write clear user stories with "As a... I want... So that..."',
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: "hint",
            tooltip:
              'User stories should follow the format: "As a [role], I want [feature], so that [benefit]". This helps ensure you\'re building features that provide real value to users.',
          },
          {
            label: "💡 Use EARS format",
            description: "WHEN [event] THEN [system] SHALL [response]",
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: "hint",
            tooltip:
              'EARS (Easy Approach to Requirements Syntax) helps write clear, testable requirements. Example: "WHEN a user clicks submit THEN the system SHALL validate all required fields".',
          }
        );
        break;

      case SpecPhase.DESIGN:
        hints.push(
          {
            label: "💡 Think architecture",
            description: "Consider components, data flow, and interfaces",
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: "hint",
            tooltip:
              "Good design considers: What are the main components? How do they communicate? What are the key interfaces? How does data flow through the system?",
          },
          {
            label: "💡 Address all requirements",
            description: "Ensure your design covers every requirement",
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: "hint",
            tooltip:
              "Review each requirement from the previous phase and ensure your design addresses it. This prevents gaps in implementation.",
          }
        );
        break;

      case SpecPhase.TASKS:
        hints.push(
          {
            label: "💡 Small, actionable tasks",
            description: "Each task should be completable in one session",
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: "hint",
            tooltip:
              "Break down complex features into small, focused tasks. Each task should be something you can complete in 1-2 hours and should result in working, testable code.",
          },
          {
            label: "💡 Reference requirements",
            description: "Link tasks back to specific requirements",
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: "hint",
            tooltip:
              "Each task should reference which requirements it addresses. This ensures complete coverage and helps with testing and validation.",
          }
        );
        break;

      case SpecPhase.EXECUTION:
        hints.push(
          {
            label: "💡 One task at a time",
            description: "Focus on completing each task fully",
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: "hint",
            tooltip:
              "Complete each task fully before moving to the next. This includes writing code, tests, and verifying the functionality works as expected.",
          },
          {
            label: "💡 Test as you go",
            description: "Write tests and verify functionality",
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: "hint",
            tooltip:
              "Write tests for each piece of functionality as you implement it. This ensures your code works correctly and makes future changes safer.",
          }
        );
        break;
    }

    return hints;
  }

  private createSeparator(): SpecTreeItem {
    return {
      label: "─────────────────────",
      description: "",
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: "separator",
    };
  }

  private createProgressItem(completed: number, total: number): SpecTreeItem {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const progressBar = this.createProgressBar(percentage);

    return {
      label: `${progressBar} Overall Progress`,
      description: `${completed}/${total} completed (${percentage}%)`,
      collapsibleState: vscode.TreeItemCollapsibleState.None,
      contextValue: "progress",
      tooltip: `Progress: ${completed} out of ${total} items completed. ${percentage}% complete.`,
    };
  }

  private createProgressBar(percentage: number): string {
    const barLength = 10;
    const filledLength = Math.round((percentage / 100) * barLength);
    const filled = "█".repeat(filledLength);
    const empty = "░".repeat(barLength - filledLength);
    return `[${filled}${empty}]`;
  }

  private getPhaseEmoji(phase: SpecPhase): string {
    switch (phase) {
      case SpecPhase.REQUIREMENTS:
        return "📝";
      case SpecPhase.DESIGN:
        return "🎨";
      case SpecPhase.TASKS:
        return "📋";
      case SpecPhase.EXECUTION:
        return "⚡";
      default:
        return "📄";
    }
  }

  private getPhaseProgress(phase: SpecPhase): string {
    switch (phase) {
      case SpecPhase.REQUIREMENTS:
        return "1/4";
      case SpecPhase.DESIGN:
        return "2/4";
      case SpecPhase.TASKS:
        return "3/4";
      case SpecPhase.EXECUTION:
        return "4/4";
      default:
        return "0/4";
    }
  }

  private getPhaseDescription(phase: SpecPhase): string {
    switch (phase) {
      case SpecPhase.REQUIREMENTS:
        return "Define user stories and acceptance criteria";
      case SpecPhase.DESIGN:
        return "Create architecture and technical design";
      case SpecPhase.TASKS:
        return "Break down into implementation tasks";
      case SpecPhase.EXECUTION:
        return "Execute tasks with Copilot assistance";
      default:
        return "";
    }
  }

  private updateStatusBar(): void {
    if (this.workflowManager.isActive()) {
      const currentPhase = this.workflowManager.getCurrentPhase();
      const phaseEmoji = this.getPhaseEmoji(currentPhase);
      this.statusBarItem.text = `${phaseEmoji} Spec: ${this.workflowManager.getCurrentFeature()}`;
      this.statusBarItem.tooltip = `Spec Mode Active - ${this.workflowManager.getProgressSummary()}\nCurrent Phase: ${currentPhase}\nClick for guidance`;
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.prominentBackground"
      );
      this.statusBarItem.show();
    } else {
      this.statusBarItem.text = "$(notebook) Start Spec";
      this.statusBarItem.tooltip = "Click to start spec-driven development";
      this.statusBarItem.backgroundColor = undefined;
      this.statusBarItem.show();
    }
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
