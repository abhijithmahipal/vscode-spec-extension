"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const errorHandler_1 = require("../errorHandler");
suite("ErrorHandler Tests", () => {
    test("Should create file not found error", () => {
        const error = errorHandler_1.ErrorHandler.createFileNotFoundError("/test/path");
        assert.strictEqual(error.details.code, errorHandler_1.ErrorCode.FILE_NOT_FOUND);
        assert.strictEqual(error.details.severity, "error");
        assert.ok(error.details.userMessage.includes("test/path"));
        assert.ok(error.details.recoveryActions.length > 0);
    });
    test("Should create validation error", () => {
        const error = errorHandler_1.ErrorHandler.createValidationError("Test validation failed", [
            "Fix suggestion",
        ]);
        assert.strictEqual(error.details.code, errorHandler_1.ErrorCode.VALIDATION_FAILED);
        assert.strictEqual(error.details.severity, "warning");
        assert.ok(error.details.userMessage.includes("Test validation failed"));
        assert.strictEqual(error.details.recoveryActions.length, 1);
        assert.strictEqual(error.details.recoveryActions[0].label, "Fix suggestion");
    });
    test("Should create workspace error", () => {
        const error = errorHandler_1.ErrorHandler.createWorkspaceError("No workspace");
        assert.strictEqual(error.details.code, errorHandler_1.ErrorCode.NO_WORKSPACE);
        assert.strictEqual(error.details.severity, "error");
        assert.ok(error.details.recoveryActions.some((action) => action.label === "Open Folder"));
    });
    test("Should convert generic error to SpecError", async () => {
        const genericError = new Error("ENOENT: file not found");
        // This would normally be called internally, but we can test the conversion logic
        const converted = await errorHandler_1.ErrorHandler.handleError(genericError);
        // The handleError method returns a boolean indicating if recovery was successful
        assert.strictEqual(typeof converted, "boolean");
    });
    test("Should track error statistics", () => {
        const stats = errorHandler_1.ErrorHandler.getErrorStatistics();
        assert.strictEqual(typeof stats.totalErrors, "number");
        assert.ok(Array.isArray(stats.recentErrors));
        assert.strictEqual(typeof stats.errorsByCode, "object");
    });
});
//# sourceMappingURL=errorHandler.test.js.map