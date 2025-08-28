"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const specWorkflowManager_1 = require("./specWorkflowManager");
const specPanelProvider_1 = require("./specPanelProvider");
const errorHandler_1 = require("./errorHandler");
const userGuidance_1 = require("./userGuidance");
function activate(context) {
    const workflowManager = new specWorkflowManager_1.SpecWorkflowManager();
    const panelProvider = new specPanelProvider_1.SpecPanelProvider(context.extensionUri, workflowManager);
    const filesProvider = new specPanelProvider_1.SpecFilesProvider(workflowManager);
    const helpProvider = new specPanelProvider_1.SpecHelpProvider();
    // Register all tree data providers
    vscode.window.registerTreeDataProvider("specPanel", panelProvider);
    vscode.window.registerTreeDataProvider("specFiles", filesProvider);
    vscode.window.registerTreeDataProvider("specHelp", helpProvider);
    // Start Spec Mode command with enhanced validation and feedback
    let lastStartTime = 0;
    const startSpecMode = vscode.commands.registerCommand("specMode.start", async () => {
        try {
            // Debounce start command
            const now = Date.now();
            if (now - lastStartTime < 2000) {
                vscode.window.showWarningMessage("Please wait before starting another spec.");
                return;
            }
            lastStartTime = now;
            // Check if workspace is available
            if (!vscode.workspace.workspaceFolders?.length) {
                vscode.window
                    .showErrorMessage("Please open a workspace folder before starting a spec.", "Open Folder")
                    .then((selection) => {
                    if (selection === "Open Folder") {
                        vscode.commands.executeCommand("vscode.openFolder");
                    }
                });
                return;
            }
            const userInput = await vscode.window.showInputBox({
                prompt: "Describe your feature idea",
                placeHolder: "I need to implement landing page to display upcoming events",
                validateInput: (value) => {
                    if (!value || value.trim().length < 10) {
                        return "Please provide a more detailed description (at least 10 characters)";
                    }
                    return null;
                },
            });
            if (userInput) {
                // Convert user input to kebab-case feature name
                const featureName = userInput
                    .toLowerCase()
                    .replace(/[^a-z0-9\s]/g, "")
                    .trim()
                    .replace(/\s+/g, "-")
                    .substring(0, 50); // Limit length
                // Validate feature name
                if (featureName.length < 3) {
                    vscode.window.showErrorMessage("Feature name is too short. Please provide a more descriptive idea.");
                    return;
                }
                // Show the generated feature name for confirmation
                const confirmed = await vscode.window.showInformationMessage(`Feature name: "${featureName}". Continue?`, { modal: true }, "Yes, Start Spec", "Edit Name", "Cancel");
                let finalFeatureName = featureName;
                if (confirmed === "Edit Name") {
                    const editedName = await vscode.window.showInputBox({
                        prompt: "Enter feature name (kebab-case)",
                        value: featureName,
                        placeHolder: "events-landing-page",
                        validateInput: (value) => {
                            if (!value || value.trim().length < 3) {
                                return "Feature name must be at least 3 characters";
                            }
                            if (!/^[a-z0-9-]+$/.test(value)) {
                                return "Feature name should only contain lowercase letters, numbers, and hyphens";
                            }
                            return null;
                        },
                    });
                    if (!editedName)
                        return;
                    finalFeatureName = editedName;
                }
                else if (confirmed !== "Yes, Start Spec") {
                    return;
                }
                // Show progress indicator
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Starting spec workflow...",
                    cancellable: false,
                }, async (progress) => {
                    progress.report({
                        increment: 25,
                        message: "Creating spec directory...",
                    });
                    await workflowManager.startSpec(finalFeatureName, userInput);
                    progress.report({
                        increment: 25,
                        message: "Setting up workspace...",
                    });
                    vscode.commands.executeCommand("setContext", "specMode.active", true);
                    progress.report({
                        increment: 25,
                        message: "Refreshing views...",
                    });
                    panelProvider.refresh();
                    filesProvider.refresh();
                    progress.report({
                        increment: 25,
                        message: "Preparing requirements prompt...",
                    });
                    // Use enhanced clipboard functionality
                    await workflowManager.copyRequirementsPrompt(finalFeatureName, userInput);
                });
                // Show success message with next steps
                const result = await vscode.window.showInformationMessage(`🚀 Spec started for "${finalFeatureName}"! Requirements prompt is ready.`, "Open Copilot Chat", "View Spec Panel");
                if (result === "Open Copilot Chat") {
                    await vscode.commands.executeCommand("workbench.panel.chat.view.copilot.focus");
                    await vscode.commands.executeCommand("workbench.action.chat.newChat");
                }
                else if (result === "View Spec Panel") {
                    await vscode.commands.executeCommand("workbench.view.extension.spec-container");
                }
            }
        }
        catch (error) {
            const recovered = await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
            if (!recovered) {
                // If error handling didn't recover, offer to try again
                const retry = await vscode.window.showErrorMessage("Failed to start spec. Would you like to try again?", "Try Again", "Cancel");
                if (retry === "Try Again") {
                    vscode.commands.executeCommand("specMode.start");
                }
            }
        }
    });
    // Next Phase command with enhanced robustness
    const nextPhase = vscode.commands.registerCommand("specMode.nextPhase", async () => {
        try {
            const result = await workflowManager.moveToNextPhase();
            if (result.success) {
                if (result.prompt) {
                    // Use enhanced clipboard functionality for phase transition prompts
                    const currentPhase = workflowManager.getCurrentPhase();
                    switch (currentPhase) {
                        case "design":
                            await workflowManager.copyDesignPrompt();
                            break;
                        case "tasks":
                            await workflowManager.copyTasksPrompt();
                            break;
                        default:
                            // Fallback to basic clipboard for unknown phases
                            await vscode.env.clipboard.writeText(result.prompt);
                            vscode.window.showInformationMessage(`Moved to ${currentPhase} phase. Prompt copied to clipboard.`);
                    }
                }
                panelProvider.refresh();
                filesProvider.refresh();
                updateStatusBar();
            }
            else {
                vscode.window
                    .showErrorMessage(result.error || "Failed to move to next phase.", "Retry")
                    .then((selection) => {
                    if (selection === "Retry") {
                        vscode.commands.executeCommand("specMode.nextPhase");
                    }
                });
            }
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Execute Task command with enhanced feedback
    let lastTaskExecutionTime = 0;
    const executeTask = vscode.commands.registerCommand("specMode.executeTask", async (taskItem) => {
        try {
            // Debounce task execution
            const now = Date.now();
            if (now - lastTaskExecutionTime < 1000) {
                vscode.window.showWarningMessage("Please wait before executing another task.");
                return;
            }
            lastTaskExecutionTime = now;
            // Use enhanced clipboard functionality for task execution
            await workflowManager.copyTaskExecutionPrompt(taskItem.task);
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Refresh command with enhanced feedback
    const refresh = vscode.commands.registerCommand("specMode.refresh", async () => {
        try {
            panelProvider.refresh();
            filesProvider.refresh();
            updateStatusBar();
            vscode.window.showInformationMessage("🔄 Spec views refreshed successfully!");
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Open file command
    const openFile = vscode.commands.registerCommand("specMode.openFile", (filePath) => {
        vscode.window.showTextDocument(vscode.Uri.file(filePath));
    });
    // Mark task complete command with confirmation
    const markComplete = vscode.commands.registerCommand("specMode.markComplete", async (taskItem) => {
        try {
            const confirmed = await vscode.window.showInformationMessage(`Mark task as complete: "${taskItem.task.title}"?`, { modal: true }, "Yes, Complete", "Cancel");
            if (confirmed === "Yes, Complete") {
                await workflowManager.markTaskComplete(taskItem.task.id);
                panelProvider.refresh();
                // Show progress update
                const tasks = await workflowManager.getTasks();
                const completedTasks = tasks.filter((t) => t.completed).length;
                const totalTasks = tasks.length;
                vscode.window.showInformationMessage(`✅ Task completed! Progress: ${completedTasks}/${totalTasks} tasks`, completedTasks === totalTasks ? "All Done!" : "Continue");
            }
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Copy prompts command - allows users to choose from available prompts
    const copyPrompts = vscode.commands.registerCommand("specMode.copyPrompts", async () => {
        try {
            if (!workflowManager.isActive()) {
                vscode.window.showWarningMessage("No active spec. Start a spec first to access prompts.");
                return;
            }
            await workflowManager.copyFromAvailablePrompts();
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Show guidance command - provides contextual help and next steps
    const showGuidance = vscode.commands.registerCommand("specMode.showGuidance", async () => {
        try {
            if (!workflowManager.isActive()) {
                // Show general guidance for getting started
                const guidance = await userGuidance_1.UserGuidanceProvider.getContextualGuidance(workflowManager.getCurrentPhase(), {});
                await userGuidance_1.UserGuidanceProvider.showGuidance(guidance);
                return;
            }
            // Get contextual guidance for current state
            const currentPhase = workflowManager.getCurrentPhase();
            const specFiles = await workflowManager.getSpecFiles();
            const tasks = await workflowManager.getTasks();
            const guidance = await userGuidance_1.UserGuidanceProvider.getContextualGuidance(currentPhase, {
                featureName: workflowManager.getCurrentFeature(),
                hasFiles: specFiles.some((f) => f.exists),
                completedTasks: tasks.filter((t) => t.completed).length,
                totalTasks: tasks.length,
            });
            await userGuidance_1.UserGuidanceProvider.showGuidance(guidance);
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = "workbench.view.extension.spec-container";
    // Update status bar based on spec state with enhanced feedback
    const updateStatusBar = () => {
        if (workflowManager.isActive()) {
            const currentPhase = workflowManager.getCurrentPhase();
            const phaseEmoji = getPhaseEmoji(currentPhase);
            statusBarItem.text = `${phaseEmoji} Spec: ${workflowManager.getCurrentFeature()}`;
            statusBarItem.tooltip = `Spec Mode Active - ${workflowManager.getProgressSummary()}\nCurrent Phase: ${currentPhase}\nClick for guidance`;
            statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.prominentBackground");
            statusBarItem.show();
            // Show periodic tips for active specs
            userGuidance_1.UserGuidanceProvider.showPeriodicTip(currentPhase);
        }
        else {
            statusBarItem.text = "$(notebook) Start Spec";
            statusBarItem.tooltip = "Click to start spec-driven development";
            statusBarItem.backgroundColor = undefined;
            statusBarItem.show();
        }
    };
    // Helper function for phase emojis
    const getPhaseEmoji = (phase) => {
        switch (phase) {
            case "requirements":
                return "📝";
            case "design":
                return "🎨";
            case "tasks":
                return "📋";
            case "execution":
                return "⚡";
            default:
                return "$(notebook)";
        }
    };
    updateStatusBar();
    // Welcome message for first-time users
    const hasShownWelcome = context.globalState.get("specMode.hasShownWelcome", false);
    if (!hasShownWelcome) {
        vscode.window
            .showInformationMessage("🎉 Welcome to Spec-Driven Development! Start by creating your first spec.", "Get Started", "Learn More")
            .then((selection) => {
            if (selection === "Get Started") {
                vscode.commands.executeCommand("specMode.start");
            }
            else if (selection === "Learn More") {
                vscode.commands.executeCommand("workbench.view.extension.spec-container");
            }
        });
        context.globalState.update("specMode.hasShownWelcome", true);
    }
    context.subscriptions.push(startSpecMode, nextPhase, executeTask, refresh, openFile, markComplete, copyPrompts, showGuidance, statusBarItem);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map