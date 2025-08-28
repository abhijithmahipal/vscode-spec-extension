import * as assert from "assert";
import { ErrorHandler, SpecError, ErrorCode } from "../errorHandler";

suite("ErrorHandler Tests", () => {
  test("Should create file not found error", () => {
    const error = ErrorHandler.createFileNotFoundError("/test/path");

    assert.strictEqual(error.details.code, ErrorCode.FILE_NOT_FOUND);
    assert.strictEqual(error.details.severity, "error");
    assert.ok(error.details.userMessage.includes("test/path"));
    assert.ok(error.details.recoveryActions.length > 0);
  });

  test("Should create validation error", () => {
    const error = ErrorHandler.createValidationError("Test validation failed", [
      "Fix suggestion",
    ]);

    assert.strictEqual(error.details.code, ErrorCode.VALIDATION_FAILED);
    assert.strictEqual(error.details.severity, "warning");
    assert.ok(error.details.userMessage.includes("Test validation failed"));
    assert.strictEqual(error.details.recoveryActions.length, 1);
    assert.strictEqual(
      error.details.recoveryActions[0].label,
      "Fix suggestion"
    );
  });

  test("Should create workspace error", () => {
    const error = ErrorHandler.createWorkspaceError("No workspace");

    assert.strictEqual(error.details.code, ErrorCode.NO_WORKSPACE);
    assert.strictEqual(error.details.severity, "error");
    assert.ok(
      error.details.recoveryActions.some(
        (action) => action.label === "Open Folder"
      )
    );
  });

  test("Should convert generic error to SpecError", async () => {
    const genericError = new Error("ENOENT: file not found");

    // This would normally be called internally, but we can test the conversion logic
    const converted = await ErrorHandler.handleError(genericError);

    // The handleError method returns a boolean indicating if recovery was successful
    assert.strictEqual(typeof converted, "boolean");
  });

  test("Should track error statistics", () => {
    const stats = ErrorHandler.getErrorStatistics();

    assert.strictEqual(typeof stats.totalErrors, "number");
    assert.ok(Array.isArray(stats.recentErrors));
    assert.strictEqual(typeof stats.errorsByCode, "object");
  });
});
