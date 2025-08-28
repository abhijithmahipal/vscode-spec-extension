import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { TaskItem } from "./specWorkflowManager";

export interface TaskWithDependencies extends TaskItem {
  dependencies: string[];
  estimatedDuration?: number;
  complexity?: TaskComplexity;
  contextFiles?: string[];
  parentTaskId?: string;
  subTasks?: string[];
  progress?: number; // 0-100
  lastModified?: Date;
  notes?: string;
}

export enum TaskComplexity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum TaskStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  BLOCKED = "blocked",
}

export interface TaskProgress {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  percentage: number;
}

export interface TaskExecutionContext {
  task: TaskWithDependencies;
  availablePrompts: string[];
  nextSteps: string[];
  contextualHelp: string;
  dependencyStatus: DependencyStatus;
}

export interface DependencyStatus {
  canExecute: boolean;
  blockedBy: string[];
  enables: string[];
}

/**
 * Enhanced Task Management System
 * Addresses requirements 5.1, 5.2, 5.3, 5.5
 */
export class TaskManager {
  private tasks: Map<string, TaskWithDependencies> = new Map();
  private taskStatusChangeEmitter = new vscode.EventEmitter<{
    taskId: string;
    oldStatus: TaskStatus;
    newStatus: TaskStatus;
  }>();

  public readonly onTaskStatusChanged = this.taskStatusChangeEmitter.event;

  constructor(private specPath: string) {}

  /**
   * Load and parse tasks from markdown file with enhanced parsing
   * Requirement 5.1: Clear progress indicators and task status
   */
  async loadTasks(): Promise<TaskWithDependencies[]> {
    const tasksFile = path.join(this.specPath, "tasks.md");
    if (!fs.existsSync(tasksFile)) {
      return [];
    }

    const content = fs.readFileSync(tasksFile, "utf8");
    const parsedTasks = this.parseTasksWithDependencies(content);

    // Update internal task map
    this.tasks.clear();
    parsedTasks.forEach((task) => {
      this.tasks.set(task.id, task);
    });

    return parsedTasks;
  }

  /**
   * Parse tasks with enhanced metadata and dependency tracking
   */
  private parseTasksWithDependencies(content: string): TaskWithDependencies[] {
    const tasks: TaskWithDependencies[] = [];
    const lines = content.split("\n");
    let currentParentId: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match main tasks: - [x] 1. Task title
      const mainTaskMatch = line.match(/^- \[([ x])\] (\d+)\. (.+)/);
      if (mainTaskMatch) {
        const completed = mainTaskMatch[1] === "x";
        const taskNumber = mainTaskMatch[2];
        const title = mainTaskMatch[3];
        const taskId = `task-${taskNumber}`;

        // Parse additional metadata from following lines
        const metadata = this.parseTaskMetadata(lines, i + 1);

        const task: TaskWithDependencies = {
          id: taskId,
          title,
          completed,
          requirements: metadata.requirements,
          dependencies: metadata.dependencies,
          estimatedDuration: metadata.estimatedDuration,
          complexity: metadata.complexity,
          contextFiles: metadata.contextFiles,
          subTasks: [],
          progress: completed ? 100 : 0,
          lastModified: new Date(),
          notes: metadata.notes,
        };

        tasks.push(task);
        currentParentId = taskId;
      }

      // Match sub-tasks: - [x] 1.1 Sub-task title
      const subTaskMatch = line.match(/^- \[([ x])\] (\d+\.\d+) (.+)/);
      if (subTaskMatch && currentParentId) {
        const completed = subTaskMatch[1] === "x";
        const taskNumber = subTaskMatch[2];
        const title = subTaskMatch[3];
        const taskId = `task-${taskNumber}`;

        const metadata = this.parseTaskMetadata(lines, i + 1);

        const subTask: TaskWithDependencies = {
          id: taskId,
          title,
          completed,
          requirements: metadata.requirements,
          dependencies: metadata.dependencies,
          parentTaskId: currentParentId,
          estimatedDuration: metadata.estimatedDuration,
          complexity: metadata.complexity,
          contextFiles: metadata.contextFiles,
          subTasks: [],
          progress: completed ? 100 : 0,
          lastModified: new Date(),
          notes: metadata.notes,
        };

        tasks.push(subTask);

        // Add to parent's sub-tasks
        const parentTask = tasks.find((t) => t.id === currentParentId);
        if (parentTask) {
          parentTask.subTasks!.push(taskId);
        }
      }
    }

    return tasks;
  }

  /**
   * Parse task metadata from following lines
   */
  private parseTaskMetadata(
    lines: string[],
    startIndex: number
  ): {
    requirements: string[];
    dependencies: string[];
    estimatedDuration?: number;
    complexity?: TaskComplexity;
    contextFiles?: string[];
    notes?: string;
  } {
    const metadata = {
      requirements: [] as string[],
      dependencies: [] as string[],
      contextFiles: [] as string[],
    };

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();

      // Stop at next task or empty line
      if (line.startsWith("- [") || line === "") {
        break;
      }

      // Parse requirements: _Requirements: 1.1, 2.3_
      const reqMatch = line.match(/_Requirements: ([^_]+)_/);
      if (reqMatch) {
        metadata.requirements = reqMatch[1].split(",").map((r) => r.trim());
      }

      // Parse dependencies: _Depends on: task-1, task-2_
      const depMatch = line.match(/_Depends on: ([^_]+)_/);
      if (depMatch) {
        metadata.dependencies = depMatch[1].split(",").map((d) => d.trim());
      }

      // Parse context files: _Context: file1.ts, file2.ts_
      const contextMatch = line.match(/_Context: ([^_]+)_/);
      if (contextMatch) {
        metadata.contextFiles = contextMatch[1].split(",").map((f) => f.trim());
      }
    }

    return metadata;
  }

  /**
   * Get comprehensive task progress information
   * Requirement 5.1: Clear progress indicators and task status
   */
  getTaskProgress(): TaskProgress {
    const allTasks = Array.from(this.tasks.values());
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.completed).length;
    const inProgressTasks = allTasks.filter(
      (t) => !t.completed && t.progress && t.progress > 0
    ).length;
    const blockedTasks = allTasks.filter(
      (t) => !this.canExecuteTask(t.id)
    ).length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      percentage:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }

  /**
   * Get task execution context with prompts and next steps
   * Requirement 5.2: Contextual prompts and clear next steps
   */
  getTaskExecutionContext(taskId: string): TaskExecutionContext | null {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    const dependencyStatus = this.getDependencyStatus(taskId);
    const availablePrompts = this.generateContextualPrompts(task);
    const nextSteps = this.generateNextSteps(task, dependencyStatus);
    const contextualHelp = this.generateContextualHelp(task);

    return {
      task,
      availablePrompts,
      nextSteps,
      contextualHelp,
      dependencyStatus,
    };
  }

  /**
   * Check if a task can be executed based on dependencies
   * Requirement 5.4: Task dependency visualization (mentioned in design)
   */
  canExecuteTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    // Check if all dependencies are completed
    for (const depId of task.dependencies) {
      const dependency = this.tasks.get(depId);
      if (!dependency || !dependency.completed) {
        return false;
      }
    }

    // Check if parent task allows execution
    if (task.parentTaskId) {
      const parentTask = this.tasks.get(task.parentTaskId);
      if (parentTask && !parentTask.completed) {
        // Allow sub-task execution if parent is not completed but dependencies are met
        return (
          task.dependencies.length === 0 ||
          task.dependencies.every((depId) => {
            const dep = this.tasks.get(depId);
            return dep && dep.completed;
          })
        );
      }
    }

    return true;
  }

  /**
   * Get dependency status for a task
   */
  private getDependencyStatus(taskId: string): DependencyStatus {
    const task = this.tasks.get(taskId);
    if (!task) {
      return { canExecute: false, blockedBy: [], enables: [] };
    }

    const blockedBy = task.dependencies.filter((depId) => {
      const dep = this.tasks.get(depId);
      return !dep || !dep.completed;
    });

    const enables = Array.from(this.tasks.values())
      .filter((t) => t.dependencies.includes(taskId))
      .map((t) => t.id);

    return {
      canExecute: blockedBy.length === 0,
      blockedBy,
      enables,
    };
  }

  /**
   * Generate contextual prompts for task execution
   * Requirement 5.2: Contextual prompts and clear next steps
   */
  private generateContextualPrompts(task: TaskWithDependencies): string[] {
    const prompts: string[] = [];

    // Basic execution prompt
    prompts.push(`Execute task: ${task.title}`);

    // Context-aware prompt with requirements
    if (task.requirements.length > 0) {
      prompts.push(
        `Execute task "${
          task.title
        }" addressing requirements: ${task.requirements.join(", ")}`
      );
    }

    // Prompt with context files
    if (task.contextFiles && task.contextFiles.length > 0) {
      prompts.push(
        `Execute task "${
          task.title
        }" considering context files: ${task.contextFiles.join(", ")}`
      );
    }

    // Comprehensive prompt
    let comprehensivePrompt = `Execute implementation task: "${task.title}"\n\n`;
    if (task.requirements.length > 0) {
      comprehensivePrompt += `Requirements addressed: ${task.requirements.join(
        ", "
      )}\n`;
    }
    if (task.contextFiles && task.contextFiles.length > 0) {
      comprehensivePrompt += `Context files: ${task.contextFiles.join(", ")}\n`;
    }
    if (task.complexity) {
      comprehensivePrompt += `Complexity: ${task.complexity}\n`;
    }
    comprehensivePrompt += `\nFocus only on this specific task. Implement the code, create tests if needed, and ensure it integrates with previous work.`;

    prompts.push(comprehensivePrompt);

    return prompts;
  }

  /**
   * Generate next steps for task execution
   */
  private generateNextSteps(
    task: TaskWithDependencies,
    dependencyStatus: DependencyStatus
  ): string[] {
    const steps: string[] = [];

    if (!dependencyStatus.canExecute) {
      steps.push(
        `Complete dependencies first: ${dependencyStatus.blockedBy.join(", ")}`
      );
      return steps;
    }

    steps.push("Copy the execution prompt to clipboard");
    steps.push("Open GitHub Copilot Chat");
    steps.push("Paste the prompt and execute the task");
    steps.push("Test the implementation");
    steps.push("Mark the task as complete when done");

    if (dependencyStatus.enables.length > 0) {
      steps.push(`This will unlock: ${dependencyStatus.enables.join(", ")}`);
    }

    return steps;
  }

  /**
   * Generate contextual help for task execution
   */
  private generateContextualHelp(task: TaskWithDependencies): string {
    let help = `Task: ${task.title}\n\n`;

    if (task.requirements.length > 0) {
      help += `This task addresses requirements: ${task.requirements.join(
        ", "
      )}\n\n`;
    }

    if (task.complexity) {
      help += `Complexity: ${task.complexity.toUpperCase()}\n`;
      switch (task.complexity) {
        case TaskComplexity.LOW:
          help +=
            "This is a straightforward task that should be quick to implement.\n\n";
          break;
        case TaskComplexity.MEDIUM:
          help +=
            "This task requires moderate effort and may involve multiple components.\n\n";
          break;
        case TaskComplexity.HIGH:
          help +=
            "This is a complex task that may require significant planning and implementation time.\n\n";
          break;
      }
    }

    if (task.estimatedDuration) {
      help += `Estimated duration: ${task.estimatedDuration} minutes\n\n`;
    }

    help += "Tips:\n";
    help += "• Focus on one task at a time\n";
    help += "• Write tests as you implement\n";
    help += "• Verify functionality before marking complete\n";
    help += "• Ask for help if you get stuck\n";

    return help;
  }

  /**
   * Update task status with confirmation and visual feedback
   * Requirement 5.3: Immediate visual confirmation
   * Requirement 5.5: Intuitive controls with confirmation
   */
  async updateTaskStatus(
    taskId: string,
    newStatus: TaskStatus,
    showConfirmation: boolean = true
  ): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      vscode.window.showErrorMessage(`Task ${taskId} not found`);
      return false;
    }

    const oldCompleted = task.completed;
    const newCompleted = newStatus === TaskStatus.COMPLETED;

    // Show confirmation dialog if requested
    if (showConfirmation && oldCompleted !== newCompleted) {
      const action = newCompleted ? "complete" : "reopen";
      const confirmed = await vscode.window.showInformationMessage(
        `${action === "complete" ? "✅" : "🔄"} ${
          action.charAt(0).toUpperCase() + action.slice(1)
        } task: "${task.title}"?`,
        { modal: true },
        `Yes, ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        "Cancel"
      );

      if (
        confirmed !== `Yes, ${action.charAt(0).toUpperCase() + action.slice(1)}`
      ) {
        return false;
      }
    }

    // Update task status
    const oldStatus = task.completed
      ? TaskStatus.COMPLETED
      : TaskStatus.NOT_STARTED;
    task.completed = newCompleted;
    task.progress = newCompleted ? 100 : 0;
    task.lastModified = new Date();

    // Update the tasks file
    await this.saveTasksToFile();

    // Fire status change event
    this.taskStatusChangeEmitter.fire({
      taskId,
      oldStatus,
      newStatus,
    });

    // Show visual confirmation with progress update
    const progress = this.getTaskProgress();
    const progressMessage = `Progress: ${progress.completedTasks}/${progress.totalTasks} tasks (${progress.percentage}%)`;

    if (newCompleted) {
      const encouragement = this.getProgressEncouragement(progress);
      vscode.window.showInformationMessage(
        `✅ Task completed! ${progressMessage}\n${encouragement}`,
        progress.completedTasks === progress.totalTasks
          ? "🎉 All Done!"
          : "Continue"
      );
    } else {
      vscode.window.showInformationMessage(
        `🔄 Task reopened. ${progressMessage}`,
        "Continue"
      );
    }

    return true;
  }

  /**
   * Get encouraging message based on progress
   */
  private getProgressEncouragement(progress: TaskProgress): string {
    const percentage = progress.percentage;

    if (percentage === 100) {
      return "🎉 Congratulations! All tasks completed!";
    } else if (percentage >= 75) {
      return "🚀 Almost there! You're doing great!";
    } else if (percentage >= 50) {
      return "💪 Great progress! Keep it up!";
    } else if (percentage >= 25) {
      return "📈 Good start! You're making progress!";
    } else {
      return "🌟 Every journey begins with a single step!";
    }
  }

  /**
   * Save tasks back to the markdown file
   */
  private async saveTasksToFile(): Promise<void> {
    const tasksFile = path.join(this.specPath, "tasks.md");
    if (!fs.existsSync(tasksFile)) {
      throw new Error("Tasks file does not exist");
    }

    let content = fs.readFileSync(tasksFile, "utf8");
    const lines = content.split("\n");

    // Update task completion status in the file
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match main tasks and sub-tasks
      const taskMatch = line.match(/^- \[[ x]\] (\d+(?:\.\d+)?)\. (.+)/);
      if (taskMatch) {
        const taskNumber = taskMatch[1];
        const taskId = `task-${taskNumber}`;
        const task = this.tasks.get(taskId);

        if (task) {
          const checkbox = task.completed ? "[x]" : "[ ]";
          lines[i] = line.replace(/\[[ x]\]/, checkbox);
        }
      }
    }

    fs.writeFileSync(tasksFile, lines.join("\n"));
  }

  /**
   * Get next recommended task based on dependencies and priority
   */
  getNextRecommendedTask(): TaskWithDependencies | null {
    const availableTasks = Array.from(this.tasks.values()).filter(
      (task) => !task.completed && this.canExecuteTask(task.id)
    );

    if (availableTasks.length === 0) {
      return null;
    }

    // Prioritize by:
    // 1. Sub-tasks of in-progress parent tasks
    // 2. Tasks with no dependencies
    // 3. Tasks that enable the most other tasks
    availableTasks.sort((a, b) => {
      // Prioritize sub-tasks
      if (a.parentTaskId && !b.parentTaskId) return -1;
      if (!a.parentTaskId && b.parentTaskId) return 1;

      // Prioritize tasks with fewer dependencies
      if (a.dependencies.length !== b.dependencies.length) {
        return a.dependencies.length - b.dependencies.length;
      }

      // Prioritize tasks that enable more other tasks
      const aEnables = Array.from(this.tasks.values()).filter((t) =>
        t.dependencies.includes(a.id)
      ).length;
      const bEnables = Array.from(this.tasks.values()).filter((t) =>
        t.dependencies.includes(b.id)
      ).length;

      return bEnables - aEnables;
    });

    return availableTasks[0];
  }

  /**
   * Get tasks grouped by status for better visualization
   */
  getTasksByStatus(): {
    available: TaskWithDependencies[];
    blocked: TaskWithDependencies[];
    completed: TaskWithDependencies[];
    inProgress: TaskWithDependencies[];
  } {
    const allTasks = Array.from(this.tasks.values());

    return {
      available: allTasks.filter(
        (t) => !t.completed && this.canExecuteTask(t.id)
      ),
      blocked: allTasks.filter(
        (t) => !t.completed && !this.canExecuteTask(t.id)
      ),
      completed: allTasks.filter((t) => t.completed),
      inProgress: allTasks.filter(
        (t) => !t.completed && t.progress && t.progress > 0
      ),
    };
  }

  /**
   * Get task hierarchy for dependency visualization
   */
  getTaskHierarchy(): Map<string, string[]> {
    const hierarchy = new Map<string, string[]>();

    Array.from(this.tasks.values()).forEach((task) => {
      if (task.parentTaskId) {
        if (!hierarchy.has(task.parentTaskId)) {
          hierarchy.set(task.parentTaskId, []);
        }
        hierarchy.get(task.parentTaskId)!.push(task.id);
      }
    });

    return hierarchy;
  }
}
