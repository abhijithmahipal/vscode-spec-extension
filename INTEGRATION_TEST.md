# Integration Test for Enhanced Clipboard Functionality

This document provides manual testing steps to verify the enhanced clipboard and prompt management features.

## Test Scenarios

### 1. Basic Prompt Copy with Preview (Requirement 8.1)

**Steps:**

1. Start a new spec: `Ctrl+Shift+P` → "Spec: Start New Spec"
2. Enter a feature idea and confirm
3. Notice the enhanced prompt handling during spec creation
4. Verify you see a confirmation dialog with preview before copying

**Expected Results:**

- ✅ Confirmation dialog shows before copying
- ✅ Preview of prompt content is displayed
- ✅ Success notification appears after copying
- ✅ Option to open Copilot Chat is provided

### 2. Multiple Prompt Selection (Requirement 8.2)

**Steps:**

1. With an active spec, click the "📋 Copy Prompts" button in the Spec Panel
2. Or use command palette: "Spec: Copy Prompts"
3. Select from the available prompts in the quick pick

**Expected Results:**

- ✅ Quick pick shows all available prompts for current phase
- ✅ Each prompt has title, description, and preview
- ✅ Selected prompt is copied with enhanced functionality

### 3. Fallback Options (Requirement 8.3)

**Steps:**

1. Try copying a prompt when clipboard might fail (simulate by denying permissions if possible)
2. Observe the fallback options presented

**Expected Results:**

- ✅ Error message with clear recovery options
- ✅ "Save to File" option creates a .md file
- ✅ "Show in Preview" opens content in editor
- ✅ "Try Again" attempts clipboard operation again

### 4. Enhanced Context (Requirement 8.4)

**Steps:**

1. Copy any prompt using the enhanced functionality
2. Paste the content to examine the structure

**Expected Results:**

- ✅ Prompt includes timestamp and metadata
- ✅ Context files are listed for reference
- ✅ Clear sections with proper formatting
- ✅ Extension attribution is present

### 5. Long Prompt Handling (Requirement 8.5)

**Steps:**

1. Create a spec and progress to the Tasks phase
2. Generate a tasks document with many detailed tasks
3. Try copying a task execution prompt

**Expected Results:**

- ✅ Warning about long prompt length
- ✅ "View & Edit" option available
- ✅ Options to copy anyway or save to file
- ✅ Editor opens for viewing/editing if selected

## Phase-Specific Testing

### Requirements Phase

- Copy requirements prompt
- Verify context includes requirements.md reference
- Check enhanced formatting

### Design Phase

- Move to design phase
- Copy design prompt
- Verify context includes requirements.md and design.md references

### Tasks Phase

- Move to tasks phase
- Copy tasks prompt
- Verify context includes all previous phase files

### Execution Phase

- Move to execution phase
- Use "Copy Prompts" to see multiple task options
- Copy individual task prompts
- Verify task-specific context

## Error Scenarios

### Clipboard Unavailable

1. Disable clipboard access (if possible on your system)
2. Try copying a prompt
3. Verify fallback options work

### Long Content

1. Create a very detailed requirements document
2. Try copying the requirements prompt
3. Verify long prompt handling

### No Active Spec

1. Close all specs or start fresh
2. Try using "Copy Prompts" command
3. Verify appropriate warning message

## UI Integration Testing

### Spec Panel Integration

- Verify "📋 Copy Prompts" button appears when spec is active
- Verify button is hidden when no spec is active
- Test button functionality

### Command Palette

- Verify "Spec: Copy Prompts" appears in command palette
- Test command execution

### Status Bar

- Verify status bar updates don't interfere with clipboard operations
- Test clipboard operations while status bar is updating

## Performance Testing

### Large Prompts

1. Create a spec with extensive requirements and design
2. Generate very long prompts
3. Test copy operations and verify performance

### Multiple Operations

1. Rapidly copy multiple prompts
2. Verify debouncing works correctly
3. Check for memory leaks or performance degradation

## Verification Checklist

After completing all tests, verify:

- [ ] All clipboard operations show confirmation dialogs
- [ ] Prompt previews are accurate and helpful
- [ ] Multiple prompt selection works in all phases
- [ ] Fallback options are available and functional
- [ ] Context and instructions are properly included
- [ ] Long prompts are handled appropriately
- [ ] Error messages are user-friendly
- [ ] UI integration is seamless
- [ ] Performance is acceptable
- [ ] No regressions in existing functionality

## Known Limitations

- Clipboard access depends on system permissions
- Very long prompts (>10MB) may cause performance issues
- Some fallback options require workspace folder access

## Troubleshooting

### Clipboard Not Working

- Check system clipboard permissions
- Try the "Save to File" fallback option
- Restart VS Code if clipboard is completely unresponsive

### Prompts Not Appearing

- Ensure spec is active
- Check current phase (some prompts are phase-specific)
- Refresh the spec panel

### Performance Issues

- Close unnecessary editor tabs
- Restart VS Code for memory cleanup
- Check for very large prompt content
