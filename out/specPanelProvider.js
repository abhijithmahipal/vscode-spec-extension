"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecHelpProvider = exports.SpecFilesProvider = exports.SpecPanelProvider = void 0;
const vscode = require("vscode");
const specWorkflowManager_1 = require("./specWorkflowManager");
// Text wrapping and formatting utilities
class TextFormatter {
    static formatLabel(text) {
        if (text.length <= this.MAX_LABEL_LENGTH) {
            return text;
        }
        return text.substring(0, this.MAX_LABEL_LENGTH - 3) + "...";
    }
    static formatDescription(text) {
        if (text.length <= this.MAX_DESCRIPTION_LENGTH) {
            return text;
        }
        return text.substring(0, this.MAX_DESCRIPTION_LENGTH - 3) + "...";
    }
    static formatTooltip(text) {
        if (text.length <= this.MAX_TOOLTIP_LINE_LENGTH) {
            return text;
        }
        const words = text.split(" ");
        const lines = [];
        let currentLine = "";
        for (const word of words) {
            if ((currentLine + " " + word).length <= this.MAX_TOOLTIP_LINE_LENGTH) {
                currentLine = currentLine ? currentLine + " " + word : word;
            }
            else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
        return lines.join("\n");
    }
    static createMultiLineTooltip(label, description, additionalInfo) {
        const parts = [];
        if (label) {
            parts.push(this.formatTooltip(label));
        }
        if (description && description !== label) {
            parts.push("");
            parts.push(this.formatTooltip(description));
        }
        if (additionalInfo) {
            parts.push("");
            parts.push(this.formatTooltip(additionalInfo));
        }
        return parts.join("\n");
    }
    static truncateWithEllipsis(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + "...";
    }
    // Smart text wrapping for different content types
    static wrapTextForTreeView(text, maxWidth = 50) {
        if (text.length <= maxWidth) {
            return text;
        }
        // Try to break at word boundaries
        const words = text.split(" ");
        let result = "";
        let currentLine = "";
        for (const word of words) {
            if ((currentLine + " " + word).length <= maxWidth) {
                currentLine = currentLine ? currentLine + " " + word : word;
            }
            else {
                if (currentLine) {
                    result = result ? result + "\n" + currentLine : currentLine;
                }
                currentLine = word;
            }
        }
        if (currentLine) {
            result = result ? result + "\n" + currentLine : currentLine;
        }
        // If still too long, truncate with ellipsis
        const lines = result.split("\n");
        if (lines.length > 2) {
            return lines[0] + "\n" + lines[1].substring(0, maxWidth - 3) + "...";
        }
        return result;
    }
    // Responsive formatting based on estimated panel size
    static getResponsiveLengths(panelSize = "normal") {
        const lengths = {
            compact: { label: 35, description: 50 },
            normal: { label: 50, description: 80 },
            wide: { label: 70, description: 120 },
        };
        return lengths[panelSize];
    }
}
TextFormatter.MAX_LABEL_LENGTH = 50;
TextFormatter.MAX_DESCRIPTION_LENGTH = 80;
TextFormatter.MAX_TOOLTIP_LINE_LENGTH = 60;
class SpecPanelProvider {
    constructor(extensionUri, workflowManager) {
        this.extensionUri = extensionUri;
        this.workflowManager = workflowManager;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        // Panel size estimation for responsive text formatting
        this.panelSize = "normal";
    }
    // Method to update panel size (could be called from extension when panel resizes)
    updatePanelSize(size) {
        this.panelSize = size;
        this.refresh();
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!element) {
            const isActive = this.workflowManager.isActive();
            if (!isActive) {
                return [
                    new SpecItem("🚀 Start Your First Spec", "Click to begin spec-driven development", vscode.TreeItemCollapsibleState.None, "start-hint", {
                        command: "specMode.start",
                        title: "Start Spec Mode",
                    }, "Create a new feature specification following the structured workflow process"),
                    new SpecItem("💡 What is Spec Mode?", "Structured workflow: Requirements → Design → Tasks → Code", vscode.TreeItemCollapsibleState.None, "info", undefined, "A systematic approach to feature development that ensures thorough planning before implementation"),
                    new SpecItem("🤖 Works with GitHub Copilot", "Get context-aware prompts for each phase", vscode.TreeItemCollapsibleState.None, "info", undefined, "Automatically generates contextual prompts that help Copilot understand your feature requirements and design"),
                ];
            }
            const currentPhase = this.workflowManager.getCurrentPhase();
            const currentFeature = this.workflowManager.getCurrentFeature();
            const items = [];
            // Feature header with proper text handling
            const featureDisplayName = currentFeature.length > 30
                ? currentFeature.substring(0, 27) + "..."
                : currentFeature;
            items.push(new SpecItem(`📋 ${featureDisplayName}`, "Current feature in development", vscode.TreeItemCollapsibleState.None, "feature-header", undefined, `Full feature name: ${currentFeature}`));
            // Phase indicator with progress and detailed description
            const phaseEmoji = this.getPhaseEmoji(currentPhase);
            const phaseProgress = this.getPhaseProgress(currentPhase);
            const phaseName = currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1);
            const phaseDescription = this.getPhaseDescription(currentPhase);
            items.push(new SpecItem(`${phaseEmoji} ${phaseName} Phase`, `${phaseProgress} - ${phaseDescription}`, vscode.TreeItemCollapsibleState.None, "phase-indicator", undefined, `Current phase: ${phaseName}. Progress: ${phaseProgress}. ${phaseDescription}`));
            // Add visual separator
            items.push(this.createSeparator());
            // Phase-specific actions with validation status
            if (currentPhase !== specWorkflowManager_1.SpecPhase.EXECUTION) {
                const validationStatus = await this.getPhaseValidationStatus(currentPhase);
                const nextPhaseLabel = validationStatus.canProceed
                    ? "➡️ Move to Next Phase"
                    : "⚠️ Complete Current Phase";
                const nextPhaseDescription = validationStatus.canProceed
                    ? "Ready to advance to next phase"
                    : `Issues to resolve: ${validationStatus.issueCount}`;
                items.push(new SpecItem(nextPhaseLabel, nextPhaseDescription, vscode.TreeItemCollapsibleState.None, "next-phase", {
                    command: "specMode.nextPhase",
                    title: "Next Phase",
                }));
                // Show validation issues if any
                if (!validationStatus.canProceed &&
                    validationStatus.issues.length > 0) {
                    // Add section header for validation issues
                    items.push(this.createSectionHeader("Issues to Resolve", `${validationStatus.issues.length} validation issues found`));
                    for (const issue of validationStatus.issues.slice(0, 3)) {
                        // Show max 3 issues with proper text handling
                        const shortIssue = issue.length > 40 ? issue.substring(0, 37) + "..." : issue;
                        items.push(new SpecItem(`⚠️ ${shortIssue}`, "Click to resolve this issue", vscode.TreeItemCollapsibleState.None, "validation-issue", undefined, `Validation Issue: ${issue}. This needs to be resolved before proceeding to the next phase.`));
                    }
                    // Show count if there are more issues
                    if (validationStatus.issues.length > 3) {
                        items.push(new SpecItem(`⚠️ +${validationStatus.issues.length - 3} more issues`, "Additional validation issues need attention", vscode.TreeItemCollapsibleState.None, "validation-issue", undefined, `There are ${validationStatus.issues.length - 3} additional validation issues that need to be resolved.`));
                    }
                }
            }
            // Show tasks if in execution phase
            if (currentPhase === specWorkflowManager_1.SpecPhase.EXECUTION) {
                const tasks = await this.workflowManager.getTasks();
                const completedTasks = tasks.filter((t) => t.completed).length;
                // Add section header for tasks
                items.push(this.createSectionHeader("Implementation Tasks", "Execute tasks one by one with Copilot assistance"));
                items.push(this.createProgressItem(completedTasks, tasks.length, "Overall Progress"));
                for (const task of tasks) {
                    const statusIcon = task.completed ? "✅" : "⏳";
                    const taskTitle = `${statusIcon} ${task.title}`;
                    const taskDescription = task.completed
                        ? "Completed successfully"
                        : "Ready to execute with Copilot assistance";
                    const taskItem = new SpecItem(taskTitle, taskDescription, vscode.TreeItemCollapsibleState.None, task.completed ? "task-complete" : "task-incomplete", undefined, `Task: ${task.title}. Status: ${task.completed ? "Completed" : "Pending"}. Requirements: ${task.requirements.join(", ") || "No requirements specified."}`);
                    if (!task.completed) {
                        taskItem.command = {
                            command: "specMode.executeTask",
                            title: "Execute Task",
                            arguments: [{ task }],
                        };
                    }
                    items.push(taskItem);
                }
                if (tasks.length === 0) {
                    items.push(new SpecItem("⚠️ No tasks found", "Complete the Tasks phase first", vscode.TreeItemCollapsibleState.None, "warning"));
                }
            }
            // Add visual separator before actions
            if (items.length > 0) {
                items.push(this.createSeparator());
            }
            // Enhanced clipboard actions
            items.push(new SpecItem("📋 Copy Prompts", "Choose from available prompts with preview", vscode.TreeItemCollapsibleState.None, "copy-prompts", {
                command: "specMode.copyPrompts",
                title: "Copy Prompts",
            }, "Access enhanced clipboard functionality with prompt preview, multiple options, and fallback methods"));
            // User guidance action
            items.push(new SpecItem("💡 Get Guidance", "Show contextual help and next steps", vscode.TreeItemCollapsibleState.None, "show-guidance", {
                command: "specMode.showGuidance",
                title: "Show Guidance",
            }, "Get personalized guidance based on your current phase and progress"));
            // Add visual separator before hints
            items.push(this.createSeparator());
            // Phase hints
            items.push(...this.getPhaseHints(currentPhase));
            return items;
        }
        return [];
    }
    getPhaseEmoji(phase) {
        switch (phase) {
            case specWorkflowManager_1.SpecPhase.REQUIREMENTS:
                return "📝";
            case specWorkflowManager_1.SpecPhase.DESIGN:
                return "🎨";
            case specWorkflowManager_1.SpecPhase.TASKS:
                return "📋";
            case specWorkflowManager_1.SpecPhase.EXECUTION:
                return "⚡";
            default:
                return "📄";
        }
    }
    getPhaseProgress(phase) {
        switch (phase) {
            case specWorkflowManager_1.SpecPhase.REQUIREMENTS:
                return "1/4";
            case specWorkflowManager_1.SpecPhase.DESIGN:
                return "2/4";
            case specWorkflowManager_1.SpecPhase.TASKS:
                return "3/4";
            case specWorkflowManager_1.SpecPhase.EXECUTION:
                return "4/4";
            default:
                return "0/4";
        }
    }
    getPhaseDescription(phase) {
        switch (phase) {
            case specWorkflowManager_1.SpecPhase.REQUIREMENTS:
                return "Define user stories and acceptance criteria";
            case specWorkflowManager_1.SpecPhase.DESIGN:
                return "Create architecture and technical design";
            case specWorkflowManager_1.SpecPhase.TASKS:
                return "Break down into implementation tasks";
            case specWorkflowManager_1.SpecPhase.EXECUTION:
                return "Execute tasks with Copilot assistance";
            default:
                return "";
        }
    }
    async getPhaseValidationStatus(phase) {
        // This is a simplified validation - in a real implementation,
        // we would call the workflow manager's validation methods
        const specFiles = await this.workflowManager.getSpecFiles();
        const currentPhaseFile = specFiles.find((f) => f.name === `${phase}.md`);
        if (!currentPhaseFile?.exists) {
            return {
                canProceed: false,
                issueCount: 1,
                issues: [`${phase}.md file does not exist`],
            };
        }
        // For now, assume we can proceed if the file exists
        // In a full implementation, this would use the validation methods from SpecWorkflowManager
        return {
            canProceed: true,
            issueCount: 0,
            issues: [],
        };
    }
    getPhaseHints(phase) {
        const hints = [];
        switch (phase) {
            case specWorkflowManager_1.SpecPhase.REQUIREMENTS:
                hints.push(new SpecItem("💡 Focus on user needs", 'Write clear user stories with "As a... I want... So that..."', vscode.TreeItemCollapsibleState.None, "hint", undefined, 'User stories should follow the format: "As a [role], I want [feature], so that [benefit]". This helps ensure you\'re building features that provide real value to users.'), new SpecItem("💡 Use EARS format", "WHEN [event] THEN [system] SHALL [response]", vscode.TreeItemCollapsibleState.None, "hint", undefined, 'EARS (Easy Approach to Requirements Syntax) helps write clear, testable requirements. Example: "WHEN a user clicks submit THEN the system SHALL validate all required fields".'));
                break;
            case specWorkflowManager_1.SpecPhase.DESIGN:
                hints.push(new SpecItem("💡 Think architecture", "Consider components, data flow, and interfaces", vscode.TreeItemCollapsibleState.None, "hint", undefined, "Good design considers: What are the main components? How do they communicate? What are the key interfaces? How does data flow through the system?"), new SpecItem("💡 Address all requirements", "Ensure your design covers every requirement", vscode.TreeItemCollapsibleState.None, "hint", undefined, "Review each requirement from the previous phase and ensure your design addresses it. This prevents gaps in implementation."));
                break;
            case specWorkflowManager_1.SpecPhase.TASKS:
                hints.push(new SpecItem("💡 Small, actionable tasks", "Each task should be completable in one session", vscode.TreeItemCollapsibleState.None, "hint", undefined, "Break down complex features into small, focused tasks. Each task should be something you can complete in 1-2 hours and should result in working, testable code."), new SpecItem("💡 Reference requirements", "Link tasks back to specific requirements", vscode.TreeItemCollapsibleState.None, "hint", undefined, "Each task should reference which requirements it addresses. This ensures complete coverage and helps with testing and validation."));
                break;
            case specWorkflowManager_1.SpecPhase.EXECUTION:
                hints.push(new SpecItem("💡 One task at a time", "Focus on completing each task fully", vscode.TreeItemCollapsibleState.None, "hint", undefined, "Complete each task fully before moving to the next. This includes writing code, tests, and verifying the functionality works as expected."), new SpecItem("💡 Test as you go", "Write tests and verify functionality", vscode.TreeItemCollapsibleState.None, "hint", undefined, "Write tests for each piece of functionality as you implement it. This ensures your code works correctly and makes future changes safer."));
                break;
        }
        return hints;
    }
    // Create visual separator for better layout
    createSeparator() {
        return new SpecItem("─────────────────────", "", vscode.TreeItemCollapsibleState.None, "separator");
    }
    // Create section header with improved styling
    createSectionHeader(title, description) {
        return new SpecItem(`▶ ${title}`, description, vscode.TreeItemCollapsibleState.None, "section-header", undefined, `Section: ${title}. ${description}`);
    }
    // Enhanced progress display with visual indicators
    createProgressItem(completed, total, label) {
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        const progressBar = this.createProgressBar(percentage);
        return new SpecItem(`${progressBar} ${label}`, `${completed}/${total} completed (${percentage}%)`, vscode.TreeItemCollapsibleState.None, "progress", undefined, `Progress: ${completed} out of ${total} items completed. ${percentage}% complete.`);
    }
    // Create ASCII progress bar
    createProgressBar(percentage) {
        const barLength = 10;
        const filledLength = Math.round((percentage / 100) * barLength);
        const filled = "█".repeat(filledLength);
        const empty = "░".repeat(barLength - filledLength);
        return `[${filled}${empty}]`;
    }
}
exports.SpecPanelProvider = SpecPanelProvider;
class SpecFilesProvider {
    constructor(workflowManager) {
        this.workflowManager = workflowManager;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren() {
        if (!this.workflowManager.isActive()) {
            return [];
        }
        const files = await this.workflowManager.getSpecFiles();
        return files.map((file) => new SpecFileItem(file.name, file.exists ? "✅ Created" : "⏳ Pending", file.path, file.exists ? "spec-file" : "spec-file-pending"));
    }
}
exports.SpecFilesProvider = SpecFilesProvider;
class SpecHelpProvider {
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        return [
            new HelpItem("🚀 Getting Started", 'Click "Start New Spec" to begin your first feature specification'),
            new HelpItem("📝 Requirements Phase", "Define user stories and acceptance criteria using EARS format"),
            new HelpItem("🎨 Design Phase", "Create technical architecture and component design"),
            new HelpItem("📋 Tasks Phase", "Break down design into small, actionable coding tasks"),
            new HelpItem("⚡ Execution Phase", "Implement tasks one by one with Copilot assistance"),
            new HelpItem("🤖 Copilot Integration", "Context-aware prompts are automatically copied to clipboard"),
            new HelpItem("📁 File Structure", "All spec files are organized in .kiro/specs/{feature-name}/ directory"),
        ];
    }
}
exports.SpecHelpProvider = SpecHelpProvider;
class SpecItem extends vscode.TreeItem {
    constructor(label, description, collapsibleState, contextValue, command, additionalInfo) {
        super(TextFormatter.formatLabel(label), collapsibleState);
        this.label = label;
        this.description = description;
        this.collapsibleState = collapsibleState;
        this.contextValue = contextValue;
        this.additionalInfo = additionalInfo;
        // Format description with proper length handling
        this.description = TextFormatter.formatDescription(description);
        // Create comprehensive tooltip with proper text wrapping
        this.tooltip = TextFormatter.createMultiLineTooltip(label, description, additionalInfo);
        this.command = command;
        // Add visual indicators for different item types
        this.iconPath = this.getIconForContextValue(contextValue);
    }
    getIconForContextValue(contextValue) {
        switch (contextValue) {
            case "start-hint":
                return new vscode.ThemeIcon("rocket", new vscode.ThemeColor("charts.green"));
            case "info":
                return new vscode.ThemeIcon("info", new vscode.ThemeColor("charts.blue"));
            case "feature-header":
                return new vscode.ThemeIcon("folder-opened", new vscode.ThemeColor("charts.purple"));
            case "phase-indicator":
                return new vscode.ThemeIcon("target", new vscode.ThemeColor("charts.orange"));
            case "next-phase":
                return new vscode.ThemeIcon("arrow-right", new vscode.ThemeColor("charts.green"));
            case "validation-issue":
                return new vscode.ThemeIcon("warning", new vscode.ThemeColor("charts.red"));
            case "progress":
                return new vscode.ThemeIcon("graph-line", new vscode.ThemeColor("charts.blue"));
            case "task-complete":
                return new vscode.ThemeIcon("check", new vscode.ThemeColor("charts.green"));
            case "task-incomplete":
                return new vscode.ThemeIcon("circle-outline", new vscode.ThemeColor("charts.yellow"));
            case "warning":
                return new vscode.ThemeIcon("alert", new vscode.ThemeColor("charts.red"));
            case "hint":
                return new vscode.ThemeIcon("lightbulb", new vscode.ThemeColor("charts.yellow"));
            case "separator":
                return new vscode.ThemeIcon("dash", new vscode.ThemeColor("disabledForeground"));
            case "section-header":
                return new vscode.ThemeIcon("chevron-right", new vscode.ThemeColor("charts.blue"));
            case "copy-prompts":
                return new vscode.ThemeIcon("clippy", new vscode.ThemeColor("charts.green"));
            case "show-guidance":
                return new vscode.ThemeIcon("lightbulb", new vscode.ThemeColor("charts.yellow"));
            default:
                return undefined;
        }
    }
}
class SpecFileItem extends vscode.TreeItem {
    constructor(label, description, filePath, contextValue) {
        super(TextFormatter.formatLabel(label), vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.description = description;
        this.filePath = filePath;
        this.contextValue = contextValue;
        // Format description with proper length handling
        this.description = TextFormatter.formatDescription(description);
        // Create comprehensive tooltip with file path and description
        this.tooltip = TextFormatter.createMultiLineTooltip(label, description, `Path: ${filePath}`);
        this.command = {
            command: "vscode.open",
            title: "Open File",
            arguments: [vscode.Uri.file(filePath)],
        };
        // Add appropriate icons for file states
        this.iconPath =
            contextValue === "spec-file"
                ? new vscode.ThemeIcon("file-text")
                : new vscode.ThemeIcon("file-text", new vscode.ThemeColor("disabledForeground"));
    }
}
class HelpItem extends vscode.TreeItem {
    constructor(label, description) {
        super(TextFormatter.formatLabel(label), vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.description = description;
        // Format description with proper length handling
        this.description = TextFormatter.formatDescription(description);
        // Create properly formatted tooltip
        this.tooltip = TextFormatter.createMultiLineTooltip(label, description);
        // Add help icon
        this.iconPath = new vscode.ThemeIcon("question");
    }
}
//# sourceMappingURL=specPanelProvider.js.map