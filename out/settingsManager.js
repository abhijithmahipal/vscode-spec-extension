"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsManager = void 0;
const vscode = require("vscode");
class SettingsManager {
    constructor() {
        this.configSection = "specDrivenDevelopment";
        this.onSettingsChangedEmitter = new vscode.EventEmitter();
        this.onSettingsChanged = this.onSettingsChangedEmitter.event;
        this.settings = this.loadSettings();
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration(this.configSection)) {
                this.settings = this.loadSettings();
                this.onSettingsChangedEmitter.fire(this.settings);
            }
        });
    }
    static getInstance() {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }
    /**
     * Load all settings from VS Code configuration
     * Requirement 7.1: Settings for workflow behavior customization
     */
    loadSettings() {
        const config = vscode.workspace.getConfiguration(this.configSection);
        return {
            workflowBehavior: {
                requirePhaseConfirmation: config.get("workflowBehavior.requirePhaseConfirmation", true),
                autoSaveOnPhaseTransition: config.get("workflowBehavior.autoSaveOnPhaseTransition", true),
                showDetailedProgress: config.get("workflowBehavior.showDetailedProgress", true),
                enableTaskDependencyValidation: config.get("workflowBehavior.enableTaskDependencyValidation", true),
            },
            uiPreferences: {
                textWrapping: config.get("uiPreferences.textWrapping", "auto"),
                showTooltips: config.get("uiPreferences.showTooltips", true),
                animateTransitions: config.get("uiPreferences.animateTransitions", true),
                compactMode: config.get("uiPreferences.compactMode", false),
                highContrastMode: config.get("uiPreferences.highContrastMode", false),
            },
            integration: {
                copilotPromptStyle: config.get("integration.copilotPromptStyle", "detailed"),
                customTemplateDirectory: config.get("integration.customTemplateDirectory", ""),
                fileNamingConvention: config.get("integration.fileNamingConvention", "kebab-case"),
            },
            accessibility: {
                screenReaderSupport: config.get("accessibility.screenReaderSupport", false),
                keyboardNavigationEnhanced: config.get("accessibility.keyboardNavigationEnhanced", false),
            },
            notifications: {
                showSuccessMessages: config.get("notifications.showSuccessMessages", true),
                showProgressNotifications: config.get("notifications.showProgressNotifications", true),
                enableSoundNotifications: config.get("notifications.enableSoundNotifications", false),
            },
        };
    }
    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.settings };
    }
    /**
     * Get workflow behavior settings
     * Requirement 7.1: Workflow behavior customization
     */
    getWorkflowBehavior() {
        return { ...this.settings.workflowBehavior };
    }
    /**
     * Get UI preferences settings
     * Requirement 7.5: Accessibility support
     */
    getUIPreferences() {
        return { ...this.settings.uiPreferences };
    }
    /**
     * Get integration settings
     * Requirement 6.1: VS Code design patterns
     */
    getIntegration() {
        return { ...this.settings.integration };
    }
    /**
     * Get accessibility settings
     * Requirement 7.5: Accessibility support
     */
    getAccessibility() {
        return { ...this.settings.accessibility };
    }
    /**
     * Get notification settings
     */
    getNotifications() {
        return { ...this.settings.notifications };
    }
    /**
     * Update a specific setting
     */
    async updateSetting(key, value, target = vscode.ConfigurationTarget.Workspace) {
        const config = vscode.workspace.getConfiguration(this.configSection);
        await config.update(key, value, target);
    }
    /**
     * Reset all settings to defaults
     */
    async resetToDefaults() {
        const config = vscode.workspace.getConfiguration(this.configSection);
        const inspect = config.inspect("");
        if (inspect) {
            // Reset workspace settings
            for (const key of Object.keys(inspect.workspaceValue || {})) {
                await config.update(key, undefined, vscode.ConfigurationTarget.Workspace);
            }
            // Reset user settings if requested
            const resetUser = await vscode.window.showQuickPick(["Workspace only", "User settings too"], { placeHolder: "Reset which settings?" });
            if (resetUser === "User settings too") {
                for (const key of Object.keys(inspect.globalValue || {})) {
                    await config.update(key, undefined, vscode.ConfigurationTarget.Global);
                }
            }
        }
    }
    /**
     * Show settings quick pick for common configurations
     */
    async showQuickSettings() {
        const options = [
            {
                label: "$(gear) Workflow Behavior",
                description: "Configure phase transitions and validations",
                action: () => this.showWorkflowSettings(),
            },
            {
                label: "$(paintcan) UI Preferences",
                description: "Customize appearance and layout",
                action: () => this.showUISettings(),
            },
            {
                label: "$(plug) Integration",
                description: "Configure Copilot and external tools",
                action: () => this.showIntegrationSettings(),
            },
            {
                label: "$(accessibility) Accessibility",
                description: "Enable accessibility features",
                action: () => this.showAccessibilitySettings(),
            },
            {
                label: "$(bell) Notifications",
                description: "Configure notification preferences",
                action: () => this.showNotificationSettings(),
            },
            {
                label: "$(settings-gear) Open Settings UI",
                description: "Open full settings interface",
                action: () => vscode.commands.executeCommand("workbench.action.openSettings", "@ext:spec-driven-development"),
            },
            {
                label: "$(refresh) Reset to Defaults",
                description: "Reset all settings to default values",
                action: () => this.resetToDefaults(),
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
    /**
     * Show workflow behavior settings
     */
    async showWorkflowSettings() {
        const current = this.getWorkflowBehavior();
        const options = [
            {
                label: `$(${current.requirePhaseConfirmation ? "check" : "x"}) Phase Confirmation`,
                description: current.requirePhaseConfirmation ? "Enabled" : "Disabled",
                key: "workflowBehavior.requirePhaseConfirmation",
                value: !current.requirePhaseConfirmation,
            },
            {
                label: `$(${current.autoSaveOnPhaseTransition ? "check" : "x"}) Auto-save on Phase Transition`,
                description: current.autoSaveOnPhaseTransition ? "Enabled" : "Disabled",
                key: "workflowBehavior.autoSaveOnPhaseTransition",
                value: !current.autoSaveOnPhaseTransition,
            },
            {
                label: `$(${current.showDetailedProgress ? "check" : "x"}) Detailed Progress`,
                description: current.showDetailedProgress ? "Enabled" : "Disabled",
                key: "workflowBehavior.showDetailedProgress",
                value: !current.showDetailedProgress,
            },
            {
                label: `$(${current.enableTaskDependencyValidation ? "check" : "x"}) Task Dependency Validation`,
                description: current.enableTaskDependencyValidation
                    ? "Enabled"
                    : "Disabled",
                key: "workflowBehavior.enableTaskDependencyValidation",
                value: !current.enableTaskDependencyValidation,
            },
        ];
        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: "Toggle workflow behavior settings",
        });
        if (selected) {
            await this.updateSetting(selected.key, selected.value);
            vscode.window.showInformationMessage(`${selected.label.replace(/\$\([^)]+\)\s*/, "")} ${selected.value ? "enabled" : "disabled"}`);
        }
    }
    /**
     * Show UI preferences settings
     */
    async showUISettings() {
        const current = this.getUIPreferences();
        const options = [
            {
                label: `$(word-wrap) Text Wrapping: ${current.textWrapping}`,
                description: "Change text wrapping behavior",
                action: async () => {
                    const wrappingOptions = ["auto", "fixed", "none"];
                    const selected = await vscode.window.showQuickPick(wrappingOptions, {
                        placeHolder: "Select text wrapping mode",
                    });
                    if (selected) {
                        await this.updateSetting("uiPreferences.textWrapping", selected);
                    }
                },
            },
            {
                label: `$(${current.showTooltips ? "check" : "x"}) Show Tooltips`,
                description: current.showTooltips ? "Enabled" : "Disabled",
                action: () => this.updateSetting("uiPreferences.showTooltips", !current.showTooltips),
            },
            {
                label: `$(${current.animateTransitions ? "check" : "x"}) Animate Transitions`,
                description: current.animateTransitions ? "Enabled" : "Disabled",
                action: () => this.updateSetting("uiPreferences.animateTransitions", !current.animateTransitions),
            },
            {
                label: `$(${current.compactMode ? "check" : "x"}) Compact Mode`,
                description: current.compactMode ? "Enabled" : "Disabled",
                action: () => this.updateSetting("uiPreferences.compactMode", !current.compactMode),
            },
            {
                label: `$(${current.highContrastMode ? "check" : "x"}) High Contrast Mode`,
                description: current.highContrastMode ? "Enabled" : "Disabled",
                action: () => this.updateSetting("uiPreferences.highContrastMode", !current.highContrastMode),
            },
        ];
        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: "Configure UI preferences",
        });
        if (selected) {
            await selected.action();
        }
    }
    /**
     * Show integration settings
     */
    async showIntegrationSettings() {
        const current = this.getIntegration();
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
                        await this.updateSetting("integration.copilotPromptStyle", selected);
                    }
                },
            },
            {
                label: `$(folder) Custom Template Directory: ${current.customTemplateDirectory || "Not set"}`,
                description: "Set custom template directory",
                action: async () => {
                    const input = await vscode.window.showInputBox({
                        prompt: "Enter custom template directory path (relative to workspace)",
                        value: current.customTemplateDirectory,
                        placeHolder: ".spec-templates",
                    });
                    if (input !== undefined) {
                        await this.updateSetting("integration.customTemplateDirectory", input);
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
                        await this.updateSetting("integration.fileNamingConvention", selected);
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
    /**
     * Show accessibility settings
     * Requirement 7.5: Accessibility support
     */
    async showAccessibilitySettings() {
        const current = this.getAccessibility();
        const options = [
            {
                label: `$(${current.screenReaderSupport ? "check" : "x"}) Screen Reader Support`,
                description: current.screenReaderSupport ? "Enabled" : "Disabled",
                key: "accessibility.screenReaderSupport",
                value: !current.screenReaderSupport,
            },
            {
                label: `$(${current.keyboardNavigationEnhanced ? "check" : "x"}) Enhanced Keyboard Navigation`,
                description: current.keyboardNavigationEnhanced
                    ? "Enabled"
                    : "Disabled",
                key: "accessibility.keyboardNavigationEnhanced",
                value: !current.keyboardNavigationEnhanced,
            },
        ];
        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: "Configure accessibility features",
        });
        if (selected) {
            await this.updateSetting(selected.key, selected.value);
            vscode.window.showInformationMessage(`${selected.label.replace(/\$\([^)]+\)\s*/, "")} ${selected.value ? "enabled" : "disabled"}`);
            if (selected.key === "accessibility.screenReaderSupport" &&
                selected.value) {
                vscode.window.showInformationMessage("Screen reader support enabled. The extension will now provide enhanced accessibility features.");
            }
        }
    }
    /**
     * Show notification settings
     */
    async showNotificationSettings() {
        const current = this.getNotifications();
        const options = [
            {
                label: `$(${current.showSuccessMessages ? "check" : "x"}) Success Messages`,
                description: current.showSuccessMessages ? "Enabled" : "Disabled",
                key: "notifications.showSuccessMessages",
                value: !current.showSuccessMessages,
            },
            {
                label: `$(${current.showProgressNotifications ? "check" : "x"}) Progress Notifications`,
                description: current.showProgressNotifications ? "Enabled" : "Disabled",
                key: "notifications.showProgressNotifications",
                value: !current.showProgressNotifications,
            },
            {
                label: `$(${current.enableSoundNotifications ? "check" : "x"}) Sound Notifications`,
                description: current.enableSoundNotifications ? "Enabled" : "Disabled",
                key: "notifications.enableSoundNotifications",
                value: !current.enableSoundNotifications,
            },
        ];
        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: "Configure notification preferences",
        });
        if (selected) {
            await this.updateSetting(selected.key, selected.value);
            vscode.window.showInformationMessage(`${selected.label.replace(/\$\([^)]+\)\s*/, "")} ${selected.value ? "enabled" : "disabled"}`);
        }
    }
    /**
     * Apply theme-based settings
     * Requirement 6.1: VS Code design patterns
     */
    applyThemeSettings() {
        const theme = vscode.window.activeColorTheme;
        const isHighContrast = theme.kind === vscode.ColorThemeKind.HighContrast ||
            theme.kind === vscode.ColorThemeKind.HighContrastLight;
        if (isHighContrast && !this.settings.uiPreferences.highContrastMode) {
            // Automatically enable high contrast mode if VS Code theme is high contrast
            this.updateSetting("uiPreferences.highContrastMode", true);
        }
    }
    /**
     * Get text wrapping configuration for UI components
     */
    getTextWrappingConfig() {
        const textWrapping = this.settings.uiPreferences.textWrapping;
        switch (textWrapping) {
            case "auto":
                return { enabled: true };
            case "fixed":
                return { enabled: true, maxWidth: 80 };
            case "none":
                return { enabled: false };
            default:
                return { enabled: true };
        }
    }
    /**
     * Check if confirmation dialogs should be shown
     * Requirement 7.1: Configurable confirmation dialogs
     */
    shouldShowConfirmationDialog(type) {
        switch (type) {
            case "phaseTransition":
                return this.settings.workflowBehavior.requirePhaseConfirmation;
            case "taskCompletion":
                return this.settings.workflowBehavior.showDetailedProgress;
            case "fileOperation":
                return this.settings.workflowBehavior.autoSaveOnPhaseTransition;
            default:
                return true;
        }
    }
    /**
     * Get notification preferences for different types of messages
     */
    shouldShowNotification(type) {
        switch (type) {
            case "success":
                return this.settings.notifications.showSuccessMessages;
            case "progress":
                return this.settings.notifications.showProgressNotifications;
            case "error":
                return true; // Always show error notifications
            default:
                return true;
        }
    }
    /**
     * Export settings for backup or sharing
     */
    exportSettings() {
        return JSON.stringify(this.settings, null, 2);
    }
    /**
     * Import settings from backup
     */
    async importSettings(settingsJson) {
        try {
            const importedSettings = JSON.parse(settingsJson);
            // Validate imported settings structure
            if (!this.validateSettingsStructure(importedSettings)) {
                throw new Error("Invalid settings structure");
            }
            // Apply imported settings
            const config = vscode.workspace.getConfiguration(this.configSection);
            for (const [category, settings] of Object.entries(importedSettings)) {
                for (const [key, value] of Object.entries(settings)) {
                    await config.update(`${category}.${key}`, value, vscode.ConfigurationTarget.Workspace);
                }
            }
            vscode.window.showInformationMessage("Settings imported successfully!");
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to import settings: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Validate settings structure
     */
    validateSettingsStructure(settings) {
        return (settings &&
            typeof settings === "object" &&
            settings.workflowBehavior &&
            settings.uiPreferences &&
            settings.integration &&
            settings.accessibility &&
            settings.notifications);
    }
}
exports.SettingsManager = SettingsManager;
//# sourceMappingURL=settingsManager.js.map