"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecWorkflowManager = exports.SpecPhase = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const clipboardManager_1 = require("./clipboardManager");
const errorHandler_1 = require("./errorHandler");
const userGuidance_1 = require("./userGuidance");
const validationSystem_1 = require("./validationSystem");
var SpecPhase;
(function (SpecPhase) {
    SpecPhase["REQUIREMENTS"] = "requirements";
    SpecPhase["DESIGN"] = "design";
    SpecPhase["TASKS"] = "tasks";
    SpecPhase["EXECUTION"] = "execution";
})(SpecPhase = exports.SpecPhase || (exports.SpecPhase = {}));
class SpecWorkflowManager {
    constructor() {
        this.currentFeature = "";
        this.currentPhase = SpecPhase.REQUIREMENTS;
        this.specPath = "";
        this.originalIdea = "";
        this.isSpecActive = false;
        this.lastActionTime = 0;
        this.DEBOUNCE_DELAY = 1000; // 1 second debounce
    }
    async startSpec(featureName, originalIdea) {
        try {
            // Validate workspace first
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                throw errorHandler_1.ErrorHandler.createWorkspaceError("No workspace folder found");
            }
            // Check if spec already exists
            const specPath = path.join(workspaceRoot, ".specs", featureName);
            if (fs.existsSync(specPath)) {
                const overwrite = await vscode.window.showWarningMessage(`Spec "${featureName}" already exists. Do you want to overwrite it?`, { modal: true }, "Overwrite", "Choose Different Name", "Cancel");
                if (overwrite === "Choose Different Name") {
                    const newName = await vscode.window.showInputBox({
                        prompt: "Enter a different feature name",
                        value: featureName + "-v2",
                        validateInput: (value) => {
                            if (!value || value.trim().length < 3) {
                                return "Feature name must be at least 3 characters";
                            }
                            if (fs.existsSync(path.join(workspaceRoot, ".specs", value))) {
                                return "This name already exists";
                            }
                            return null;
                        },
                    });
                    if (!newName)
                        return;
                    featureName = newName;
                }
                else if (overwrite !== "Overwrite") {
                    return;
                }
            }
            this.currentFeature = featureName;
            this.currentPhase = SpecPhase.REQUIREMENTS;
            this.originalIdea = originalIdea || featureName;
            this.isSpecActive = true;
            this.specPath = path.join(workspaceRoot, ".specs", featureName);
            // Create spec directory structure with error handling
            try {
                if (!fs.existsSync(this.specPath)) {
                    fs.mkdirSync(this.specPath, { recursive: true });
                }
            }
            catch (error) {
                throw new errorHandler_1.SpecError({
                    code: errorHandler_1.ErrorCode.DIRECTORY_CREATE_FAILED,
                    message: `Failed to create spec directory: ${error instanceof Error ? error.message : "Unknown error"}`,
                    userMessage: "Could not create spec directory",
                    recoveryActions: [
                        {
                            label: "Try Different Location",
                            description: "Choose a different location for spec files",
                            primary: true,
                            action: async () => {
                                const folder = await vscode.window.showOpenDialog({
                                    canSelectFolders: true,
                                    canSelectFiles: false,
                                    title: "Select directory for spec files",
                                });
                                if (folder && folder.length > 0) {
                                    this.specPath = path.join(folder[0].fsPath, featureName);
                                    fs.mkdirSync(this.specPath, { recursive: true });
                                }
                            },
                        },
                    ],
                    severity: "error",
                }, error instanceof Error ? error : new Error(String(error)));
            }
            // Show contextual guidance for getting started
            const guidance = await userGuidance_1.UserGuidanceProvider.getContextualGuidance(SpecPhase.REQUIREMENTS, { featureName, hasFiles: false });
            // Show welcome message with next steps
            const action = await vscode.window.showInformationMessage(`🚀 Started spec for "${featureName}". Ready to begin requirements phase!`, "Get Started", "Open Spec Panel", "Show Tips");
            if (action === "Get Started") {
                await userGuidance_1.UserGuidanceProvider.showGuidance(guidance);
            }
            else if (action === "Open Spec Panel") {
                await vscode.commands.executeCommand("workbench.view.extension.spec-container");
            }
            else if (action === "Show Tips") {
                const tips = guidance.tips;
                if (tips.length > 0) {
                    const tip = tips[Math.floor(Math.random() * tips.length)];
                    vscode.window.showInformationMessage(`💡 Tip: ${tip}`);
                }
            }
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }
    isActive() {
        return this.isSpecActive;
    }
    getCurrentFeature() {
        return this.currentFeature;
    }
    getCurrentPhase() {
        return this.currentPhase;
    }
    getRequirementsPrompt(featureName, originalIdea) {
        const ideaText = originalIdea || featureName;
        return `I'm starting a new feature spec for: "${ideaText}"

Feature name: ${featureName}

Please help me create a requirements document following this format:

# Requirements Document

## Introduction
[Brief summary of the feature]

## Requirements

### Requirement 1
**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria
1. WHEN [event] THEN [system] SHALL [response]
2. IF [precondition] THEN [system] SHALL [response]

Please create comprehensive requirements with user stories and EARS format acceptance criteria. Focus on:
- User experience and workflows
- Edge cases and error scenarios  
- Technical constraints
- Success criteria

Save the output to .specs/${featureName}/requirements.md when complete.`;
    }
    /**
     * Enhanced method to copy requirements prompt with better UX
     */
    async copyRequirementsPrompt(featureName, originalIdea) {
        const prompt = this.getRequirementsPrompt(featureName, originalIdea);
        const contextFiles = [`${this.specPath}/requirements.md (to be created)`];
        await clipboardManager_1.ClipboardManager.copyPromptWithEnhancements(prompt, "Requirements Phase Prompt", contextFiles);
    }
    async moveToNextPhase() {
        // Check for debouncing
        const now = Date.now();
        if (now - this.lastActionTime < this.DEBOUNCE_DELAY) {
            return {
                success: false,
                error: "Please wait before performing another action.",
            };
        }
        this.lastActionTime = now;
        // Validate current phase before transition
        const validation = await this.validateCurrentPhase();
        if (!validation.isValid) {
            return {
                success: false,
                error: `Cannot proceed to next phase. Issues found:\n${validation.errors.join("\n")}`,
            };
        }
        // Show confirmation dialog
        const confirmed = await this.showPhaseTransitionConfirmation();
        if (!confirmed) {
            return {
                success: false,
                error: "Phase transition cancelled by user.",
            };
        }
        // Perform the transition
        const nextPhase = this.getNextPhase();
        if (!nextPhase) {
            return {
                success: false,
                error: "Already in the final phase.",
            };
        }
        const previousPhase = this.currentPhase;
        this.currentPhase = nextPhase;
        // Show success feedback
        vscode.window.showInformationMessage(`✅ Successfully moved from ${previousPhase} to ${nextPhase} phase!`, "Continue");
        // Return appropriate prompt
        switch (nextPhase) {
            case SpecPhase.DESIGN:
                return { success: true, prompt: this.getDesignPrompt() };
            case SpecPhase.TASKS:
                return { success: true, prompt: this.getTasksPrompt() };
            case SpecPhase.EXECUTION:
                return { success: true };
            default:
                return { success: false, error: "Unknown phase transition." };
        }
    }
    async validateCurrentPhase() {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                throw errorHandler_1.ErrorHandler.createWorkspaceError("No workspace folder available for validation");
            }
            // Create validation context
            const context = {
                specPath: this.specPath,
                featureName: this.currentFeature,
                phase: this.currentPhase,
                files: await this.loadSpecFiles(),
                workspaceRoot,
            };
            // Use the new validation system
            const report = await validationSystem_1.ValidationSystem.validatePhase(this.currentPhase, context);
            // Show validation results to user
            if (report.summary.errors > 0 || report.summary.warnings > 0) {
                await validationSystem_1.ValidationSystem.showValidationResults(report);
            }
            // Convert to legacy format for compatibility
            const errors = report.results
                .filter((r) => !r.result.passed && r.rule.severity === "error")
                .map((r) => r.result.message);
            const warnings = report.results
                .filter((r) => !r.result.passed && r.rule.severity === "warning")
                .map((r) => r.result.message);
            return {
                isValid: errors.length === 0,
                errors,
                warnings,
            };
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
            return {
                isValid: false,
                errors: ["Validation failed due to system error"],
                warnings: [],
            };
        }
    }
    /**
     * Load spec files for validation
     */
    async loadSpecFiles() {
        const files = {};
        const fileNames = ["requirements.md", "design.md", "tasks.md"];
        for (const fileName of fileNames) {
            const filePath = path.join(this.specPath, fileName);
            try {
                if (fs.existsSync(filePath)) {
                    files[fileName] = fs.readFileSync(filePath, "utf8");
                }
            }
            catch (error) {
                // Log error but continue with other files
                console.warn(`Failed to load ${fileName}:`, error);
            }
        }
        return files;
    }
    async validateRequirementsPhase() {
        const errors = [];
        const warnings = [];
        const reqFile = path.join(this.specPath, "requirements.md");
        if (!fs.existsSync(reqFile)) {
            errors.push("Requirements file (requirements.md) does not exist.");
            return { isValid: false, errors, warnings };
        }
        const content = fs.readFileSync(reqFile, "utf8");
        // Check for basic structure
        if (!content.includes("# Requirements Document")) {
            warnings.push("Requirements document should have a proper header.");
        }
        if (!content.includes("User Story:")) {
            errors.push("Requirements should include user stories.");
        }
        if (!content.includes("WHEN") && !content.includes("SHALL")) {
            errors.push("Requirements should include EARS format acceptance criteria.");
        }
        if (content.trim().length < 200) {
            warnings.push("Requirements document seems quite short. Consider adding more detail.");
        }
        return { isValid: errors.length === 0, errors, warnings };
    }
    async validateDesignPhase() {
        const errors = [];
        const warnings = [];
        const designFile = path.join(this.specPath, "design.md");
        if (!fs.existsSync(designFile)) {
            errors.push("Design file (design.md) does not exist.");
            return { isValid: false, errors, warnings };
        }
        const content = fs.readFileSync(designFile, "utf8");
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
            warnings.push("Design document seems quite short. Consider adding more detail.");
        }
        return { isValid: errors.length === 0, errors, warnings };
    }
    async validateTasksPhase() {
        const errors = [];
        const warnings = [];
        const tasksFile = path.join(this.specPath, "tasks.md");
        if (!fs.existsSync(tasksFile)) {
            errors.push("Tasks file (tasks.md) does not exist.");
            return { isValid: false, errors, warnings };
        }
        const content = fs.readFileSync(tasksFile, "utf8");
        // Check for task checkboxes
        const taskMatches = content.match(/- \[[ x]\]/g);
        if (!taskMatches || taskMatches.length === 0) {
            errors.push("Tasks document should contain actionable tasks with checkboxes.");
        }
        else if (taskMatches.length < 3) {
            warnings.push("Consider breaking down the work into more granular tasks.");
        }
        // Check for requirement references
        if (!content.includes("_Requirements:")) {
            warnings.push("Tasks should reference specific requirements.");
        }
        return { isValid: errors.length === 0, errors, warnings };
    }
    async showPhaseTransitionConfirmation() {
        const currentPhaseName = this.currentPhase.charAt(0).toUpperCase() + this.currentPhase.slice(1);
        const nextPhase = this.getNextPhase();
        const nextPhaseName = nextPhase
            ? nextPhase.charAt(0).toUpperCase() + nextPhase.slice(1)
            : "Unknown";
        const message = `Are you ready to move from ${currentPhaseName} to ${nextPhaseName} phase?\n\nThis will advance your spec workflow. Make sure you've completed all work in the current phase.`;
        const result = await vscode.window.showWarningMessage(message, { modal: true }, "Yes, Continue", "Cancel");
        return result === "Yes, Continue";
    }
    getNextPhase() {
        switch (this.currentPhase) {
            case SpecPhase.REQUIREMENTS:
                return SpecPhase.DESIGN;
            case SpecPhase.DESIGN:
                return SpecPhase.TASKS;
            case SpecPhase.TASKS:
                return SpecPhase.EXECUTION;
            default:
                return null;
        }
    }
    getDesignPrompt() {
        return `Now let's create the design document for "${this.currentFeature}". Please read the requirements from .specs/${this.currentFeature}/requirements.md and create a comprehensive design document with these sections:

# Design Document

## Overview
## Architecture  
## Components and Interfaces
## Data Models
## Error Handling
## Testing Strategy

Include Mermaid diagrams where helpful. Address all requirements from the requirements document. Save to .specs/${this.currentFeature}/design.md when complete.`;
    }
    /**
     * Enhanced method to copy design prompt with context
     */
    async copyDesignPrompt() {
        const prompt = this.getDesignPrompt();
        const contextFiles = [
            `${this.specPath}/requirements.md`,
            `${this.specPath}/design.md (to be created)`,
        ];
        await clipboardManager_1.ClipboardManager.copyPromptWithEnhancements(prompt, "Design Phase Prompt", contextFiles);
    }
    getTasksPrompt() {
        return `Now create the implementation task list for "${this.currentFeature}". Please read both the requirements and design documents, then create a detailed task list following this format:

# Implementation Plan

- [ ] 1. Task title
  - Task details and context
  - _Requirements: 1.1, 2.3_

- [ ] 2. Another task
- [ ] 2.1 Sub-task
  - Sub-task details
  - _Requirements: 1.2_

Focus ONLY on coding tasks that can be executed by a developer. Each task should:
- Be specific and actionable
- Reference relevant requirements
- Build incrementally on previous tasks
- Include testing where appropriate

Save to .specs/${this.currentFeature}/tasks.md when complete.`;
    }
    /**
     * Enhanced method to copy tasks prompt with context
     */
    async copyTasksPrompt() {
        const prompt = this.getTasksPrompt();
        const contextFiles = [
            `${this.specPath}/requirements.md`,
            `${this.specPath}/design.md`,
            `${this.specPath}/tasks.md (to be created)`,
        ];
        await clipboardManager_1.ClipboardManager.copyPromptWithEnhancements(prompt, "Tasks Phase Prompt", contextFiles);
    }
    getTaskExecutionPrompt(task) {
        return `Execute this implementation task for the "${this.currentFeature}" feature:

**Task:** ${task.title}

Please read the context from:
- .specs/${this.currentFeature}/requirements.md
- .specs/${this.currentFeature}/design.md  
- .specs/${this.currentFeature}/tasks.md

Focus only on this specific task. Implement the code, create tests if needed, and ensure it integrates with previous work. Mark the task as complete when done.

Referenced requirements: ${task.requirements.join(", ")}`;
    }
    /**
     * Enhanced method to copy task execution prompt with context
     */
    async copyTaskExecutionPrompt(task) {
        const prompt = this.getTaskExecutionPrompt(task);
        const contextFiles = [
            `${this.specPath}/requirements.md`,
            `${this.specPath}/design.md`,
            `${this.specPath}/tasks.md`,
        ];
        await clipboardManager_1.ClipboardManager.copyPromptWithEnhancements(prompt, `Task: ${task.title}`, contextFiles);
    }
    /**
     * Get multiple prompt options for current phase
     * Addresses requirement 8.2
     */
    async getAvailablePrompts() {
        const prompts = [];
        switch (this.currentPhase) {
            case SpecPhase.REQUIREMENTS:
                prompts.push(clipboardManager_1.ClipboardManager.createPromptOption("requirements", "Requirements Phase Prompt", this.getRequirementsPrompt(this.currentFeature, this.originalIdea), "Generate comprehensive requirements document with user stories and EARS format", [`${this.specPath}/requirements.md (to be created)`]));
                break;
            case SpecPhase.DESIGN:
                prompts.push(clipboardManager_1.ClipboardManager.createPromptOption("design", "Design Phase Prompt", this.getDesignPrompt(), "Create technical architecture and design document", [
                    `${this.specPath}/requirements.md`,
                    `${this.specPath}/design.md (to be created)`,
                ]));
                break;
            case SpecPhase.TASKS:
                prompts.push(clipboardManager_1.ClipboardManager.createPromptOption("tasks", "Tasks Phase Prompt", this.getTasksPrompt(), "Break down design into actionable implementation tasks", [
                    `${this.specPath}/requirements.md`,
                    `${this.specPath}/design.md`,
                    `${this.specPath}/tasks.md (to be created)`,
                ]));
                break;
            case SpecPhase.EXECUTION:
                const tasks = await this.getTasks();
                const incompleteTasks = tasks.filter((t) => !t.completed);
                for (const task of incompleteTasks.slice(0, 5)) {
                    // Limit to first 5 incomplete tasks
                    prompts.push(clipboardManager_1.ClipboardManager.createPromptOption(`task-${task.id}`, `Task: ${task.title}`, this.getTaskExecutionPrompt(task), `Execute implementation task: ${task.title}`, [
                        `${this.specPath}/requirements.md`,
                        `${this.specPath}/design.md`,
                        `${this.specPath}/tasks.md`,
                    ]));
                }
                break;
        }
        return prompts;
    }
    /**
     * Copy from multiple available prompts
     */
    async copyFromAvailablePrompts() {
        const prompts = await this.getAvailablePrompts();
        await clipboardManager_1.ClipboardManager.copyFromMultiplePrompts(prompts);
    }
    async getTasks() {
        const tasksFile = path.join(this.specPath, "tasks.md");
        if (!fs.existsSync(tasksFile)) {
            return [];
        }
        const content = fs.readFileSync(tasksFile, "utf8");
        return this.parseTasksFromMarkdown(content);
    }
    parseTasksFromMarkdown(content) {
        const tasks = [];
        const lines = content.split("\n");
        for (const line of lines) {
            const taskMatch = line.match(/^- \[([ x])\] (.+)/);
            if (taskMatch) {
                const completed = taskMatch[1] === "x";
                const title = taskMatch[2];
                const requirementsMatch = content.match(/_Requirements: ([^_]+)_/);
                const requirements = requirementsMatch
                    ? requirementsMatch[1].split(", ")
                    : [];
                tasks.push({
                    id: `task-${tasks.length}`,
                    title,
                    completed,
                    requirements,
                });
            }
        }
        return tasks;
    }
    async markTaskComplete(taskId) {
        try {
            const tasksFile = path.join(this.specPath, "tasks.md");
            if (!fs.existsSync(tasksFile)) {
                throw errorHandler_1.ErrorHandler.createFileNotFoundError(tasksFile, { taskId });
            }
            let content;
            try {
                content = fs.readFileSync(tasksFile, "utf8");
            }
            catch (error) {
                throw new errorHandler_1.SpecError({
                    code: errorHandler_1.ErrorCode.FILE_PERMISSION_DENIED,
                    message: `Cannot read tasks file: ${error instanceof Error ? error.message : "Unknown error"}`,
                    userMessage: "Cannot access tasks file",
                    recoveryActions: [
                        {
                            label: "Check Permissions",
                            description: "Check file permissions and try again",
                            primary: true,
                            action: async () => {
                                await vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(tasksFile));
                            },
                        },
                    ],
                    context: { tasksFile, taskId },
                    severity: "error",
                }, error instanceof Error ? error : new Error(String(error)));
            }
            const lines = content.split("\n");
            let taskFound = false;
            for (let i = 0; i < lines.length; i++) {
                const taskMatch = lines[i].match(/^- \[ \] (.+)/);
                if (taskMatch && lines[i].includes(taskId)) {
                    lines[i] = lines[i].replace("- [ ]", "- [x]");
                    taskFound = true;
                    break;
                }
            }
            if (!taskFound) {
                throw new errorHandler_1.SpecError({
                    code: errorHandler_1.ErrorCode.TASK_NOT_FOUND,
                    message: `Task with ID "${taskId}" not found or already completed`,
                    userMessage: "Task not found or already completed",
                    recoveryActions: [
                        {
                            label: "Refresh Tasks",
                            description: "Refresh the task list and try again",
                            primary: true,
                            action: async () => {
                                await vscode.commands.executeCommand("specMode.refresh");
                            },
                        },
                        {
                            label: "View Tasks File",
                            description: "Open tasks file to check task status",
                            action: async () => {
                                await vscode.window.showTextDocument(vscode.Uri.file(tasksFile));
                            },
                        },
                    ],
                    context: { taskId, tasksFile },
                    severity: "error",
                });
            }
            try {
                fs.writeFileSync(tasksFile, lines.join("\n"));
                // Show progress encouragement
                const tasks = await this.getTasks();
                const completedTasks = tasks.filter((t) => t.completed).length;
                const encouragement = userGuidance_1.UserGuidanceProvider.getProgressEncouragement(completedTasks, tasks.length);
                vscode.window.showInformationMessage(encouragement);
                return true;
            }
            catch (error) {
                throw new errorHandler_1.SpecError({
                    code: errorHandler_1.ErrorCode.FILE_WRITE_FAILED,
                    message: `Failed to save task completion: ${error instanceof Error ? error.message : "Unknown error"}`,
                    userMessage: "Could not save task completion",
                    recoveryActions: [
                        {
                            label: "Retry Save",
                            description: "Try saving the task completion again",
                            primary: true,
                            action: async () => {
                                fs.writeFileSync(tasksFile, lines.join("\n"));
                            },
                        },
                        {
                            label: "Manual Edit",
                            description: "Open file to manually mark task complete",
                            action: async () => {
                                await vscode.window.showTextDocument(vscode.Uri.file(tasksFile));
                            },
                        },
                    ],
                    context: { taskId, tasksFile },
                    severity: "error",
                }, error instanceof Error ? error : new Error(String(error)));
            }
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
            return false;
        }
    }
    async getSpecFiles() {
        if (!this.specPath)
            return [];
        const files = [
            {
                name: "requirements.md",
                path: path.join(this.specPath, "requirements.md"),
            },
            { name: "design.md", path: path.join(this.specPath, "design.md") },
            { name: "tasks.md", path: path.join(this.specPath, "tasks.md") },
        ];
        return files.map((file) => ({
            ...file,
            exists: fs.existsSync(file.path),
        }));
    }
    getProgressSummary() {
        const phaseNames = Object.values(SpecPhase);
        const currentIndex = phaseNames.indexOf(this.currentPhase);
        return `${currentIndex + 1}/${phaseNames.length} phases complete`;
    }
}
exports.SpecWorkflowManager = SpecWorkflowManager;
//# sourceMappingURL=specWorkflowManager.js.map