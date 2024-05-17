export const elideValues = (key: string, value: any): any => {
  if (key.match(/pass([word|phrase]?)/i)) {
    return '***';
  }
  return value;
};
