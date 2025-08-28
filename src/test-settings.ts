/**
 * Manual test script for Settings Manager
 * This can be run to verify settings functionality
 */

import { SettingsManager } from "./settingsManager";

export async function testSettingsManager(): Promise<void> {
  console.log("🧪 Testing Settings Manager...");

  try {
    const settingsManager = SettingsManager.getInstance();

    // Test 1: Get default settings
    console.log("✅ Test 1: Getting default settings");
    const settings = settingsManager.getSettings();
    console.log("Default settings loaded:", {
      workflowBehavior: settings.workflowBehavior.requirePhaseConfirmation,
      textWrapping: settings.uiPreferences.textWrapping,
      copilotStyle: settings.integration.copilotPromptStyle,
      screenReader: settings.accessibility.screenReaderSupport,
    });

    // Test 2: Text wrapping configuration
    console.log("✅ Test 2: Text wrapping configuration");
    const wrappingConfig = settingsManager.getTextWrappingConfig();
    console.log("Text wrapping config:", wrappingConfig);

    // Test 3: Confirmation dialog settings
    console.log("✅ Test 3: Confirmation dialog settings");
    const phaseConfirmation =
      settingsManager.shouldShowConfirmationDialog("phaseTransition");
    const taskConfirmation =
      settingsManager.shouldShowConfirmationDialog("taskCompletion");
    console.log("Confirmation dialogs:", {
      phaseConfirmation,
      taskConfirmation,
    });

    // Test 4: Notification preferences
    console.log("✅ Test 4: Notification preferences");
    const successNotifications =
      settingsManager.shouldShowNotification("success");
    const progressNotifications =
      settingsManager.shouldShowNotification("progress");
    const errorNotifications = settingsManager.shouldShowNotification("error");
    console.log("Notifications:", {
      successNotifications,
      progressNotifications,
      errorNotifications,
    });

    // Test 5: Export settings
    console.log("✅ Test 5: Export settings");
    const exported = settingsManager.exportSettings();
    const exportedObj = JSON.parse(exported);
    console.log(
      "Settings exported successfully, keys:",
      Object.keys(exportedObj)
    );

    // Test 6: Individual setting getters
    console.log("✅ Test 6: Individual setting getters");
    const workflowBehavior = settingsManager.getWorkflowBehavior();
    const uiPreferences = settingsManager.getUIPreferences();
    const integration = settingsManager.getIntegration();
    const accessibility = settingsManager.getAccessibility();
    const notifications = settingsManager.getNotifications();

    console.log("Individual settings retrieved:", {
      workflowKeys: Object.keys(workflowBehavior),
      uiKeys: Object.keys(uiPreferences),
      integrationKeys: Object.keys(integration),
      accessibilityKeys: Object.keys(accessibility),
      notificationKeys: Object.keys(notifications),
    });

    console.log("🎉 All settings tests passed!");
  } catch (error) {
    console.error("❌ Settings test failed:", error);
    throw error;
  }
}

// Export for use in other test files
export { testSettingsManager as default };
