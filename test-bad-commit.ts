// This file intentionally has TypeScript errors to test pre-commit hooks
const badCode: string = 123; // Type error
const arr = [1, 2, 3];
const item = arr[10].toString(); // Unchecked array access error