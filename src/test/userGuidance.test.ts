import * as assert from "assert";
import { UserGuidanceProvider } from "../userGuidance";
import { SpecPhase } from "../specWorkflowManager";

suite("UserGuidance Tests", () => {
  test("Should provide requirements phase guidance", async () => {
    const guidance = await UserGuidanceProvider.getContextualGuidance(
      SpecPhase.REQUIREMENTS,
      { featureName: "test-feature", hasFiles: false }
    );

    assert.strictEqual(guidance.phase, SpecPhase.REQUIREMENTS);
    assert.ok(guidance.steps.length > 0);
    assert.ok(guidance.tips.length > 0);
    assert.ok(guidance.commonIssues.length > 0);

    // Should have a high priority next step
    const nextSteps = guidance.steps.filter(
      (s) => s.category === "next-step" && s.priority === "high"
    );
    assert.ok(nextSteps.length > 0);
  });

  test("Should provide design phase guidance", async () => {
    const guidance = await UserGuidanceProvider.getContextualGuidance(
      SpecPhase.DESIGN,
      { featureName: "test-feature", hasFiles: true }
    );

    assert.strictEqual(guidance.phase, SpecPhase.DESIGN);
    assert.ok(guidance.tips.some((tip) => tip.includes("architecture")));
  });

  test("Should provide execution phase guidance", async () => {
    const guidance = await UserGuidanceProvider.getContextualGuidance(
      SpecPhase.EXECUTION,
      {
        featureName: "test-feature",
        hasFiles: true,
        completedTasks: 2,
        totalTasks: 5,
      }
    );

    assert.strictEqual(guidance.phase, SpecPhase.EXECUTION);
    assert.ok(guidance.steps.some((s) => s.title.includes("Continue")));
  });

  test("Should validate input correctly", () => {
    // Valid input
    const validResult = UserGuidanceProvider.validateInput(
      "valid feature name",
      "feature-name"
    );
    assert.strictEqual(validResult.isValid, true);

    // Invalid input - too short
    const invalidResult = UserGuidanceProvider.validateInput(
      "ab",
      "feature-name"
    );
    assert.strictEqual(invalidResult.isValid, false);
    assert.ok(
      invalidResult.suggestions && invalidResult.suggestions.length > 0
    );

    // Empty input
    const emptyResult = UserGuidanceProvider.validateInput(
      "",
      "feature-description"
    );
    assert.strictEqual(emptyResult.isValid, false);
    assert.ok(emptyResult.message?.includes("empty"));
  });

  test("Should provide progress encouragement", () => {
    const encouragement0 = UserGuidanceProvider.getProgressEncouragement(0, 5);
    assert.ok(encouragement0.includes("start"));

    const encouragement50 = UserGuidanceProvider.getProgressEncouragement(3, 6);
    assert.ok(encouragement50.includes("halfway"));

    const encouragement100 = UserGuidanceProvider.getProgressEncouragement(
      5,
      5
    );
    assert.ok(encouragement100.includes("Congratulations"));
  });
});
