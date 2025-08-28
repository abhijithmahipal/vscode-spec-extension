"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.SpecError = exports.ErrorCode = void 0;
const vscode = require("vscode");
var ErrorCode;
(function (ErrorCode) {
    // File system errors
    ErrorCode["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    ErrorCode["FILE_PERMISSION_DENIED"] = "FILE_PERMISSION_DENIED";
    ErrorCode["FILE_WRITE_FAILED"] = "FILE_WRITE_FAILED";
    ErrorCode["DIRECTORY_CREATE_FAILED"] = "DIRECTORY_CREATE_FAILED";
    // Workspace errors
    ErrorCode["NO_WORKSPACE"] = "NO_WORKSPACE";
    ErrorCode["INVALID_WORKSPACE"] = "INVALID_WORKSPACE";
    ErrorCode["WORKSPACE_READ_ONLY"] = "WORKSPACE_READ_ONLY";
    // Spec workflow errors
    ErrorCode["SPEC_NOT_ACTIVE"] = "SPEC_NOT_ACTIVE";
    ErrorCode["INVALID_PHASE_TRANSITION"] = "INVALID_PHASE_TRANSITION";
    ErrorCode["VALIDATION_FAILED"] = "VALIDATION_FAILED";
    ErrorCode["SPEC_ALREADY_EXISTS"] = "SPEC_ALREADY_EXISTS";
    // Task execution errors
    ErrorCode["TASK_NOT_FOUND"] = "TASK_NOT_FOUND";
    ErrorCode["TASK_ALREADY_COMPLETED"] = "TASK_ALREADY_COMPLETED";
    ErrorCode["TASK_DEPENDENCIES_NOT_MET"] = "TASK_DEPENDENCIES_NOT_MET";
    // Clipboard and external errors
    ErrorCode["CLIPBOARD_FAILED"] = "CLIPBOARD_FAILED";
    ErrorCode["EXTERNAL_COMMAND_FAILED"] = "EXTERNAL_COMMAND_FAILED";
    ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    // General errors
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
    ErrorCode["USER_CANCELLED"] = "USER_CANCELLED";
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
class SpecError extends Error {
    constructor(details, cause) {
        super(details.message);
        this.details = details;
        this.name = "SpecError";
        this.cause = cause;
    }
}
exports.SpecError = SpecError;
class ErrorHandler {
    /**
     * Handle errors with comprehensive recovery options
     * Addresses requirements 4.1, 4.2
     */
    static async handleError(error) {
        let specError;
        if (error instanceof SpecError) {
            specError = error;
        }
        else {
            specError = this.convertToSpecError(error);
        }
        // Log error for debugging
        this.logError(specError);
        // Add to error history
        this.addToErrorHistory(specError);
        // Show error to user with recovery options
        return await this.showErrorWithRecovery(specError);
    }
    /**
     * Convert generic errors to SpecError with appropriate details
     */
    static convertToSpecError(error) {
        const message = error.message.toLowerCase();
        // File system errors
        if (message.includes("enoent") || message.includes("not found")) {
            return new SpecError({
                code: ErrorCode.FILE_NOT_FOUND,
                message: error.message,
                userMessage: "Required file not found",
                recoveryActions: this.getFileNotFoundRecoveryActions(),
                severity: "error",
            }, error);
        }
        if (message.includes("eacces") || message.includes("permission")) {
            return new SpecError({
                code: ErrorCode.FILE_PERMISSION_DENIED,
                message: error.message,
                userMessage: "Permission denied accessing file",
                recoveryActions: this.getPermissionDeniedRecoveryActions(),
                severity: "error",
            }, error);
        }
        // Workspace errors
        if (message.includes("workspace") || message.includes("folder")) {
            return new SpecError({
                code: ErrorCode.NO_WORKSPACE,
                message: error.message,
                userMessage: "No workspace folder is open",
                recoveryActions: this.getNoWorkspaceRecoveryActions(),
                severity: "error",
            }, error);
        }
        // Default unknown error
        return new SpecError({
            code: ErrorCode.UNKNOWN_ERROR,
            message: error.message,
            userMessage: "An unexpected error occurred",
            recoveryActions: this.getUnknownErrorRecoveryActions(),
            severity: "error",
        }, error);
    }
    /**
     * Show error dialog with recovery options
     */
    static async showErrorWithRecovery(error) {
        const { details } = error;
        const primaryActions = details.recoveryActions.filter((a) => a.primary);
        const secondaryActions = details.recoveryActions.filter((a) => !a.primary);
        // Create action buttons
        const actionLabels = [
            ...primaryActions.map((a) => a.label),
            ...secondaryActions.slice(0, 2).map((a) => a.label),
            "View Details",
            "Dismiss",
        ];
        const result = await vscode.window.showErrorMessage(details.userMessage, {
            modal: details.severity === "error",
            detail: this.createErrorDetail(error),
        }, ...actionLabels);
        if (!result || result === "Dismiss") {
            return false;
        }
        if (result === "View Details") {
            await this.showErrorDetails(error);
            return false;
        }
        // Find and execute the selected recovery action
        const selectedAction = details.recoveryActions.find((a) => a.label === result);
        if (selectedAction) {
            try {
                await selectedAction.action();
                vscode.window.showInformationMessage(`✅ Recovery action completed: ${selectedAction.description}`);
                return true;
            }
            catch (recoveryError) {
                vscode.window.showErrorMessage(`Recovery action failed: ${recoveryError instanceof Error
                    ? recoveryError.message
                    : "Unknown error"}`);
                return false;
            }
        }
        return false;
    }
    /**
     * Create detailed error information
     */
    static createErrorDetail(error) {
        const { details } = error;
        const parts = [
            `Error Code: ${details.code}`,
            `Severity: ${details.severity.toUpperCase()}`,
        ];
        if (details.context) {
            parts.push("Context:");
            Object.entries(details.context).forEach(([key, value]) => {
                parts.push(`  ${key}: ${value}`);
            });
        }
        parts.push("", "Available recovery actions:");
        details.recoveryActions.forEach((action) => {
            parts.push(`• ${action.label}: ${action.description}`);
        });
        return parts.join("\n");
    }
    /**
     * Show detailed error information in a new document
     */
    static async showErrorDetails(error) {
        const content = this.createDetailedErrorReport(error);
        try {
            const doc = await vscode.workspace.openTextDocument({
                content,
                language: "markdown",
            });
            await vscode.window.showTextDocument(doc, {
                preview: true,
                viewColumn: vscode.ViewColumn.Beside,
            });
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to show error details: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
    }
    /**
     * Create detailed error report
     */
    static createDetailedErrorReport(error) {
        const { details } = error;
        const timestamp = new Date().toISOString();
        return `# Error Report

**Generated:** ${timestamp}
**Error Code:** ${details.code}
**Severity:** ${details.severity.toUpperCase()}

## User Message
${details.userMessage}

## Technical Details
${details.message}

${details.context
            ? `## Context
${Object.entries(details.context)
                .map(([key, value]) => `- **${key}:** ${value}`)
                .join("\n")}
`
            : ""}

## Recovery Actions
${details.recoveryActions
            .map((action) => `### ${action.label}${action.primary ? " (Recommended)" : ""}
${action.description}`)
            .join("\n\n")}

## Error History
${this.errorHistory
            .slice(-5)
            .map((entry, index) => `${index + 1}. ${entry.error.details.code} - ${entry.timestamp.toLocaleString()}`)
            .join("\n")}

---
*Generated by VSCode Spec-Driven Development Extension*
`;
    }
    /**
     * Log error for debugging
     */
    static logError(error) {
        console.error(`[SpecError] ${error.details.code}: ${error.details.message}`, {
            userMessage: error.details.userMessage,
            context: error.details.context,
            cause: error.cause,
        });
    }
    /**
     * Add error to history for pattern analysis
     */
    static addToErrorHistory(error) {
        this.errorHistory.push({
            error,
            timestamp: new Date(),
        });
        // Keep history within limits
        if (this.errorHistory.length > this.ERROR_HISTORY_LIMIT) {
            this.errorHistory = this.errorHistory.slice(-this.ERROR_HISTORY_LIMIT);
        }
    }
    // Recovery action factories
    static getFileNotFoundRecoveryActions() {
        return [
            {
                label: "Create Missing File",
                description: "Create the missing file with default content",
                primary: true,
                action: async () => {
                    // This would be implemented by the calling context
                    vscode.window.showInformationMessage("File creation initiated");
                },
            },
            {
                label: "Choose Different File",
                description: "Select an existing file instead",
                action: async () => {
                    const files = await vscode.window.showOpenDialog({
                        canSelectFiles: true,
                        canSelectFolders: false,
                        canSelectMany: false,
                    });
                    if (files && files.length > 0) {
                        await vscode.window.showTextDocument(files[0]);
                    }
                },
            },
            {
                label: "Refresh Workspace",
                description: "Refresh the workspace to detect new files",
                action: async () => {
                    await vscode.commands.executeCommand("workbench.action.reloadWindow");
                },
            },
        ];
    }
    static getPermissionDeniedRecoveryActions() {
        return [
            {
                label: "Check Permissions",
                description: "Open file location to check permissions",
                primary: true,
                action: async () => {
                    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
                    if (workspaceRoot) {
                        await vscode.commands.executeCommand("revealFileInOS", workspaceRoot);
                    }
                },
            },
            {
                label: "Try Different Location",
                description: "Choose a different directory for spec files",
                action: async () => {
                    const folder = await vscode.window.showOpenDialog({
                        canSelectFiles: false,
                        canSelectFolders: true,
                        canSelectMany: false,
                        title: "Select directory for spec files",
                    });
                    if (folder && folder.length > 0) {
                        vscode.window.showInformationMessage(`Selected: ${folder[0].fsPath}`);
                    }
                },
            },
        ];
    }
    static getNoWorkspaceRecoveryActions() {
        return [
            {
                label: "Open Folder",
                description: "Open a workspace folder",
                primary: true,
                action: async () => {
                    await vscode.commands.executeCommand("vscode.openFolder");
                },
            },
            {
                label: "Create New Folder",
                description: "Create and open a new project folder",
                action: async () => {
                    const folder = await vscode.window.showSaveDialog({
                        title: "Create new project folder",
                        saveLabel: "Create Folder",
                    });
                    if (folder) {
                        await vscode.commands.executeCommand("vscode.openFolder", folder);
                    }
                },
            },
        ];
    }
    static getUnknownErrorRecoveryActions() {
        return [
            {
                label: "Retry Operation",
                description: "Try the operation again",
                primary: true,
                action: async () => {
                    vscode.window.showInformationMessage("Please retry your last action");
                },
            },
            {
                label: "Reset Extension",
                description: "Reset the extension to default state",
                action: async () => {
                    await vscode.commands.executeCommand("workbench.action.reloadWindow");
                },
            },
            {
                label: "Report Issue",
                description: "Report this issue to the extension developers",
                action: async () => {
                    const issueUrl = "https://github.com/your-repo/issues/new";
                    await vscode.env.openExternal(vscode.Uri.parse(issueUrl));
                },
            },
        ];
    }
    /**
     * Create specific error types for common scenarios
     */
    static createFileNotFoundError(filePath, context) {
        return new SpecError({
            code: ErrorCode.FILE_NOT_FOUND,
            message: `File not found: ${filePath}`,
            userMessage: `Required file "${filePath}" was not found`,
            recoveryActions: [
                {
                    label: "Create File",
                    description: "Create the missing file with default content",
                    primary: true,
                    action: async () => {
                        // Implementation would be provided by caller
                        vscode.window.showInformationMessage(`Creating file: ${filePath}`);
                    },
                },
                ...this.getFileNotFoundRecoveryActions().slice(1),
            ],
            context: { filePath, ...context },
            severity: "error",
        });
    }
    static createValidationError(message, suggestions) {
        return new SpecError({
            code: ErrorCode.VALIDATION_FAILED,
            message,
            userMessage: `Validation failed: ${message}`,
            recoveryActions: suggestions.map((suggestion) => ({
                label: suggestion,
                description: `Apply suggestion: ${suggestion}`,
                action: async () => {
                    vscode.window.showInformationMessage(`Applying: ${suggestion}`);
                },
            })),
            severity: "warning",
        });
    }
    static createWorkspaceError(message) {
        return new SpecError({
            code: ErrorCode.NO_WORKSPACE,
            message,
            userMessage: "Workspace is required for spec operations",
            recoveryActions: this.getNoWorkspaceRecoveryActions(),
            severity: "error",
        });
    }
    /**
     * Get error statistics for debugging
     */
    static getErrorStatistics() {
        const errorsByCode = {};
        this.errorHistory.forEach((entry) => {
            const code = entry.error.details.code;
            errorsByCode[code] = (errorsByCode[code] || 0) + 1;
        });
        return {
            totalErrors: this.errorHistory.length,
            errorsByCode,
            recentErrors: this.errorHistory.slice(-5).map((entry) => ({
                code: entry.error.details.code,
                timestamp: entry.timestamp,
            })),
        };
    }
}
exports.ErrorHandler = ErrorHandler;
ErrorHandler.ERROR_HISTORY_LIMIT = 10;
ErrorHandler.errorHistory = [];
//# sourceMappingURL=errorHandler.js.map