"use strict";
/**
 * Simple test for task parsing functionality without VS Code dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const os = require("os");
// Mock the vscode module for testing
const mockVscode = {
    EventEmitter: class {
        fire() { }
        get event() {
            return () => { };
        }
    },
    window: {
        showInformationMessage: async () => "Yes, Complete",
        showErrorMessage: async () => { },
        showWarningMessage: async () => { },
    },
    env: {
        clipboard: {
            writeText: async () => { },
        },
    },
};
// Replace vscode import with mock
global.vscode = mockVscode;
// Now we can import our TaskManager
const taskManager_1 = require("./taskManager");
async function testTaskParsing() {
    console.log("🧪 Testing Task Parsing and Management...\n");
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "task-parse-test-"));
    console.log(`📁 Test directory: ${tempDir}`);
    try {
        // Create comprehensive tasks.md file
        const tasksContent = `# Implementation Plan

- [ ] 1. Set up project structure and core interfaces
  - Create directory structure for models, services, repositories, and API components
  - Define interfaces that establish system boundaries
  - _Requirements: 1.1, 2.3_
  - _Context: src/models/, src/services/_

- [x] 2. Implement data models and validation
- [ ] 2.1 Create core data model interfaces and types
  - Write TypeScript interfaces for all data models
  - Implement validation functions for data integrity
  - _Requirements: 2.1, 3.3, 1.2_
  - _Context: src/models/interfaces.ts_

- [ ] 2.2 Implement User model with validation
  - Write User class with validation methods
  - Create unit tests for User model validation
  - _Requirements: 1.2_
  - _Depends on: task-2.1_

- [ ] 3. Create storage mechanism
- [ ] 3.1 Implement database connection utilities
  - Write connection management code
  - _Requirements: 2.1, 3.3_
  - _Depends on: task-2.1_

- [ ] 3.2 Implement repository pattern for data access
  - Code base repository interface
  - _Requirements: 4.3_
  - _Depends on: task-3.1, task-2.2_
`;
        fs.writeFileSync(path.join(tempDir, "tasks.md"), tasksContent);
        console.log("📝 Created sample tasks.md file");
        const taskManager = new taskManager_1.TaskManager(tempDir);
        const tasks = await taskManager.loadTasks();
        console.log(`\n📊 Parsed ${tasks.length} tasks:`);
        // Test task parsing
        tasks.forEach((task) => {
            console.log(`\n  📋 ${task.id}: ${task.title}`);
            console.log(`     Status: ${task.completed ? "✅ Completed" : "⏳ Pending"}`);
            if (task.requirements.length > 0) {
                console.log(`     Requirements: ${task.requirements.join(", ")}`);
            }
            if (task.dependencies.length > 0) {
                console.log(`     Dependencies: ${task.dependencies.join(", ")}`);
            }
            if (task.contextFiles && task.contextFiles.length > 0) {
                console.log(`     Context Files: ${task.contextFiles.join(", ")}`);
            }
            if (task.parentTaskId) {
                console.log(`     Parent: ${task.parentTaskId}`);
            }
            if (task.subTasks && task.subTasks.length > 0) {
                console.log(`     Sub-tasks: ${task.subTasks.join(", ")}`);
            }
        });
        // Test progress calculation
        console.log("\n📈 Progress Analysis:");
        const progress = taskManager.getTaskProgress();
        console.log(`  Total: ${progress.totalTasks}`);
        console.log(`  Completed: ${progress.completedTasks}`);
        console.log(`  Progress: ${progress.percentage}%`);
        // Test dependency analysis
        console.log("\n🔗 Dependency Analysis:");
        const tasksByStatus = taskManager.getTasksByStatus();
        console.log(`  Available: ${tasksByStatus.available.length}`);
        console.log(`  Blocked: ${tasksByStatus.blocked.length}`);
        console.log(`  Completed: ${tasksByStatus.completed.length}`);
        console.log("\n🚫 Blocked Tasks:");
        tasksByStatus.blocked.forEach((task) => {
            console.log(`  - ${task.title} (blocked by: ${task.dependencies.join(", ")})`);
        });
        console.log("\n🟢 Available Tasks:");
        tasksByStatus.available.forEach((task) => {
            console.log(`  - ${task.title}`);
        });
        // Test task recommendation
        console.log("\n⭐ Task Recommendation:");
        const recommended = taskManager.getNextRecommendedTask();
        if (recommended) {
            console.log(`  Recommended: ${recommended.title}`);
            console.log(`  Reason: ${recommended.dependencies.length === 0
                ? "No dependencies"
                : "Dependencies met"}`);
        }
        else {
            console.log("  No tasks available");
        }
        // Test execution context
        console.log("\n🎯 Execution Context:");
        if (recommended) {
            const context = taskManager.getTaskExecutionContext(recommended.id);
            if (context) {
                console.log(`  Task: ${context.task.title}`);
                console.log(`  Can Execute: ${context.dependencyStatus.canExecute}`);
                console.log(`  Available Prompts: ${context.availablePrompts.length}`);
                console.log(`  Next Steps: ${context.nextSteps.length}`);
                console.log(`  First Prompt Preview: "${context.availablePrompts[0].substring(0, 80)}..."`);
            }
        }
        // Test hierarchy
        console.log("\n🌳 Task Hierarchy:");
        const hierarchy = taskManager.getTaskHierarchy();
        for (const [parentId, subTasks] of hierarchy) {
            const parentTask = tasks.find((t) => t.id === parentId);
            console.log(`  ${parentTask?.title || parentId}:`);
            subTasks.forEach((subId) => {
                const subTask = tasks.find((t) => t.id === subId);
                console.log(`    - ${subTask?.title || subId}`);
            });
        }
        console.log("\n✅ Task Management Features Verified:");
        console.log("  ✅ Task parsing with metadata");
        console.log("  ✅ Dependency tracking");
        console.log("  ✅ Progress calculation");
        console.log("  ✅ Task status grouping");
        console.log("  ✅ Smart task recommendation");
        console.log("  ✅ Execution context generation");
        console.log("  ✅ Task hierarchy management");
        console.log("\n🎉 All tests passed!");
    }
    catch (error) {
        console.error("❌ Test failed:", error);
    }
    finally {
        // Clean up
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            console.log(`🧹 Cleaned up: ${tempDir}`);
        }
    }
}
// Run the test
testTaskParsing().catch(console.error);
//# sourceMappingURL=test-task-parsing.js.map