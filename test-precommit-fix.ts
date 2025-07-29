// Test file to validate pre-commit hooks work correctly
export const testValue = "Pre-commit optimization success";

export function validateSetup(): boolean {
  return testValue.length > 0;
}