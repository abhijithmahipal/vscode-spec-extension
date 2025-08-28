"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileManager = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const errorHandler_1 = require("../errorHandler");
/**
 * Consolidated File Manager
 * Handles all file operations with proper error handling
 * Addresses requirements 1.3, 1.4
 */
class FileManager {
    static getInstance() {
        if (!FileManager.instance) {
            FileManager.instance = new FileManager();
        }
        return FileManager.instance;
    }
    /**
     * Create directory with proper error handling
     */
    async createDirectory(dirPath) {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        }
        catch (error) {
            throw errorHandler_1.ErrorHandler.createFileNotFoundError(dirPath, {
                operation: "create directory",
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    /**
     * Read file with error handling
     */
    async readFile(filePath) {
        try {
            return fs.readFileSync(filePath, "utf8");
        }
        catch (error) {
            if (error instanceof Error && error.message.includes("ENOENT")) {
                throw errorHandler_1.ErrorHandler.createFileNotFoundError(filePath);
            }
            throw error;
        }
    }
    /**
     * Write file with error handling
     */
    async writeFile(filePath, content) {
        try {
            // Ensure directory exists
            const dir = path.dirname(filePath);
            await this.createDirectory(dir);
            fs.writeFileSync(filePath, content, "utf8");
        }
        catch (error) {
            throw new Error(`Failed to write file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Check if file exists
     */
    fileExists(filePath) {
        return fs.existsSync(filePath);
    }
    /**
     * Get file stats
     */
    async getFileStats(filePath) {
        try {
            return fs.statSync(filePath);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Copy file
     */
    async copyFile(sourcePath, destPath) {
        try {
            const dir = path.dirname(destPath);
            await this.createDirectory(dir);
            fs.copyFileSync(sourcePath, destPath);
        }
        catch (error) {
            throw new Error(`Failed to copy file from ${sourcePath} to ${destPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Delete file
     */
    async deleteFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch (error) {
            throw new Error(`Failed to delete file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * List directory contents
     */
    async listDirectory(dirPath) {
        try {
            if (!fs.existsSync(dirPath)) {
                return [];
            }
            return fs.readdirSync(dirPath);
        }
        catch (error) {
            throw new Error(`Failed to list directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Open file in VS Code editor
     */
    async openFile(filePath, options) {
        try {
            const uri = vscode.Uri.file(filePath);
            return await vscode.window.showTextDocument(uri, {
                preview: options?.preview || false,
                viewColumn: options?.viewColumn || vscode.ViewColumn.Active,
            });
        }
        catch (error) {
            throw new Error(`Failed to open file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Create file with template content
     */
    async createFileFromTemplate(filePath, templateName, variables = {}) {
        const template = this.getTemplate(templateName);
        let content = template;
        // Replace variables in template
        for (const [key, value] of Object.entries(variables)) {
            content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
        }
        await this.writeFile(filePath, content);
    }
    /**
     * Get template content
     */
    getTemplate(templateName) {
        switch (templateName) {
            case "requirements":
                return `# Requirements Document

## Introduction

{{introduction}}

## Requirements

### Requirement 1

**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria

1. WHEN [event] THEN [system] SHALL [response]
2. IF [precondition] THEN [system] SHALL [response]

### Requirement 2

**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria

1. WHEN [event] THEN [system] SHALL [response]
2. WHEN [event] AND [condition] THEN [system] SHALL [response]
`;
            case "design":
                return `# Design Document

## Overview

{{overview}}

## Architecture

Describe the system architecture and main components.

## Components and Interfaces

Detail the key components and their interfaces.

## Data Models

Define the data structures and relationships.

## Error Handling

Describe error handling strategies.

## Testing Strategy

Outline the testing approach.
`;
            case "tasks":
                return `# Implementation Plan

## {{featureName}} Tasks

- [ ] 1. Set up basic structure
  - Create necessary files and directories
  - _Requirements: 1.1_

- [ ] 2. Implement core functionality
  - Add main feature implementation
  - _Requirements: 1.2, 2.1_

- [ ] 3. Add tests
  - Write unit tests for core functionality
  - _Requirements: 1.1_

- [ ] 4. Integration and polish
  - Integrate with existing system
  - Polish user experience
  - _Requirements: 2.1_
`;
            default:
                return "";
        }
    }
    /**
     * Backup file before modification
     */
    async backupFile(filePath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupPath = `${filePath}.backup.${timestamp}`;
        await this.copyFile(filePath, backupPath);
        return backupPath;
    }
    /**
     * Restore file from backup
     */
    async restoreFromBackup(originalPath, backupPath) {
        await this.copyFile(backupPath, originalPath);
        await this.deleteFile(backupPath);
    }
    /**
     * Get workspace root path
     */
    getWorkspaceRoot() {
        return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    }
    /**
     * Get relative path from workspace root
     */
    getRelativePath(filePath) {
        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) {
            return filePath;
        }
        return path.relative(workspaceRoot, filePath);
    }
    /**
     * Resolve path relative to workspace root
     */
    resolveWorkspacePath(relativePath) {
        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) {
            throw new Error("No workspace folder available");
        }
        return path.resolve(workspaceRoot, relativePath);
    }
    /**
     * Watch file for changes
     */
    watchFile(filePath, callback) {
        return fs.watchFile(filePath, callback);
    }
    /**
     * Get file extension
     */
    getFileExtension(filePath) {
        return path.extname(filePath);
    }
    /**
     * Get file name without extension
     */
    getFileNameWithoutExtension(filePath) {
        return path.basename(filePath, path.extname(filePath));
    }
    /**
     * Join paths safely
     */
    joinPaths(...paths) {
        return path.join(...paths);
    }
    /**
     * Normalize path
     */
    normalizePath(filePath) {
        return path.normalize(filePath);
    }
}
exports.FileManager = FileManager;
//# sourceMappingURL=fileManager.js.map