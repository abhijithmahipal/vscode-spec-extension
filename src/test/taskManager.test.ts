import * as assert from "assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  TaskManager,
  TaskWithDependencies,
  TaskStatus,
  TaskComplexity,
} from "../taskManager";

suite("TaskManager Test Suite", () => {
  let tempDir: string;
  let taskManager: TaskManager;

  setup(() => {
    // Create temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "taskmanager-test-"));
    taskManager = new TaskManager(tempDir);
  });

  teardown(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("Should parse tasks with dependencies correctly", async () => {
    // Create a sample tasks.md file
    const tasksContent = `# Implementation Plan

- [ ] 1. Set up project structure
  - Create directory structure for models, services, repositories
  - _Requirements: 1.1, 2.3_
  - _Depends on: task-0_

- [x] 2. Implement data models
- [ ] 2.1 Create User model
  - Write User class with validation methods
  - _Requirements: 1.2_
  - _Context: user.ts, validation.ts_

- [ ] 2.2 Create Document model
  - Write Document class with relationships
  - _Requirements: 2.1, 3.3_
  - _Depends on: task-2.1_

- [x] 3. Create storage mechanism
  - Implement database connection utilities
  - _Requirements: 2.1_
`;

    fs.writeFileSync(path.join(tempDir, "tasks.md"), tasksContent);

    const tasks = await taskManager.loadTasks();

    assert.strictEqual(tasks.length, 5, "Should parse 5 tasks");

    // Check main task
    const task1 = tasks.find((t) => t.id === "task-1");
    assert.ok(task1, "Task 1 should exist");
    assert.strictEqual(task1!.title, "Set up project structure");
    assert.strictEqual(task1!.completed, false);
    assert.deepStrictEqual(task1!.requirements, ["1.1", "2.3"]);
    assert.deepStrictEqual(task1!.dependencies, ["task-0"]);

    // Check completed task
    const task2 = tasks.find((t) => t.id === "task-2");
    assert.ok(task2, "Task 2 should exist");
    assert.strictEqual(task2!.completed, true);

    // Check sub-task with context files
    const task21 = tasks.find((t) => t.id === "task-2.1");
    assert.ok(task21, "Task 2.1 should exist");
    assert.strictEqual(task21!.parentTaskId, "task-2");
    assert.deepStrictEqual(task21!.contextFiles, ["user.ts", "validation.ts"]);

    // Check sub-task with dependencies
    const task22 = tasks.find((t) => t.id === "task-2.2");
    assert.ok(task22, "Task 2.2 should exist");
    assert.deepStrictEqual(task22!.dependencies, ["task-2.1"]);
  });

  test("Should calculate task progress correctly", async () => {
    const tasksContent = `# Implementation Plan

- [x] 1. Completed task
- [ ] 2. Incomplete task
- [x] 3. Another completed task
- [ ] 4. Blocked task
`;

    fs.writeFileSync(path.join(tempDir, "tasks.md"), tasksContent);

    await taskManager.loadTasks();
    const progress = taskManager.getTaskProgress();

    assert.strictEqual(progress.totalTasks, 4);
    assert.strictEqual(progress.completedTasks, 2);
    assert.strictEqual(progress.percentage, 50);
  });

  test("Should check task dependencies correctly", async () => {
    const tasksContent = `# Implementation Plan

- [x] 1. Completed dependency
- [ ] 2. Task with completed dependency
  - _Depends on: task-1_
- [ ] 3. Task with incomplete dependency
  - _Depends on: task-4_
- [ ] 4. Incomplete dependency
`;

    fs.writeFileSync(path.join(tempDir, "tasks.md"), tasksContent);

    await taskManager.loadTasks();

    // Task 2 should be executable (dependency completed)
    assert.strictEqual(taskManager.canExecuteTask("task-2"), true);

    // Task 3 should not be executable (dependency incomplete)
    assert.strictEqual(taskManager.canExecuteTask("task-3"), false);

    // Task 4 should be executable (no dependencies)
    assert.strictEqual(taskManager.canExecuteTask("task-4"), true);
  });

  test("Should get task execution context correctly", async () => {
    const tasksContent = `# Implementation Plan

- [ ] 1. Test task
  - Task description here
  - _Requirements: 1.1, 2.3_
  - _Context: file1.ts, file2.ts_
`;

    fs.writeFileSync(path.join(tempDir, "tasks.md"), tasksContent);

    await taskManager.loadTasks();
    const context = taskManager.getTaskExecutionContext("task-1");

    assert.ok(context, "Execution context should exist");
    assert.strictEqual(context!.task.title, "Test task");
    assert.ok(
      context!.availablePrompts.length > 0,
      "Should have available prompts"
    );
    assert.ok(context!.nextSteps.length > 0, "Should have next steps");
    assert.ok(
      context!.contextualHelp.length > 0,
      "Should have contextual help"
    );
    assert.strictEqual(context!.dependencyStatus.canExecute, true);
  });

  test("Should group tasks by status correctly", async () => {
    const tasksContent = `# Implementation Plan

- [x] 1. Completed task
- [ ] 2. Available task
- [ ] 3. Blocked task
  - _Depends on: task-4_
- [ ] 4. Another available task
`;

    fs.writeFileSync(path.join(tempDir, "tasks.md"), tasksContent);

    await taskManager.loadTasks();
    const tasksByStatus = taskManager.getTasksByStatus();

    assert.strictEqual(tasksByStatus.completed.length, 1);
    assert.strictEqual(tasksByStatus.available.length, 2); // tasks 2 and 4
    assert.strictEqual(tasksByStatus.blocked.length, 1); // task 3
  });

  test("Should recommend next task correctly", async () => {
    const tasksContent = `# Implementation Plan

- [x] 1. Completed task
- [ ] 2. Task with dependency
  - _Depends on: task-3_
- [ ] 3. Available task (should be recommended)
- [ ] 4. Another available task
`;

    fs.writeFileSync(path.join(tempDir, "tasks.md"), tasksContent);

    await taskManager.loadTasks();
    const recommended = taskManager.getNextRecommendedTask();

    assert.ok(recommended, "Should have a recommended task");
    // Task 3 should be recommended as it has no dependencies and enables task 2
    assert.strictEqual(recommended!.id, "task-3");
  });

  test("Should update task status correctly", async () => {
    const tasksContent = `# Implementation Plan

- [ ] 1. Test task
  - Task description
`;

    fs.writeFileSync(path.join(tempDir, "tasks.md"), tasksContent);

    await taskManager.loadTasks();

    // Mock vscode.window.showInformationMessage to avoid UI during tests
    const originalShowInformationMessage = vscode.window.showInformationMessage;
    vscode.window.showInformationMessage = async () => "Yes, Complete" as any;

    try {
      const success = await taskManager.updateTaskStatus(
        "task-1",
        TaskStatus.COMPLETED,
        true
      );
      assert.strictEqual(success, true, "Task status update should succeed");

      // Verify the file was updated
      const updatedContent = fs.readFileSync(
        path.join(tempDir, "tasks.md"),
        "utf8"
      );
      assert.ok(
        updatedContent.includes("- [x] 1. Test task"),
        "Task should be marked as completed in file"
      );

      // Verify internal state was updated
      const progress = taskManager.getTaskProgress();
      assert.strictEqual(progress.completedTasks, 1);
    } finally {
      // Restore original function
      vscode.window.showInformationMessage = originalShowInformationMessage;
    }
  });

  test("Should handle task hierarchy correctly", async () => {
    const tasksContent = `# Implementation Plan

- [ ] 1. Parent task
- [ ] 1.1 Sub-task 1
- [ ] 1.2 Sub-task 2
- [ ] 2. Another parent task
- [ ] 2.1 Sub-task of parent 2
`;

    fs.writeFileSync(path.join(tempDir, "tasks.md"), tasksContent);

    await taskManager.loadTasks();
    const hierarchy = taskManager.getTaskHierarchy();

    assert.strictEqual(hierarchy.size, 2, "Should have 2 parent tasks");
    assert.deepStrictEqual(hierarchy.get("task-1"), ["task-1.1", "task-1.2"]);
    assert.deepStrictEqual(hierarchy.get("task-2"), ["task-2.1"]);
  });
});
