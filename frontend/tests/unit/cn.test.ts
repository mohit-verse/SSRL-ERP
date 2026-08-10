import { describe, it, expect } from 'vitest';
import { cn } from '../../src/utils/cn';

describe('Utility: cn (Tailwind Merge + clsx)', () => {
  it('should merge tailwind classes correctly', () => {
    const result = cn('p-4 text-red-500', 'p-6');
    expect(result).toBe('text-red-500 p-6');
  });

  it('should conditionally apply classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class', !isActive && 'hidden');
    expect(result).toBe('base-class active-class');
  });

  it('should handle arrays and objects', () => {
    const result = cn(['p-2', 'm-2'], { 'text-bold': true, 'text-sm': false });
    expect(result).toBe('p-2 m-2 text-bold');
  });
});
