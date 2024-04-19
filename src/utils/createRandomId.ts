import { getSnowflake } from '../snowflake';
import { uuid5 } from '../types';
import { v5 as uuidv5 } from 'uuid';

export const createRandomId = (namespace: string): uuid5 => {
  return uuidv5(getSnowflake().toString(), namespace);
};
