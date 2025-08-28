"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const clipboardManager_1 = require("../clipboardManager");
suite("ClipboardManager Tests", () => {
    test("createPromptOption creates valid prompt option", () => {
        const option = clipboardManager_1.ClipboardManager.createPromptOption("test-id", "Test Title", "Test content for the prompt", "Test description", ["file1.md", "file2.md"]);
        assert.strictEqual(option.id, "test-id");
        assert.strictEqual(option.title, "Test Title");
        assert.strictEqual(option.content, "Test content for the prompt");
        assert.strictEqual(option.description, "Test description");
        assert.deepStrictEqual(option.context, ["file1.md", "file2.md"]);
    });
    test("createPromptOption works without context", () => {
        const option = clipboardManager_1.ClipboardManager.createPromptOption("test-id", "Test Title", "Test content", "Test description");
        assert.strictEqual(option.id, "test-id");
        assert.strictEqual(option.title, "Test Title");
        assert.strictEqual(option.content, "Test content");
        assert.strictEqual(option.description, "Test description");
        assert.strictEqual(option.context, undefined);
    });
    // Note: Testing the actual clipboard operations would require mocking VSCode APIs
    // which is complex in this context. The main functionality is tested through
    // integration testing when the extension is loaded.
});
//# sourceMappingURL=clipboardManager.test.js.map