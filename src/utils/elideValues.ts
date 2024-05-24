// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const elideValues = (key: string, value: any): any => {
  if (key.match(/pass([word|phrase]?)/i)) {
    return '***';
  }
  return value;
};
