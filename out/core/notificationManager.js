"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationManager = void 0;
const vscode = require("vscode");
/**
 * Consolidated Notification Manager
 * Replaces multiple notification systems throughout the codebase
 * Addresses requirements 1.2, 1.3
 */
class NotificationManager {
    constructor() {
        // Load settings from VS Code configuration
        const config = vscode.workspace.getConfiguration("specDrivenDevelopment");
        this.settings = {
            showSuccessMessages: config.get("notifications.showSuccessMessages", true),
            showProgressNotifications: config.get("notifications.showProgressNotifications", true),
            enableSoundNotifications: config.get("notifications.enableSoundNotifications", false),
        };
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("specDrivenDevelopment.notifications")) {
                this.updateSettings();
            }
        });
    }
    static getInstance() {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }
    updateSettings() {
        const config = vscode.workspace.getConfiguration("specDrivenDevelopment");
        this.settings.showSuccessMessages = config.get("notifications.showSuccessMessages", true);
        this.settings.showProgressNotifications = config.get("notifications.showProgressNotifications", true);
        this.settings.enableSoundNotifications = config.get("notifications.enableSoundNotifications", false);
    }
    /**
     * Show success notification with optional actions
     */
    async showSuccess(message, actions, options) {
        if (!this.settings.showSuccessMessages) {
            return undefined;
        }
        const result = await vscode.window.showInformationMessage(message, {
            modal: options?.modal || false,
            detail: options?.detail,
        }, ...(actions || []));
        if (this.settings.enableSoundNotifications) {
            // Play success sound if enabled
            // Note: VS Code doesn't have built-in sound API, but we can trigger system notifications
        }
        return result;
    }
    /**
     * Show error notification with recovery actions
     */
    async showError(message, actions, options) {
        return await vscode.window.showErrorMessage(message, {
            modal: options?.modal || false,
            detail: options?.detail,
        }, ...(actions || []));
    }
    /**
     * Show warning notification
     */
    async showWarning(message, actions, options) {
        return await vscode.window.showWarningMessage(message, {
            modal: options?.modal || false,
            detail: options?.detail,
        }, ...(actions || []));
    }
    /**
     * Show confirmation dialog
     */
    async showConfirmation(message, actions, options) {
        return await vscode.window.showInformationMessage(message, {
            modal: options?.modal !== false,
            detail: options?.detail,
        }, ...actions);
    }
    /**
     * Show progress notification with cancellation support
     */
    async showProgress(title, task, cancellable = false) {
        if (!this.settings.showProgressNotifications) {
            // If progress notifications are disabled, still run the task but without UI
            return await task({
                report: () => { }, // No-op progress reporter
            });
        }
        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title,
            cancellable,
        }, task);
    }
    /**
     * Show status bar message temporarily
     */
    showStatusMessage(message, timeout = 5000) {
        return vscode.window.setStatusBarMessage(message, timeout);
    }
    /**
     * Show quick pick with enhanced options
     */
    async showQuickPick(items, options) {
        return await vscode.window.showQuickPick(items, {
            matchOnDescription: true,
            matchOnDetail: true,
            ...options,
        });
    }
    /**
     * Show input box with validation
     */
    async showInputBox(options) {
        return await vscode.window.showInputBox({
            ...options,
            validateInput: options.validateInput || undefined,
        });
    }
    /**
     * Show contextual help notification
     */
    async showHelp(title, content, actions) {
        return await this.showSuccess(`💡 ${title}`, actions, { detail: content });
    }
    /**
     * Show validation results
     */
    async showValidationResults(results) {
        if (results.errors > 0) {
            await this.showError(`❌ Validation failed: ${results.errors} errors, ${results.warnings} warnings`, ["View Details", "Fix Issues"]);
        }
        else if (results.warnings > 0) {
            await this.showWarning(`⚠️ Validation completed with ${results.warnings} warnings`, ["View Details", "Continue Anyway"]);
        }
        else {
            await this.showSuccess(`✅ All ${results.total} validation checks passed!`);
        }
    }
    /**
     * Show task completion feedback
     */
    async showTaskCompletion(taskTitle, completedTasks, totalTasks) {
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const progressMessage = `Progress: ${completedTasks}/${totalTasks} tasks (${percentage}%)`;
        if (completedTasks === totalTasks) {
            await this.showSuccess(`🎉 All tasks completed! ${progressMessage}`, [
                "Celebrate",
                "Review Implementation",
            ]);
        }
        else {
            await this.showSuccess(`✅ Task completed: "${taskTitle}"\n${progressMessage}`, ["Continue", "View Progress"]);
        }
    }
    /**
     * Show phase transition feedback
     */
    async showPhaseTransition(fromPhase, toPhase, nextSteps) {
        const message = `✅ Successfully moved from ${fromPhase} to ${toPhase} phase!`;
        const actions = nextSteps ? ["Continue", "Show Next Steps"] : ["Continue"];
        const result = await this.showSuccess(message, actions);
        if (result === "Show Next Steps" && nextSteps) {
            await this.showHelp("Next Steps", nextSteps.map((step, i) => `${i + 1}. ${step}`).join("\n"));
        }
    }
    /**
     * Show welcome message for first-time users
     */
    async showWelcome() {
        const result = await this.showSuccess("🎉 Welcome to Spec-Driven Development! Start by creating your first spec.", ["Get Started", "Learn More", "Dismiss"]);
        if (result === "Get Started") {
            await vscode.commands.executeCommand("specMode.start");
        }
        else if (result === "Learn More") {
            await vscode.commands.executeCommand("workbench.view.extension.spec-container");
        }
    }
    /**
     * Show clipboard operation feedback
     */
    async showClipboardSuccess(promptTitle, nextActions) {
        const message = `✅ "${promptTitle}" copied to clipboard successfully!`;
        const actions = nextActions || ["Open Copilot Chat", "Dismiss"];
        const result = await this.showSuccess(message, actions);
        if (result === "Open Copilot Chat") {
            await vscode.commands.executeCommand("workbench.panel.chat.view.copilot.focus");
            await vscode.commands.executeCommand("workbench.action.chat.newChat");
        }
        return result;
    }
    /**
     * Show debounce warning
     */
    async showDebounceWarning(action) {
        await this.showWarning(`Please wait before ${action} again.`);
    }
    /**
     * Show feature completion celebration
     */
    async showFeatureCompletion(featureName) {
        await this.showSuccess(`🎉 Feature "${featureName}" implementation completed!`, ["Review Code", "Start New Feature", "Celebrate"], {
            detail: "Congratulations on completing your spec-driven development workflow!",
        });
    }
}
exports.NotificationManager = NotificationManager;
//# sourceMappingURL=notificationManager.js.map