import { expect, test } from '@jest/globals';
import sum from '../src/sum.js';

test('test1', () => {
expect(sum(2, 3)).toBe(5);
});
