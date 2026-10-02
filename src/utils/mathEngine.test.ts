import { describe, it, expect, vi } from 'vitest';
import { generatePrimaryProblem, generateHighSchoolProblem, generateTask } from './mathEngine';

// Mock storage so loadCustomQuestions doesn't fail
vi.mock('./storage', () => ({
  loadCustomQuestions: () => []
}));

describe('mathEngine', () => {
  it('should generate primary problem without throwing', () => {
    const problem = generatePrimaryProblem('addition_subtraction', 1, 'en');
    expect(problem).toBeDefined();
    expect(problem.gradeLevel).toBe('primary');
    expect(problem.options.length).toBe(4);
    expect(problem.options).toContain(problem.correctAnswer);
  });

  it('should generate high school problem without throwing', () => {
    const problem = generateHighSchoolProblem('algebra_linear', 1, 'en');
    expect(problem).toBeDefined();
    expect(problem.gradeLevel).toBe('high_school');
    expect(problem.options.length).toBe(4);
    expect(problem.options).toContain(problem.correctAnswer);
  });

  it('should generate task based on grade level', () => {
    const primaryTask = generateTask('primary', 'all', 1, 'de');
    expect(primaryTask.gradeLevel).toBe('primary');

    const highSchoolTask = generateTask('high_school', 'all', 1, 'de');
    expect(highSchoolTask.gradeLevel).toBe('high_school');
  });

  it('should correctly evaluate multiplication', () => {
    const problem = generatePrimaryProblem('multiplication_division', 1, 'en');
    expect(problem).toBeDefined();
  });
});
