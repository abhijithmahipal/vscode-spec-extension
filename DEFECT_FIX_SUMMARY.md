# High Priority Defect Fix Summary

## Issue Description

When users start a new spec with detailed input (e.g., "I need to create an Apple iOS styled todo list with Firestore database"), the extension was only passing the generated feature name to the requirements prompt instead of the full user input. This caused important context like "Firestore database" to be lost.

## Root Cause Analysis

1. **Missing Method**: The core `WorkflowManager` was missing the `getRequirementsPrompt()` method entirely
2. **Lost Context**: The extension was calling `getRequirementsPrompt(featureName)` but not passing the original user input
3. **No Reset Option**: Users had no way to restart or reset specs when they wanted to start over

## Fixes Applied

### 1. Added Missing `getRequirementsPrompt()` Method

- Added the method to `src/core/workflowManager.ts`
- Method now uses stored `originalIdea` instead of just the feature name
- Fallback logic ensures it works even if parameters aren't provided

```typescript
public getRequirementsPrompt(featureName?: string, originalIdea?: string): string {
  // Use stored values if parameters not provided
  const actualFeatureName = featureName || this.currentFeature;
  const actualOriginalIdea = originalIdea || this.originalIdea || actualFeatureName;

  return `I'm starting a new feature spec for: "${actualOriginalIdea}"
  // ... rest of prompt template
}
```

### 2. Fixed Extension Call

- Updated `src/extension.ts` to call `getRequirementsPrompt()` without parameters
- This ensures it uses the stored `originalIdea` from when the spec was started

### 3. Added Reset and Restart Commands

- **Reset Spec**: Completely deletes the spec and starts over
- **Restart Phase**: Deletes the current phase file to regenerate it
- Added corresponding UI commands in package.json

### 4. Enhanced FileManager

- Added `deleteDirectory()` method to support spec reset functionality

## Testing the Fix

### Before Fix:

```
User Input: "I need to create an Apple iOS styled todo list with Firestore database"
Generated Prompt: "I'm starting a new feature spec for: 'todo-list-app'"
```

### After Fix:

```
User Input: "I need to create an Apple iOS styled todo list with Firestore database"
Generated Prompt: "I'm starting a new feature spec for: 'I need to create an Apple iOS styled todo list with Firestore database'"
```

## New Commands Available

- `specMode.resetSpec` - Reset entire spec and start over
- `specMode.restartPhase` - Restart current phase only

## Files Modified

1. `src/core/workflowManager.ts` - Added missing method and reset functionality
2. `src/extension.ts` - Fixed method call and added new commands
3. `src/core/fileManager.ts` - Added deleteDirectory method
4. `package.json` - Registered new commands

## Impact

- ✅ User's detailed input is now preserved in requirements prompts
- ✅ Users can reset specs when they want to start over
- ✅ Users can restart individual phases
- ✅ No breaking changes to existing functionality
