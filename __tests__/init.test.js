import { expect, test } from '@jest/globals';
import sum from '../src/sum.js';

// тесты в процессе, пока вставил тест, только ради наличия и бейджей.
// По ходу проверок буду добавлять.
test('test1', () => {
  expect(sum(2, 3)).toBe(5);
});
