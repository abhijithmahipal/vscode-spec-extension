"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowManager = exports.SpecPhase = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const errorHandler_1 = require("../errorHandler");
var SpecPhase;
(function (SpecPhase) {
    SpecPhase["REQUIREMENTS"] = "requirements";
    SpecPhase["DESIGN"] = "design";
    SpecPhase["TASKS"] = "tasks";
    SpecPhase["EXECUTION"] = "execution";
})(SpecPhase = exports.SpecPhase || (exports.SpecPhase = {}));
/**
 * Consolidated Workflow Manager
 * Combines functionality from SpecWorkflowManager and related components
 * Addresses requirements 1.1, 1.2, 1.3
 */
class WorkflowManager {
    constructor(notificationManager, fileManager, validationManager) {
        this.notificationManager = notificationManager;
        this.fileManager = fileManager;
        this.validationManager = validationManager;
        this.currentFeature = "";
        this.currentPhase = SpecPhase.REQUIREMENTS;
        this.specPath = "";
        this.originalIdea = "";
        this.isSpecActive = false;
        this.lastActionTime = 0;
        this.DEBOUNCE_DELAY = 1000;
    }
    async startSpec(featureName, originalIdea) {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                throw errorHandler_1.ErrorHandler.createWorkspaceError("No workspace folder found");
            }
            // Check if spec already exists
            const specPath = path.join(workspaceRoot, ".kiro", "specs", featureName);
            if (fs.existsSync(specPath)) {
                const overwrite = await this.notificationManager.showConfirmation(`Spec "${featureName}" already exists. Do you want to overwrite it?`, ["Overwrite", "Choose Different Name", "Cancel"]);
                if (overwrite === "Choose Different Name") {
                    const newName = await vscode.window.showInputBox({
                        prompt: "Enter a different feature name",
                        value: featureName + "-v2",
                        validateInput: (value) => {
                            if (!value || value.trim().length < 3) {
                                return "Feature name must be at least 3 characters";
                            }
                            if (fs.existsSync(path.join(workspaceRoot, ".kiro", "specs", value))) {
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
            this.specPath = path.join(workspaceRoot, ".kiro", "specs", featureName);
            // Create spec directory
            await this.fileManager.createDirectory(this.specPath);
            // Show success notification
            await this.notificationManager.showSuccess(`🚀 Started spec for "${featureName}"! Requirements prompt is ready.`, ["Open Copilot Chat", "View Spec Panel"]);
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
    async moveToNextPhase() {
        // Debounce check
        const now = Date.now();
        if (now - this.lastActionTime < this.DEBOUNCE_DELAY) {
            return {
                success: false,
                error: "Please wait before performing another action.",
            };
        }
        this.lastActionTime = now;
        // Validate current phase
        const validation = await this.validationManager.validatePhase(this.currentPhase, {
            specPath: this.specPath,
            featureName: this.currentFeature,
            phase: this.currentPhase,
            files: await this.loadSpecFiles(),
            workspaceRoot: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "",
        });
        if (!validation.isValid) {
            return {
                success: false,
                error: `Cannot proceed to next phase. Issues found:\n${validation.errors.join("\n")}`,
            };
        }
        // Show confirmation
        const confirmed = await this.showPhaseTransitionConfirmation();
        if (!confirmed) {
            return {
                success: false,
                error: "Phase transition cancelled by user.",
            };
        }
        // Perform transition
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
        await this.notificationManager.showSuccess(`✅ Successfully moved from ${previousPhase} to ${nextPhase} phase!`);
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
    async loadSpecFiles() {
        const files = {};
        const fileNames = ["requirements.md", "design.md", "tasks.md"];
        for (const fileName of fileNames) {
            const filePath = path.join(this.specPath, fileName);
            try {
                if (fs.existsSync(filePath)) {
                    files[fileName] = await this.fileManager.readFile(filePath);
                }
            }
            catch (error) {
                console.warn(`Failed to load ${fileName}:`, error);
            }
        }
        return files;
    }
    async showPhaseTransitionConfirmation() {
        const currentPhaseName = this.currentPhase.charAt(0).toUpperCase() + this.currentPhase.slice(1);
        const nextPhase = this.getNextPhase();
        const nextPhaseName = nextPhase
            ? nextPhase.charAt(0).toUpperCase() + nextPhase.slice(1)
            : "Unknown";
        const message = `Are you ready to move from ${currentPhaseName} to ${nextPhaseName} phase?\n\nThis will advance your spec workflow. Make sure you've completed all work in the current phase.`;
        const result = await this.notificationManager.showConfirmation(message, [
            "Yes, Continue",
            "Cancel",
        ]);
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

Save the output to .kiro/specs/${featureName}/requirements.md when complete.`;
    }
    async getTasks() {
        const tasksFile = path.join(this.specPath, "tasks.md");
        if (!fs.existsSync(tasksFile)) {
            return [];
        }
        const content = await this.fileManager.readFile(tasksFile);
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
            let content = await this.fileManager.readFile(tasksFile);
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
                throw new Error(`Task with ID "${taskId}" not found or already completed`);
            }
            await this.fileManager.writeFile(tasksFile, lines.join("\n"));
            // Show progress encouragement
            const tasks = await this.getTasks();
            const completedTasks = tasks.filter((t) => t.completed).length;
            const encouragement = this.getProgressEncouragement(completedTasks, tasks.length);
            await this.notificationManager.showSuccess(encouragement);
            return true;
        }
        catch (error) {
            await errorHandler_1.ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
            return false;
        }
    }
    getProgressEncouragement(completedTasks, totalTasks) {
        const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        if (percentage === 100) {
            return "🎉 Congratulations! All tasks completed!";
        }
        else if (percentage >= 75) {
            return "🚀 Almost there! You're doing great!";
        }
        else if (percentage >= 50) {
            return "💪 Great progress! Keep it up!";
        }
        else if (percentage >= 25) {
            return "📈 Good start! You're making progress!";
        }
        else {
            return "🌟 Every journey begins with a single step!";
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
    getDesignPrompt() {
        return `Now let's create the design document for "${this.currentFeature}". Please read the requirements from .kiro/specs/${this.currentFeature}/requirements.md and create a comprehensive design document with these sections:

# Design Document

## Overview
## Architecture  
## Components and Interfaces
## Data Models
## Error Handling
## Testing Strategy

Include Mermaid diagrams where helpful. Address all requirements from the requirements document. Save to .kiro/specs/${this.currentFeature}/design.md when complete.`;
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

Save to .kiro/specs/${this.currentFeature}/tasks.md when complete.`;
    }
    getTaskExecutionPrompt(task) {
        return `Execute this implementation task for the "${this.currentFeature}" feature:

**Task:** ${task.title}

Please read the context from:
- .kiro/specs/${this.currentFeature}/requirements.md
- .kiro/specs/${this.currentFeature}/design.md  
- .kiro/specs/${this.currentFeature}/tasks.md

Focus only on this specific task. Implement the code, create tests if needed, and ensure it integrates with previous work. Mark the task as complete when done.

Referenced requirements: ${task.requirements.join(", ")}`;
    }
}
exports.WorkflowManager = WorkflowManager;
//# sourceMappingURL=workflowManager.js.map