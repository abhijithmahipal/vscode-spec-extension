"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testTextFormatting = void 0;
// Copy the TextFormatter class for testing (in a real scenario, we'd import it)
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
}
TextFormatter.MAX_LABEL_LENGTH = 50;
TextFormatter.MAX_DESCRIPTION_LENGTH = 80;
TextFormatter.MAX_TOOLTIP_LINE_LENGTH = 60;
// Test function to verify text formatting
function testTextFormatting() {
    console.log("Testing Text Formatting...");
    // Test label formatting
    const longLabel = "This is a very long label that should be truncated because it exceeds the maximum length";
    const formattedLabel = TextFormatter.formatLabel(longLabel);
    console.log("Long label:", longLabel);
    console.log("Formatted label:", formattedLabel);
    console.log("Label length:", formattedLabel.length);
    // Test description formatting
    const longDescription = "This is a very long description that should be truncated because it exceeds the maximum length for descriptions in the tree view";
    const formattedDescription = TextFormatter.formatDescription(longDescription);
    console.log("Long description:", longDescription);
    console.log("Formatted description:", formattedDescription);
    console.log("Description length:", formattedDescription.length);
    // Test tooltip formatting
    const longTooltip = "This is a very long tooltip text that should be wrapped into multiple lines to make it more readable for users when they hover over tree view items";
    const formattedTooltip = TextFormatter.formatTooltip(longTooltip);
    console.log("Long tooltip:", longTooltip);
    console.log("Formatted tooltip:");
    console.log(formattedTooltip);
    // Test multi-line tooltip
    const multiLineTooltip = TextFormatter.createMultiLineTooltip("Feature: User Authentication System", "This feature implements a comprehensive user authentication system with login, registration, and password reset functionality", "Requirements: 1.1, 1.2, 1.3 - Security, validation, and user experience requirements");
    console.log("Multi-line tooltip:");
    console.log(multiLineTooltip);
    // Test text wrapping for tree view
    const longTreeText = "This is a very long text that needs to be wrapped for display in a tree view with proper word boundaries";
    const wrappedText = TextFormatter.wrapTextForTreeView(longTreeText, 40);
    console.log("Long tree text:", longTreeText);
    console.log("Wrapped text:");
    console.log(wrappedText);
    console.log("Text formatting tests completed!");
}
exports.testTextFormatting = testTextFormatting;
//# sourceMappingURL=test-text-formatting.js.map