import * as vscode from "vscode";

export interface ExtensionSettings {
  workflowBehavior: {
    requirePhaseConfirmation: boolean;
    autoSaveOnPhaseTransition: boolean;
    showDetailedProgress: boolean;
  };
  uiPreferences: {
    compactMode: boolean;
    showTooltips: boolean;
    animateTransitions: boolean;
  };
  integration: {
    copilotPromptStyle: "detailed" | "concise";
    fileNamingConvention: "kebab-case" | "snake_case" | "camelCase";
  };
  notifications: {
    showSuccessMessages: boolean;
    showProgressNotifications: boolean;
  };
}

/**
 * Consolidated Settings Manager
 * Simplifies settings from the original complex structure
 * Addresses requirements 1.4, 1.5
 */
export class SettingsManager {
  private static instance: SettingsManager;
  private readonly configSection = "specDrivenDevelopment";
  private settings: ExtensionSettings;

  private constructor() {
    this.settings = this.loadSettings();

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(this.configSection)) {
        this.settings = this.loadSettings();
      }
    });
  }

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  private loadSettings(): ExtensionSettings {
    const config = vscode.workspace.getConfiguration(this.configSection);

    return {
      workflowBehavior: {
        requirePhaseConfirmation: config.get(
          "workflowBehavior.requirePhaseConfirmation",
          true
        ),
        autoSaveOnPhaseTransition: config.get(
          "workflowBehavior.autoSaveOnPhaseTransition",
          true
        ),
        showDetailedProgress: config.get(
          "workflowBehavior.showDetailedProgress",
          true
        ),
      },
      uiPreferences: {
        compactMode: config.get("uiPreferences.compactMode", false),
        showTooltips: config.get("uiPreferences.showTooltips", true),
        animateTransitions: config.get(
          "uiPreferences.animateTransitions",
          true
        ),
      },
      integration: {
        copilotPromptStyle: config.get(
          "integration.copilotPromptStyle",
          "detailed"
        ),
        fileNamingConvention: config.get(
          "integration.fileNamingConvention",
          "kebab-case"
        ),
      },
      notifications: {
        showSuccessMessages: config.get(
          "notifications.showSuccessMessages",
          true
        ),
        showProgressNotifications: config.get(
          "notifications.showProgressNotifications",
          true
        ),
      },
    };
  }

  public getSettings(): ExtensionSettings {
    return { ...this.settings };
  }

  public shouldShowConfirmation(
    type: "phaseTransition" | "taskCompletion"
  ): boolean {
    switch (type) {
      case "phaseTransition":
        return this.settings.workflowBehavior.requirePhaseConfirmation;
      case "taskCompletion":
        return this.settings.workflowBehavior.showDetailedProgress;
      default:
        return true;
    }
  }

  public shouldShowNotification(type: "success" | "progress"): boolean {
    switch (type) {
      case "success":
        return this.settings.notifications.showSuccessMessages;
      case "progress":
        return this.settings.notifications.showProgressNotifications;
      default:
        return true;
    }
  }

  public async updateSetting(
    key: string,
    value: any,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configSection);
    await config.update(key, value, target);
  }

  public async showQuickSettings(): Promise<void> {
    const options = [
      {
        label: "$(gear) Workflow Behavior",
        description: "Configure phase transitions and confirmations",
        action: () => this.showWorkflowSettings(),
      },
      {
        label: "$(paintcan) UI Preferences",
        description: "Customize appearance and layout",
        action: () => this.showUISettings(),
      },
      {
        label: "$(plug) Integration",
        description: "Configure Copilot and file naming",
        action: () => this.showIntegrationSettings(),
      },
      {
        label: "$(bell) Notifications",
        description: "Configure notification preferences",
        action: () => this.showNotificationSettings(),
      },
      {
        label: "$(settings-gear) Open Settings UI",
        description: "Open full settings interface",
        action: () =>
          vscode.commands.executeCommand(
            "workbench.action.openSettings",
            "@ext:spec-driven-development"
          ),
      },
    ];

    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: "Choose settings category to configure",
      matchOnDescription: true,
    });

    if (selected) {
      await selected.action();
    }
  }

  private async showWorkflowSettings(): Promise<void> {
    const current = this.settings.workflowBehavior;
    const options = [
      {
        label: `$(${
          current.requirePhaseConfirmation ? "check" : "x"
        }) Phase Confirmation`,
        description: current.requirePhaseConfirmation ? "Enabled" : "Disabled",
        key: "workflowBehavior.requirePhaseConfirmation",
        value: !current.requirePhaseConfirmation,
      },
      {
        label: `$(${
          current.autoSaveOnPhaseTransition ? "check" : "x"
        }) Auto-save on Phase Transition`,
        description: current.autoSaveOnPhaseTransition ? "Enabled" : "Disabled",
        key: "workflowBehavior.autoSaveOnPhaseTransition",
        value: !current.autoSaveOnPhaseTransition,
      },
      {
        label: `$(${
          current.showDetailedProgress ? "check" : "x"
        }) Detailed Progress`,
        description: current.showDetailedProgress ? "Enabled" : "Disabled",
        key: "workflowBehavior.showDetailedProgress",
        value: !current.showDetailedProgress,
      },
    ];

    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: "Toggle workflow behavior settings",
    });

    if (selected) {
      await this.updateSetting(selected.key, selected.value);
      vscode.window.showInformationMessage(
        `${selected.label.replace(/\$\([^)]+\)\s*/, "")} ${
          selected.value ? "enabled" : "disabled"
        }`
      );
    }
  }

  private async showUISettings(): Promise<void> {
    const current = this.settings.uiPreferences;
    const options = [
      {
        label: `$(${current.compactMode ? "check" : "x"}) Compact Mode`,
        description: current.compactMode ? "Enabled" : "Disabled",
        key: "uiPreferences.compactMode",
        value: !current.compactMode,
      },
      {
        label: `$(${current.showTooltips ? "check" : "x"}) Show Tooltips`,
        description: current.showTooltips ? "Enabled" : "Disabled",
        key: "uiPreferences.showTooltips",
        value: !current.showTooltips,
      },
      {
        label: `$(${
          current.animateTransitions ? "check" : "x"
        }) Animate Transitions`,
        description: current.animateTransitions ? "Enabled" : "Disabled",
        key: "uiPreferences.animateTransitions",
        value: !current.animateTransitions,
      },
    ];

    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: "Configure UI preferences",
    });

    if (selected) {
      await this.updateSetting(selected.key, selected.value);
      vscode.window.showInformationMessage(
        `${selected.label.replace(/\$\([^)]+\)\s*/, "")} ${
          selected.value ? "enabled" : "disabled"
        }`
      );
    }
  }

  private async showIntegrationSettings(): Promise<void> {
    const current = this.settings.integration;
    const options = [
      {
        label: `$(github-alt) Copilot Prompt Style: ${current.copilotPromptStyle}`,
        description: "Change prompt generation style",
        action: async () => {
          const styles = ["detailed", "concise"];
          const selected = await vscode.window.showQuickPick(styles, {
            placeHolder: "Select prompt style for GitHub Copilot",
          });
          if (selected) {
            await this.updateSetting(
              "integration.copilotPromptStyle",
              selected
            );
          }
        },
      },
      {
        label: `$(symbol-file) File Naming: ${current.fileNamingConvention}`,
        description: "Change file naming convention",
        action: async () => {
          const conventions = ["kebab-case", "snake_case", "camelCase"];
          const selected = await vscode.window.showQuickPick(conventions, {
            placeHolder: "Select file naming convention",
          });
          if (selected) {
            await this.updateSetting(
              "integration.fileNamingConvention",
              selected
            );
          }
        },
      },
    ];

    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: "Configure integration settings",
    });

    if (selected) {
      await selected.action();
    }
  }

  private async showNotificationSettings(): Promise<void> {
    const current = this.settings.notifications;
    const options = [
      {
        label: `$(${
          current.showSuccessMessages ? "check" : "x"
        }) Success Messages`,
        description: current.showSuccessMessages ? "Enabled" : "Disabled",
        key: "notifications.showSuccessMessages",
        value: !current.showSuccessMessages,
      },
      {
        label: `$(${
          current.showProgressNotifications ? "check" : "x"
        }) Progress Notifications`,
        description: current.showProgressNotifications ? "Enabled" : "Disabled",
        key: "notifications.showProgressNotifications",
        value: !current.showProgressNotifications,
      },
    ];

    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: "Configure notification preferences",
    });

    if (selected) {
      await this.updateSetting(selected.key, selected.value);
      vscode.window.showInformationMessage(
        `${selected.label.replace(/\$\([^)]+\)\s*/, "")} ${
          selected.value ? "enabled" : "disabled"
        }`
      );
    }
  }
}
