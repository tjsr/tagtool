let TEST_MODE = false;

export const setTestMode = (): void => {
  TEST_MODE = true;
};

export const isTestMode = (): boolean => {
  return process.env.NODE_ENV === 'test' || TEST_MODE;
};
