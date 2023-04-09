import { validateObjectId } from './validateObjectId';

describe('validateObjectId', () => {
  test('Should allow sane sized tag', () => {
    expect(validateObjectId('abc123')).toBe(true);
  });

  test('Should reject really long tag', () => {
    expect(validateObjectId('abcdef01234567890abcdef01234567890abcdef01234567890')).toBe(false);
  });
});

