# Settings and Customization Documentation

This document describes the comprehensive settings and customization system implemented for the Spec-Driven Development extension.

## Overview

The settings system provides extensive customization options for workflow behavior, UI preferences, integration settings, accessibility features, and notifications. All settings are configurable through VS Code's settings interface and can be accessed via the extension's quick settings menu.

## Requirements Addressed

- **Requirement 7.1**: Settings for workflow behavior customization
- **Requirement 7.5**: Accessibility support including high contrast and screen reader compatibility
- **Requirement 6.1**: VS Code design patterns and seamless integration

## Settings Categories

### 1. Workflow Behavior Settings

Controls how the extension behaves during the spec workflow process.

#### `specDrivenDevelopment.workflowBehavior.requirePhaseConfirmation`

- **Type**: Boolean
- **Default**: `true`
- **Description**: Show confirmation dialog before transitioning between phases
- **Impact**: When enabled, users must confirm phase transitions, preventing accidental progression

#### `specDrivenDevelopment.workflowBehavior.autoSaveOnPhaseTransition`

- **Type**: Boolean
- **Default**: `true`
- **Description**: Automatically save files when transitioning between phases
- **Impact**: Ensures work is preserved during phase transitions

#### `specDrivenDevelopment.workflowBehavior.showDetailedProgress`

- **Type**: Boolean
- **Default**: `true`
- **Description**: Show detailed progress indicators and task completion status
- **Impact**: Provides comprehensive feedback about workflow progress

#### `specDrivenDevelopment.workflowBehavior.enableTaskDependencyValidation`

- **Type**: Boolean
- **Default**: `true`
- **Description**: Validate task dependencies before allowing execution
- **Impact**: Prevents execution of tasks that depend on incomplete prerequisites

### 2. UI Preferences Settings

Customizes the visual appearance and behavior of the extension interface.

#### `specDrivenDevelopment.uiPreferences.textWrapping`

- **Type**: String (enum)
- **Options**: `"auto"`, `"fixed"`, `"none"`
- **Default**: `"auto"`
- **Description**: Text wrapping behavior in panels and tooltips
- **Impact**:
  - `auto`: Dynamically wraps text based on panel width
  - `fixed`: Uses fixed width (80 characters) for text wrapping
  - `none`: Disables text wrapping entirely

#### `specDrivenDevelopment.uiPreferences.showTooltips`

- **Type**: Boolean
- **Default**: `true`
- **Description**: Show helpful tooltips on hover
- **Impact**: Controls visibility of contextual help tooltips

#### `specDrivenDevelopment.uiPreferences.animateTransitions`

- **Type**: Boolean
- **Default**: `true`
- **Description**: Enable smooth animations for UI transitions
- **Impact**: Provides visual feedback during state changes

#### `specDrivenDevelopment.uiPreferences.compactMode`

- **Type**: Boolean
- **Default**: `false`
- **Description**: Use compact layout to save space
- **Impact**: Reduces spacing and uses smaller UI elements

#### `specDrivenDevelopment.uiPreferences.highContrastMode`

- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable high contrast mode for better accessibility
- **Impact**: Automatically enabled when VS Code uses high contrast themes

### 3. Integration Settings

Configures integration with external tools and services.

#### `specDrivenDevelopment.integration.copilotPromptStyle`

- **Type**: String (enum)
- **Options**: `"detailed"`, `"concise"`
- **Default**: `"detailed"`
- **Description**: Style of prompts generated for GitHub Copilot
- **Impact**:
  - `detailed`: Includes comprehensive context and instructions
  - `concise`: Generates focused, minimal prompts

#### `specDrivenDevelopment.integration.customTemplateDirectory`

- **Type**: String
- **Default**: `""`
- **Description**: Path to custom template directory (relative to workspace root)
- **Impact**: Allows teams to use custom spec templates

#### `specDrivenDevelopment.integration.fileNamingConvention`

- **Type**: String (enum)
- **Options**: `"kebab-case"`, `"snake_case"`, `"camelCase"`
- **Default**: `"kebab-case"`
- **Description**: Naming convention for generated spec files
- **Impact**: Ensures consistency with team coding standards

### 4. Accessibility Settings

Provides enhanced accessibility features for users with disabilities.

#### `specDrivenDevelopment.accessibility.screenReaderSupport`

- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable enhanced screen reader support
- **Impact**: Provides additional ARIA labels and screen reader announcements

#### `specDrivenDevelopment.accessibility.keyboardNavigationEnhanced`

- **Type**: Boolean
- **Default**: `false`
- **Description**: Enable enhanced keyboard navigation shortcuts
- **Impact**: Adds additional keyboard shortcuts for common actions

### 5. Notification Settings

Controls when and how notifications are displayed.

#### `specDrivenDevelopment.notifications.showSuccessMessages`

- **Type**: Boolean
- **Default**: `true`
- **Description**: Show success notifications for completed actions
- **Impact**: Controls visibility of positive feedback messages

#### `specDrivenDevelopment.notifications.showProgressNotifications`

- **Type**: Boolean
- **Default**: `true`
- **Description**: Show progress notifications during long operations
- **Impact**: Provides feedback during time-consuming operations

#### `specDrivenDevelopment.notifications.enableSoundNotifications`

- **Type**: Boolean
- **Default**: `false`
- **Description**: Play sound notifications for important events
- **Impact**: Provides audio feedback for accessibility

## Accessing Settings

### Quick Settings Menu

Access the quick settings menu through:

1. Command Palette: `Spec: Settings`
2. Spec panel toolbar: Click the settings (⚙️) icon
3. Keyboard shortcut: When available

The quick settings menu provides:

- **Workflow Behavior**: Toggle common workflow settings
- **UI Preferences**: Customize appearance and layout
- **Integration**: Configure external tool integration
- **Accessibility**: Enable accessibility features
- **Notifications**: Control notification preferences
- **Open Settings UI**: Access full VS Code settings interface
- **Reset to Defaults**: Restore all settings to default values

### VS Code Settings Interface

Access through:

1. File → Preferences → Settings (or Code → Preferences → Settings on macOS)
2. Search for "Spec-Driven Development"
3. Configure individual settings with full descriptions

### Settings Scope

Settings can be configured at different scopes:

- **User Settings**: Apply globally across all workspaces
- **Workspace Settings**: Apply only to the current workspace
- **Folder Settings**: Apply to specific folders (when using multi-root workspaces)

## Settings Integration

### Text Wrapping

The text wrapping system automatically adjusts based on:

- Selected wrapping mode (`auto`, `fixed`, `none`)
- Compact mode setting
- Panel width (for auto mode)
- High contrast mode requirements

### Confirmation Dialogs

Confirmation dialogs are shown based on:

- `requirePhaseConfirmation`: Phase transition confirmations
- `showDetailedProgress`: Task completion confirmations
- `autoSaveOnPhaseTransition`: File operation confirmations

### Theme Integration

The extension automatically:

- Detects VS Code theme changes
- Enables high contrast mode when appropriate
- Adapts UI elements to match theme colors
- Maintains accessibility standards across themes

## Import/Export Settings

### Export Settings

```typescript
const settingsManager = SettingsManager.getInstance();
const settingsJson = settingsManager.exportSettings();
// Save or share the JSON string
```

### Import Settings

```typescript
const settingsManager = SettingsManager.getInstance();
await settingsManager.importSettings(settingsJson);
```

## Settings Validation

The system includes comprehensive validation:

- **Type checking**: Ensures settings have correct data types
- **Enum validation**: Validates enumerated values
- **Structure validation**: Ensures complete settings structure
- **Error handling**: Graceful handling of invalid configurations

## Performance Considerations

- Settings are cached in memory for fast access
- Configuration changes trigger minimal UI updates
- Text wrapping calculations are optimized for performance
- Settings validation is performed asynchronously

## Accessibility Compliance

The settings system supports:

- **WCAG 2.1 AA compliance**: Meets accessibility standards
- **Screen reader compatibility**: Enhanced when enabled
- **High contrast support**: Automatic theme detection
- **Keyboard navigation**: Full keyboard accessibility
- **Focus management**: Proper focus handling in dialogs

## Migration and Compatibility

- **Backward compatibility**: Supports settings from previous versions
- **Migration system**: Automatically migrates old settings format
- **Default fallbacks**: Provides sensible defaults for missing settings
- **Version detection**: Handles settings format changes gracefully

## Troubleshooting

### Common Issues

1. **Settings not applying**: Check workspace vs user settings scope
2. **Text wrapping issues**: Verify text wrapping mode setting
3. **Missing confirmations**: Check confirmation dialog settings
4. **Accessibility features not working**: Enable accessibility settings

### Reset Settings

To reset all settings to defaults:

1. Open quick settings menu
2. Select "Reset to Defaults"
3. Choose scope (workspace only or including user settings)

### Settings File Location

Settings are stored in VS Code's standard configuration:

- **User settings**: `~/.vscode/settings.json`
- **Workspace settings**: `.vscode/settings.json` in workspace root

## API Reference

### SettingsManager Class

The `SettingsManager` class provides the main interface for settings management:

```typescript
// Get singleton instance
const settingsManager = SettingsManager.getInstance();

// Get all settings
const settings = settingsManager.getSettings();

// Get specific setting categories
const workflowBehavior = settingsManager.getWorkflowBehavior();
const uiPreferences = settingsManager.getUIPreferences();
const integration = settingsManager.getIntegration();
const accessibility = settingsManager.getAccessibility();
const notifications = settingsManager.getNotifications();

// Check specific behaviors
const shouldConfirm =
  settingsManager.shouldShowConfirmationDialog("phaseTransition");
const shouldNotify = settingsManager.shouldShowNotification("success");
const wrappingConfig = settingsManager.getTextWrappingConfig();

// Update settings
await settingsManager.updateSetting("uiPreferences.textWrapping", "fixed");

// Listen for changes
settingsManager.onSettingsChanged((newSettings) => {
  // Handle settings change
});
```

## Future Enhancements

Planned improvements include:

- **Team settings**: Shared team configuration files
- **Setting profiles**: Predefined setting combinations
- **Advanced templates**: More customization options
- **Integration plugins**: Third-party tool integrations
- **Cloud sync**: Settings synchronization across devices
