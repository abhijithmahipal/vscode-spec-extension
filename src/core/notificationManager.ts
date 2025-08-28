import * as vscode from "vscode";

export interface NotificationOptions {
  modal?: boolean;
  detail?: string;
  actions?: string[];
}

/**
 * Consolidated Notification Manager
 * Replaces multiple notification systems throughout the codebase
 * Addresses requirements 1.2, 1.3
 */
export class NotificationManager {
  private static instance: NotificationManager;
  private readonly settings: {
    showSuccessMessages: boolean;
    showProgressNotifications: boolean;
    enableSoundNotifications: boolean;
  };

  constructor() {
    // Load settings from VS Code configuration
    const config = vscode.workspace.getConfiguration("specDrivenDevelopment");
    this.settings = {
      showSuccessMessages: config.get(
        "notifications.showSuccessMessages",
        true
      ),
      showProgressNotifications: config.get(
        "notifications.showProgressNotifications",
        true
      ),
      enableSoundNotifications: config.get(
        "notifications.enableSoundNotifications",
        false
      ),
    };

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("specDrivenDevelopment.notifications")) {
        this.updateSettings();
      }
    });
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private updateSettings(): void {
    const config = vscode.workspace.getConfiguration("specDrivenDevelopment");
    this.settings.showSuccessMessages = config.get(
      "notifications.showSuccessMessages",
      true
    );
    this.settings.showProgressNotifications = config.get(
      "notifications.showProgressNotifications",
      true
    );
    this.settings.enableSoundNotifications = config.get(
      "notifications.enableSoundNotifications",
      false
    );
  }

  /**
   * Show success notification with optional actions
   */
  async showSuccess(
    message: string,
    actions?: string[],
    options?: NotificationOptions
  ): Promise<string | undefined> {
    if (!this.settings.showSuccessMessages) {
      return undefined;
    }

    const result = await vscode.window.showInformationMessage(
      message,
      {
        modal: options?.modal || false,
        detail: options?.detail,
      },
      ...(actions || [])
    );

    if (this.settings.enableSoundNotifications) {
      // Play success sound if enabled
      // Note: VS Code doesn't have built-in sound API, but we can trigger system notifications
    }

    return result;
  }

  /**
   * Show error notification with recovery actions
   */
  async showError(
    message: string,
    actions?: string[],
    options?: NotificationOptions
  ): Promise<string | undefined> {
    return await vscode.window.showErrorMessage(
      message,
      {
        modal: options?.modal || false,
        detail: options?.detail,
      },
      ...(actions || [])
    );
  }

  /**
   * Show warning notification
   */
  async showWarning(
    message: string,
    actions?: string[],
    options?: NotificationOptions
  ): Promise<string | undefined> {
    return await vscode.window.showWarningMessage(
      message,
      {
        modal: options?.modal || false,
        detail: options?.detail,
      },
      ...(actions || [])
    );
  }

  /**
   * Show confirmation dialog
   */
  async showConfirmation(
    message: string,
    actions: string[],
    options?: NotificationOptions
  ): Promise<string | undefined> {
    return await vscode.window.showInformationMessage(
      message,
      {
        modal: options?.modal !== false, // Default to modal for confirmations
        detail: options?.detail,
      },
      ...actions
    );
  }

  /**
   * Show progress notification with cancellation support
   */
  async showProgress<T>(
    title: string,
    task: (
      progress: vscode.Progress<{ increment?: number; message?: string }>
    ) => Promise<T>,
    cancellable: boolean = false
  ): Promise<T> {
    if (!this.settings.showProgressNotifications) {
      // If progress notifications are disabled, still run the task but without UI
      return await task({
        report: () => {}, // No-op progress reporter
      });
    }

    return await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable,
      },
      task
    );
  }

  /**
   * Show status bar message temporarily
   */
  showStatusMessage(
    message: string,
    timeout: number = 5000
  ): vscode.Disposable {
    return vscode.window.setStatusBarMessage(message, timeout);
  }

  /**
   * Show quick pick with enhanced options
   */
  async showQuickPick<T extends vscode.QuickPickItem>(
    items: T[],
    options?: vscode.QuickPickOptions
  ): Promise<T | undefined> {
    return await vscode.window.showQuickPick(items, {
      matchOnDescription: true,
      matchOnDetail: true,
      ...options,
    });
  }

  /**
   * Show input box with validation
   */
  async showInputBox(
    options: vscode.InputBoxOptions & {
      validateInput?: (value: string) => string | null;
    }
  ): Promise<string | undefined> {
    return await vscode.window.showInputBox({
      ...options,
      validateInput: options.validateInput || undefined,
    });
  }

  /**
   * Show contextual help notification
   */
  async showHelp(
    title: string,
    content: string,
    actions?: string[]
  ): Promise<string | undefined> {
    return await this.showSuccess(`💡 ${title}`, actions, { detail: content });
  }

  /**
   * Show validation results
   */
  async showValidationResults(results: {
    passed: number;
    warnings: number;
    errors: number;
    total: number;
  }): Promise<void> {
    if (results.errors > 0) {
      await this.showError(
        `❌ Validation failed: ${results.errors} errors, ${results.warnings} warnings`,
        ["View Details", "Fix Issues"]
      );
    } else if (results.warnings > 0) {
      await this.showWarning(
        `⚠️ Validation completed with ${results.warnings} warnings`,
        ["View Details", "Continue Anyway"]
      );
    } else {
      await this.showSuccess(
        `✅ All ${results.total} validation checks passed!`
      );
    }
  }

  /**
   * Show task completion feedback
   */
  async showTaskCompletion(
    taskTitle: string,
    completedTasks: number,
    totalTasks: number
  ): Promise<void> {
    const percentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const progressMessage = `Progress: ${completedTasks}/${totalTasks} tasks (${percentage}%)`;

    if (completedTasks === totalTasks) {
      await this.showSuccess(`🎉 All tasks completed! ${progressMessage}`, [
        "Celebrate",
        "Review Implementation",
      ]);
    } else {
      await this.showSuccess(
        `✅ Task completed: "${taskTitle}"\n${progressMessage}`,
        ["Continue", "View Progress"]
      );
    }
  }

  /**
   * Show phase transition feedback
   */
  async showPhaseTransition(
    fromPhase: string,
    toPhase: string,
    nextSteps?: string[]
  ): Promise<void> {
    const message = `✅ Successfully moved from ${fromPhase} to ${toPhase} phase!`;
    const actions = nextSteps ? ["Continue", "Show Next Steps"] : ["Continue"];

    const result = await this.showSuccess(message, actions);

    if (result === "Show Next Steps" && nextSteps) {
      await this.showHelp(
        "Next Steps",
        nextSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")
      );
    }
  }

  /**
   * Show welcome message for first-time users
   */
  async showWelcome(): Promise<void> {
    const result = await this.showSuccess(
      "🎉 Welcome to Spec-Driven Development! Start by creating your first spec.",
      ["Get Started", "Learn More", "Dismiss"]
    );

    if (result === "Get Started") {
      await vscode.commands.executeCommand("specMode.start");
    } else if (result === "Learn More") {
      await vscode.commands.executeCommand(
        "workbench.view.extension.spec-container"
      );
    }
  }

  /**
   * Show clipboard operation feedback
   */
  async showClipboardSuccess(
    promptTitle: string,
    nextActions?: string[]
  ): Promise<string | undefined> {
    const message = `✅ "${promptTitle}" copied to clipboard successfully!`;
    const actions = nextActions || ["Open Copilot Chat", "Dismiss"];

    const result = await this.showSuccess(message, actions);

    if (result === "Open Copilot Chat") {
      await vscode.commands.executeCommand(
        "workbench.panel.chat.view.copilot.focus"
      );
      await vscode.commands.executeCommand("workbench.action.chat.newChat");
    }

    return result;
  }

  /**
   * Show debounce warning
   */
  async showDebounceWarning(action: string): Promise<void> {
    await this.showWarning(`Please wait before ${action} again.`);
  }

  /**
   * Show feature completion celebration
   */
  async showFeatureCompletion(featureName: string): Promise<void> {
    await this.showSuccess(
      `🎉 Feature "${featureName}" implementation completed!`,
      ["Review Code", "Start New Feature", "Celebrate"],
      {
        detail:
          "Congratulations on completing your spec-driven development workflow!",
      }
    );
  }
}
