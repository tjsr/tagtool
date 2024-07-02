import { validateObjectId } from './validateObjectId.js';

describe('validateObjectId', () => {
  test('Should allow sane sized tag', () => {
    expect(validateObjectId('abc123')).toBe(true);
  });

  test('Should reject really long tag', () => {
    expect(
      validateObjectId('abcdef01234567890abcdef01234567890abcdef01234567890')
    ).toBe(false);
  });

  test('Should reject tag with invalid characters', () => {
    expect(validateObjectId('abc123!')).toBe(false);
  });

  test('Should allow uuid tag in test mode', () => {
    expect(validateObjectId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });
});
