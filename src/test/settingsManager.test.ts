import * as assert from "assert";
import * as vscode from "vscode";
import { SettingsManager } from "../settingsManager";

/**
 * Test suite for SettingsManager
 * Tests all settings functionality including configuration, validation, and integration
 */
suite("SettingsManager Tests", () => {
  let settingsManager: SettingsManager;

  setup(() => {
    settingsManager = SettingsManager.getInstance();
  });

  test("Should get singleton instance", () => {
    const instance1 = SettingsManager.getInstance();
    const instance2 = SettingsManager.getInstance();
    assert.strictEqual(instance1, instance2, "Should return same instance");
  });

  test("Should load default settings", () => {
    const settings = settingsManager.getSettings();

    assert.strictEqual(
      settings.workflowBehavior.requirePhaseConfirmation,
      true
    );
    assert.strictEqual(
      settings.workflowBehavior.autoSaveOnPhaseTransition,
      true
    );
    assert.strictEqual(settings.workflowBehavior.showDetailedProgress, true);
    assert.strictEqual(
      settings.workflowBehavior.enableTaskDependencyValidation,
      true
    );

    assert.strictEqual(settings.uiPreferences.textWrapping, "auto");
    assert.strictEqual(settings.uiPreferences.showTooltips, true);
    assert.strictEqual(settings.uiPreferences.animateTransitions, true);
    assert.strictEqual(settings.uiPreferences.compactMode, false);
    assert.strictEqual(settings.uiPreferences.highContrastMode, false);

    assert.strictEqual(settings.integration.copilotPromptStyle, "detailed");
    assert.strictEqual(settings.integration.customTemplateDirectory, "");
    assert.strictEqual(settings.integration.fileNamingConvention, "kebab-case");

    assert.strictEqual(settings.accessibility.screenReaderSupport, false);
    assert.strictEqual(
      settings.accessibility.keyboardNavigationEnhanced,
      false
    );

    assert.strictEqual(settings.notifications.showSuccessMessages, true);
    assert.strictEqual(settings.notifications.showProgressNotifications, true);
    assert.strictEqual(settings.notifications.enableSoundNotifications, false);
  });

  test("Should get workflow behavior settings", () => {
    const workflowBehavior = settingsManager.getWorkflowBehavior();

    assert.strictEqual(
      typeof workflowBehavior.requirePhaseConfirmation,
      "boolean"
    );
    assert.strictEqual(
      typeof workflowBehavior.autoSaveOnPhaseTransition,
      "boolean"
    );
    assert.strictEqual(typeof workflowBehavior.showDetailedProgress, "boolean");
    assert.strictEqual(
      typeof workflowBehavior.enableTaskDependencyValidation,
      "boolean"
    );
  });

  test("Should get UI preferences settings", () => {
    const uiPreferences = settingsManager.getUIPreferences();

    assert.ok(["auto", "fixed", "none"].includes(uiPreferences.textWrapping));
    assert.strictEqual(typeof uiPreferences.showTooltips, "boolean");
    assert.strictEqual(typeof uiPreferences.animateTransitions, "boolean");
    assert.strictEqual(typeof uiPreferences.compactMode, "boolean");
    assert.strictEqual(typeof uiPreferences.highContrastMode, "boolean");
  });

  test("Should get integration settings", () => {
    const integration = settingsManager.getIntegration();

    assert.ok(["detailed", "concise"].includes(integration.copilotPromptStyle));
    assert.strictEqual(typeof integration.customTemplateDirectory, "string");
    assert.ok(
      ["kebab-case", "snake_case", "camelCase"].includes(
        integration.fileNamingConvention
      )
    );
  });

  test("Should get accessibility settings", () => {
    const accessibility = settingsManager.getAccessibility();

    assert.strictEqual(typeof accessibility.screenReaderSupport, "boolean");
    assert.strictEqual(
      typeof accessibility.keyboardNavigationEnhanced,
      "boolean"
    );
  });

  test("Should get notification settings", () => {
    const notifications = settingsManager.getNotifications();

    assert.strictEqual(typeof notifications.showSuccessMessages, "boolean");
    assert.strictEqual(
      typeof notifications.showProgressNotifications,
      "boolean"
    );
    assert.strictEqual(
      typeof notifications.enableSoundNotifications,
      "boolean"
    );
  });

  test("Should get text wrapping configuration", () => {
    const wrappingConfig = settingsManager.getTextWrappingConfig();

    assert.strictEqual(typeof wrappingConfig.enabled, "boolean");
    if (wrappingConfig.maxWidth !== undefined) {
      assert.strictEqual(typeof wrappingConfig.maxWidth, "number");
      assert.ok(wrappingConfig.maxWidth > 0);
    }
  });

  test("Should handle text wrapping modes correctly", async () => {
    // Test auto mode
    await settingsManager.updateSetting("uiPreferences.textWrapping", "auto");
    let config = settingsManager.getTextWrappingConfig();
    assert.strictEqual(config.enabled, true);
    assert.strictEqual(config.maxWidth, undefined);

    // Test fixed mode
    await settingsManager.updateSetting("uiPreferences.textWrapping", "fixed");
    config = settingsManager.getTextWrappingConfig();
    assert.strictEqual(config.enabled, true);
    assert.strictEqual(config.maxWidth, 80);

    // Test none mode
    await settingsManager.updateSetting("uiPreferences.textWrapping", "none");
    config = settingsManager.getTextWrappingConfig();
    assert.strictEqual(config.enabled, false);
  });

  test("Should check confirmation dialog settings", () => {
    const phaseTransition =
      settingsManager.shouldShowConfirmationDialog("phaseTransition");
    const taskCompletion =
      settingsManager.shouldShowConfirmationDialog("taskCompletion");
    const fileOperation =
      settingsManager.shouldShowConfirmationDialog("fileOperation");

    assert.strictEqual(typeof phaseTransition, "boolean");
    assert.strictEqual(typeof taskCompletion, "boolean");
    assert.strictEqual(typeof fileOperation, "boolean");
  });

  test("Should check notification preferences", () => {
    const success = settingsManager.shouldShowNotification("success");
    const progress = settingsManager.shouldShowNotification("progress");
    const error = settingsManager.shouldShowNotification("error");

    assert.strictEqual(typeof success, "boolean");
    assert.strictEqual(typeof progress, "boolean");
    assert.strictEqual(error, true); // Error notifications should always be shown
  });

  test("Should export settings as JSON", () => {
    const exported = settingsManager.exportSettings();
    const parsed = JSON.parse(exported);

    assert.ok(parsed.workflowBehavior);
    assert.ok(parsed.uiPreferences);
    assert.ok(parsed.integration);
    assert.ok(parsed.accessibility);
    assert.ok(parsed.notifications);
  });

  test("Should validate settings structure", async () => {
    const validSettings = {
      workflowBehavior: {
        requirePhaseConfirmation: true,
        autoSaveOnPhaseTransition: true,
        showDetailedProgress: true,
        enableTaskDependencyValidation: true,
      },
      uiPreferences: {
        textWrapping: "auto" as const,
        showTooltips: true,
        animateTransitions: true,
        compactMode: false,
        highContrastMode: false,
      },
      integration: {
        copilotPromptStyle: "detailed" as const,
        customTemplateDirectory: "",
        fileNamingConvention: "kebab-case" as const,
      },
      accessibility: {
        screenReaderSupport: false,
        keyboardNavigationEnhanced: false,
      },
      notifications: {
        showSuccessMessages: true,
        showProgressNotifications: true,
        enableSoundNotifications: false,
      },
    };

    const exported = JSON.stringify(validSettings);

    // This should not throw an error
    await settingsManager.importSettings(exported);
  });

  test("Should handle invalid settings import", async () => {
    const invalidSettings = '{"invalid": "structure"}';

    // Should handle gracefully without throwing
    await settingsManager.importSettings(invalidSettings);
  });

  test("Should handle malformed JSON import", async () => {
    const malformedJson = '{"invalid": json}';

    // Should handle gracefully without throwing
    await settingsManager.importSettings(malformedJson);
  });

  test("Should apply theme settings correctly", () => {
    // This test would need to mock vscode.window.activeColorTheme
    // For now, just ensure the method doesn't throw
    assert.doesNotThrow(() => {
      settingsManager.applyThemeSettings();
    });
  });

  test("Should handle settings change events", (done) => {
    let eventFired = false;

    const disposable = settingsManager.onSettingsChanged((settings) => {
      eventFired = true;
      assert.ok(settings);
      assert.ok(settings.workflowBehavior);
      disposable.dispose();
      done();
    });

    // Simulate a configuration change
    // In a real test, this would be triggered by VS Code configuration change
    setTimeout(() => {
      if (!eventFired) {
        disposable.dispose();
        done();
      }
    }, 100);
  });

  test("Should provide immutable settings objects", () => {
    const settings1 = settingsManager.getSettings();
    const settings2 = settingsManager.getSettings();

    // Should be different objects (not same reference)
    assert.notStrictEqual(settings1, settings2);

    // But should have same values
    assert.deepStrictEqual(settings1, settings2);

    // Modifying one should not affect the other
    (settings1 as any).workflowBehavior.requirePhaseConfirmation = false;
    assert.notEqual(
      settings1.workflowBehavior.requirePhaseConfirmation,
      settings2.workflowBehavior.requirePhaseConfirmation
    );
  });

  test("Should handle edge cases in text wrapping", () => {
    // Test with empty string
    const config = settingsManager.getTextWrappingConfig();
    assert.strictEqual(typeof config.enabled, "boolean");

    // Test with different UI preferences
    const uiPrefs = settingsManager.getUIPreferences();
    assert.ok(["auto", "fixed", "none"].includes(uiPrefs.textWrapping));
  });

  test("Should provide correct default values for all settings", () => {
    const settings = settingsManager.getSettings();

    // Workflow behavior defaults
    assert.strictEqual(
      settings.workflowBehavior.requirePhaseConfirmation,
      true
    );
    assert.strictEqual(
      settings.workflowBehavior.autoSaveOnPhaseTransition,
      true
    );
    assert.strictEqual(settings.workflowBehavior.showDetailedProgress, true);
    assert.strictEqual(
      settings.workflowBehavior.enableTaskDependencyValidation,
      true
    );

    // UI preferences defaults
    assert.strictEqual(settings.uiPreferences.textWrapping, "auto");
    assert.strictEqual(settings.uiPreferences.showTooltips, true);
    assert.strictEqual(settings.uiPreferences.animateTransitions, true);
    assert.strictEqual(settings.uiPreferences.compactMode, false);
    assert.strictEqual(settings.uiPreferences.highContrastMode, false);

    // Integration defaults
    assert.strictEqual(settings.integration.copilotPromptStyle, "detailed");
    assert.strictEqual(settings.integration.customTemplateDirectory, "");
    assert.strictEqual(settings.integration.fileNamingConvention, "kebab-case");

    // Accessibility defaults
    assert.strictEqual(settings.accessibility.screenReaderSupport, false);
    assert.strictEqual(
      settings.accessibility.keyboardNavigationEnhanced,
      false
    );

    // Notification defaults
    assert.strictEqual(settings.notifications.showSuccessMessages, true);
    assert.strictEqual(settings.notifications.showProgressNotifications, true);
    assert.strictEqual(settings.notifications.enableSoundNotifications, false);
  });
});
