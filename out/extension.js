"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const workflowManager_1 = require("./core/workflowManager");
const notificationManager_1 = require("./core/notificationManager");
const fileManager_1 = require("./core/fileManager");
const validationManager_1 = require("./core/validationManager");
const uiManager_1 = require("./core/uiManager");
const settingsManager_1 = require("./core/settingsManager");
const errorHandler_1 = require("./errorHandler");
const clipboardManager_1 = require("./clipboardManager");
function activate(context) {
    // Initialize consolidated managers
    const settingsManager = settingsManager_1.SettingsManager.getInstance();
    const notificationManager = notificationManager_1.NotificationManager.getInstance();
    const fileManager = fileManager_1.FileManager.getInstance();
    const validationManager = validationManager_1.ValidationManager.getInstance();
    // Create consolidated workflow manager
    const workflowManager = new workflowManager_1.WorkflowManager(notificationManager, fileManager, validationManager);
    // Create consolidated UI manager
    const uiManager = new uiManager_1.UIManager(workflowManager, notificationManager);
    // Register tree data provider
    vscode.window.registerTreeDataProvider("specPanel", uiManager);
    // Start Spec Mode command - simplified and consolidated
    let lastStartTime = 0;
    const startSpecMode = vscode.commands.registerCommand("specMode.start", async () => {
        try {
            // Debounce start command
            const now = Date.now();
            if (now - lastStartTime < 2000) {
                await notificationManager.showDebounceWarning("starting another spec");
                return;
            }
            lastStartTime = now;
            // Check if workspace is available
            if (!vscode.workspace.workspaceFolders?.length) {
                const result = await notificationManager.showError("Please open a workspace folder before starting a spec.", ["Open Folder"]);
                if (result === "Open Folder") {
                    await vscode.commands.executeCommand("vscode.openFolder");
                }
                return;
            }
            const userInput = await notificationManager.showInputBox({
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
                    .substring(0, 50);
                if (featureName.length < 3) {
                    await notificationManager.showError("Feature name is too short. Please provide a more descriptive idea.");
                    return;
                }
                // Show confirmation if enabled
                let finalFeatureName = featureName;
                if (settingsManager.shouldShowConfirmation("phaseTransition")) {
                    const confirmed = await notificationManager.showConfirmation(`Feature name: "${featureName}". Continue?`, ["Yes, Start Spec", "Edit Name", "Cancel"]);
                    if (confirmed === "Edit Name") {
                        const editedName = await notificationManager.showInputBox({
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
                }
                // Start spec with progress indication
                await notificationManager.showProgress("Starting spec workflow...", async (progress) => {
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
                    uiManager.refresh();
                    progress.report({ increment: 25, message: "Ready!" });
                });
            }
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Next Phase command - simplified
    const nextPhase = vscode.commands.registerCommand("specMode.nextPhase", async () => {
        try {
            const result = await workflowManager.moveToNextPhase();
            if (result.success) {
                uiManager.refresh();
                if (result.prompt) {
                    await clipboardManager_1.ClipboardManager.copyPromptWithEnhancements(result.prompt, `${workflowManager.getCurrentPhase()} Phase Prompt`);
                }
            }
            else {
                const retry = await notificationManager.showError(result.error || "Failed to move to next phase.", ["Retry"]);
                if (retry === "Retry") {
                    vscode.commands.executeCommand("specMode.nextPhase");
                }
            }
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Execute Task command - simplified
    let lastTaskExecutionTime = 0;
    const executeTask = vscode.commands.registerCommand("specMode.executeTask", async (taskItem) => {
        try {
            const now = Date.now();
            if (now - lastTaskExecutionTime < 1000) {
                await notificationManager.showDebounceWarning("executing another task");
                return;
            }
            lastTaskExecutionTime = now;
            const prompt = workflowManager.getTaskExecutionPrompt(taskItem.task);
            await clipboardManager_1.ClipboardManager.copyPromptWithEnhancements(prompt, `Task: ${taskItem.task.title}`);
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Enhanced task execution - simplified
    const executeTaskEnhanced = vscode.commands.registerCommand("specMode.executeTaskEnhanced", async (task) => {
        try {
            const now = Date.now();
            if (now - lastTaskExecutionTime < 1000) {
                await notificationManager.showDebounceWarning("executing another task");
                return;
            }
            lastTaskExecutionTime = now;
            const prompt = workflowManager.getTaskExecutionPrompt(task);
            await clipboardManager_1.ClipboardManager.copyPromptWithEnhancements(prompt, `Enhanced Task: ${task.title}`);
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Refresh command - simplified
    const refresh = vscode.commands.registerCommand("specMode.refresh", async () => {
        try {
            uiManager.refresh();
            if (settingsManager.shouldShowNotification("success")) {
                await notificationManager.showSuccess("🔄 Spec views refreshed successfully!");
            }
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Open file command - using file manager
    const openFile = vscode.commands.registerCommand("specMode.openFile", async (filePath) => {
        try {
            await fileManager.openFile(filePath);
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Mark task complete command - simplified
    const markComplete = vscode.commands.registerCommand("specMode.markComplete", async (taskItem) => {
        try {
            let confirmed = "Yes, Complete";
            if (settingsManager.shouldShowConfirmation("taskCompletion")) {
                confirmed =
                    (await notificationManager.showConfirmation(`Mark task as complete: "${taskItem.task.title}"?`, ["Yes, Complete", "Cancel"])) || "Cancel";
            }
            if (confirmed === "Yes, Complete") {
                await workflowManager.markTaskComplete(taskItem.task.id);
                uiManager.refresh();
                const tasks = await workflowManager.getTasks();
                const completedTasks = tasks.filter((t) => t.completed).length;
                const totalTasks = tasks.length;
                await notificationManager.showTaskCompletion(taskItem.task.title, completedTasks, totalTasks);
            }
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Simplified task management commands
    const reopenTask = vscode.commands.registerCommand("specMode.reopenTask", async (task) => {
        try {
            // Simplified task reopening - just mark as incomplete
            await workflowManager.markTaskComplete(task.id); // This will toggle completion
            uiManager.refresh();
            await notificationManager.showSuccess(`Task "${task.title}" reopened`);
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    const showAllTasks = vscode.commands.registerCommand("specMode.showAllTasks", async () => {
        try {
            const tasks = await workflowManager.getTasks();
            if (tasks.length === 0) {
                await notificationManager.showWarning("No tasks found. Complete the Tasks phase first.");
                return;
            }
            const taskItems = tasks.map((task) => ({
                label: task.completed ? `✅ ${task.title}` : `⏳ ${task.title}`,
                description: task.completed ? "Completed" : "Pending",
                detail: `Requirements: ${task.requirements.join(", ") || "None"}`,
                task: task,
            }));
            const selectedTask = await notificationManager.showQuickPick(taskItems, {
                placeHolder: "Select a task to view or execute",
            });
            if (selectedTask && !selectedTask.task.completed) {
                vscode.commands.executeCommand("specMode.executeTask", {
                    task: selectedTask.task,
                });
            }
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Copy prompts command - simplified
    const copyPrompts = vscode.commands.registerCommand("specMode.copyPrompts", async () => {
        try {
            if (!workflowManager.isActive()) {
                await notificationManager.showWarning("No active spec. Start a spec first to access prompts.");
                return;
            }
            const currentPhase = workflowManager.getCurrentPhase();
            const featureName = workflowManager.getCurrentFeature();
            let prompt = "";
            switch (currentPhase) {
                case "requirements":
                    prompt = workflowManager.getRequirementsPrompt();
                    break;
                case "design":
                    prompt = workflowManager.getDesignPrompt();
                    break;
                case "tasks":
                    prompt = workflowManager.getTasksPrompt();
                    break;
                default:
                    await notificationManager.showWarning("No prompts available for current phase");
                    return;
            }
            await clipboardManager_1.ClipboardManager.copyPromptWithEnhancements(prompt, `${currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} Phase Prompt`);
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Show guidance command - simplified
    const showGuidance = vscode.commands.registerCommand("specMode.showGuidance", async () => {
        try {
            const currentPhase = workflowManager.getCurrentPhase();
            const isActive = workflowManager.isActive();
            let message = "";
            let actions = [];
            if (!isActive) {
                message =
                    "💡 Welcome to Spec-Driven Development!\n\nStart by creating your first spec to begin the structured workflow.";
                actions = ["Start Spec", "Learn More"];
            }
            else {
                switch (currentPhase) {
                    case "requirements":
                        message =
                            "📝 Requirements Phase\n\nDefine user stories and acceptance criteria using EARS format.";
                        actions = ["Copy Prompt", "Next Phase"];
                        break;
                    case "design":
                        message =
                            "🎨 Design Phase\n\nCreate technical architecture and component design.";
                        actions = ["Copy Prompt", "Next Phase"];
                        break;
                    case "tasks":
                        message =
                            "📋 Tasks Phase\n\nBreak down design into actionable implementation tasks.";
                        actions = ["Copy Prompt", "Next Phase"];
                        break;
                    case "execution":
                        message =
                            "⚡ Execution Phase\n\nImplement tasks one by one with Copilot assistance.";
                        actions = ["Show Tasks", "Copy Prompt"];
                        break;
                }
            }
            const result = await notificationManager.showHelp("Guidance", message, actions);
            if (result === "Start Spec") {
                vscode.commands.executeCommand("specMode.start");
            }
            else if (result === "Copy Prompt") {
                vscode.commands.executeCommand("specMode.copyPrompts");
            }
            else if (result === "Next Phase") {
                vscode.commands.executeCommand("specMode.nextPhase");
            }
            else if (result === "Show Tasks") {
                vscode.commands.executeCommand("specMode.showAllTasks");
            }
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Status bar is now handled by UIManager
    // Welcome message for first-time users
    const hasShownWelcome = context.globalState.get("specMode.hasShownWelcome", false);
    if (!hasShownWelcome) {
        notificationManager.showWelcome();
        context.globalState.update("specMode.hasShownWelcome", true);
    }
    // Settings command
    const openSettings = vscode.commands.registerCommand("specMode.openSettings", async () => {
        try {
            await settingsManager.showQuickSettings();
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Reset spec command
    const resetSpec = vscode.commands.registerCommand("specMode.resetSpec", async () => {
        try {
            await workflowManager.resetSpec();
            uiManager.refresh();
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    // Restart current phase command
    const restartPhase = vscode.commands.registerCommand("specMode.restartPhase", async () => {
        try {
            await workflowManager.restartCurrentPhase();
            uiManager.refresh();
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
        }
    });
    context.subscriptions.push(startSpecMode, nextPhase, executeTask, executeTaskEnhanced, refresh, openFile, markComplete, reopenTask, showAllTasks, copyPrompts, showGuidance, openSettings, resetSpec, restartPhase, uiManager);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map