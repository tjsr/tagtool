import crypto from 'crypto';
const CURRENT_TEST_RUN_ID = Math.floor(Math.random() * 1000);

export const generateSuiteId = (suiteId: string, suiteRange = 1000): number => {
  const hash = crypto.createHash('md5').update(suiteId).digest('hex');
  const number = parseInt(hash.substring(0, 15), 16) % suiteRange;
  return number;
};

export const generateTestIdNumber = (suiteId: string, suiteRange = 1000, range = 1000000): number => {
  const testIdNumber = generateSuiteId(suiteId) * suiteRange + CURRENT_TEST_RUN_ID + range;
  return testIdNumber;
};

export const generateTestIdString = (suiteId: string, prefix = 'id', range = 1000): string => {
  const testIdNumber = generateTestIdNumber(suiteId, range);
  return `${prefix}${testIdNumber.toString().padStart(7, '0')}`;
};

export const createTestUserId = (suite: string): string => {
  return generateTestIdString(suite, 'u', 1000);
};

export const createTestObjectId = (suite: string): string => {
  return generateTestIdString(suite, 'o', 1000);
};

export const createTestSessionId = (suite: string): string => {
  return generateTestIdString(suite, 'o', 1000);
};
