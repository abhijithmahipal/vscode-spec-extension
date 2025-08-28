// Simple test file to verify robustness improvements
import { SpecWorkflowManager, SpecPhase } from "./specWorkflowManager";

// This is a basic test to verify the new validation and debouncing features
async function testRobustnessFeatures() {
  const manager = new SpecWorkflowManager();

  console.log("Testing robustness improvements...");

  // Test 1: Debouncing - rapid calls should be blocked
  console.log("Test 1: Debouncing");
  const result1 = await manager.moveToNextPhase();
  const result2 = await manager.moveToNextPhase(); // Should be debounced

  console.log("First call success:", result1.success);
  console.log("Second call (debounced):", result2.success, result2.error);

  // Test 2: Validation - should fail without proper files
  console.log("\nTest 2: Validation without files");
  const result3 = await manager.moveToNextPhase();
  console.log("Validation result:", result3.success, result3.error);

  console.log("Robustness tests completed!");
}

// Export for potential use in actual tests
export { testRobustnessFeatures };
