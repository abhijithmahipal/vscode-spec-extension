import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ErrorHandler } from "../errorHandler";

/**
 * Consolidated File Manager
 * Handles all file operations with proper error handling
 * Addresses requirements 1.3, 1.4
 */
export class FileManager {
  private static instance: FileManager;

  static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager();
    }
    return FileManager.instance;
  }

  /**
   * Create directory with proper error handling
   */
  async createDirectory(dirPath: string): Promise<void> {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } catch (error) {
      throw ErrorHandler.createFileNotFoundError(dirPath, {
        operation: "create directory",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Read file with error handling
   */
  async readFile(filePath: string): Promise<string> {
    try {
      return fs.readFileSync(filePath, "utf8");
    } catch (error) {
      if (error instanceof Error && error.message.includes("ENOENT")) {
        throw ErrorHandler.createFileNotFoundError(filePath);
      }
      throw error;
    }
  }

  /**
   * Write file with error handling
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await this.createDirectory(dir);

      fs.writeFileSync(filePath, content, "utf8");
    } catch (error) {
      throw new Error(
        `Failed to write file ${filePath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Check if file exists
   */
  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Get file stats
   */
  async getFileStats(filePath: string): Promise<fs.Stats | null> {
    try {
      return fs.statSync(filePath);
    } catch (error) {
      return null;
    }
  }

  /**
   * Copy file
   */
  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    try {
      const dir = path.dirname(destPath);
      await this.createDirectory(dir);
      fs.copyFileSync(sourcePath, destPath);
    } catch (error) {
      throw new Error(
        `Failed to copy file from ${sourcePath} to ${destPath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      throw new Error(
        `Failed to delete file ${filePath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath: string): Promise<string[]> {
    try {
      if (!fs.existsSync(dirPath)) {
        return [];
      }
      return fs.readdirSync(dirPath);
    } catch (error) {
      throw new Error(
        `Failed to list directory ${dirPath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Open file in VS Code editor
   */
  async openFile(
    filePath: string,
    options?: {
      preview?: boolean;
      viewColumn?: vscode.ViewColumn;
    }
  ): Promise<vscode.TextEditor> {
    try {
      const uri = vscode.Uri.file(filePath);
      return await vscode.window.showTextDocument(uri, {
        preview: options?.preview || false,
        viewColumn: options?.viewColumn || vscode.ViewColumn.Active,
      });
    } catch (error) {
      throw new Error(
        `Failed to open file ${filePath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Create file with template content
   */
  async createFileFromTemplate(
    filePath: string,
    templateName: string,
    variables: Record<string, string> = {}
  ): Promise<void> {
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
  private getTemplate(templateName: string): string {
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
  async backupFile(filePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = `${filePath}.backup.${timestamp}`;
    await this.copyFile(filePath, backupPath);
    return backupPath;
  }

  /**
   * Restore file from backup
   */
  async restoreFromBackup(
    originalPath: string,
    backupPath: string
  ): Promise<void> {
    await this.copyFile(backupPath, originalPath);
    await this.deleteFile(backupPath);
  }

  /**
   * Get workspace root path
   */
  getWorkspaceRoot(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  /**
   * Get relative path from workspace root
   */
  getRelativePath(filePath: string): string {
    const workspaceRoot = this.getWorkspaceRoot();
    if (!workspaceRoot) {
      return filePath;
    }
    return path.relative(workspaceRoot, filePath);
  }

  /**
   * Resolve path relative to workspace root
   */
  resolveWorkspacePath(relativePath: string): string {
    const workspaceRoot = this.getWorkspaceRoot();
    if (!workspaceRoot) {
      throw new Error("No workspace folder available");
    }
    return path.resolve(workspaceRoot, relativePath);
  }

  /**
   * Watch file for changes
   */
  watchFile(
    filePath: string,
    callback: (curr: fs.Stats, prev: fs.Stats) => void
  ): fs.StatWatcher {
    return fs.watchFile(filePath, callback);
  }

  /**
   * Get file extension
   */
  getFileExtension(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * Get file name without extension
   */
  getFileNameWithoutExtension(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * Join paths safely
   */
  joinPaths(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * Normalize path
   */
  normalizePath(filePath: string): string {
    return path.normalize(filePath);
  }
}
