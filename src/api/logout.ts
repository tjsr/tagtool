import { AuthenticationRestResult } from '../types/apicalls';
import { TagtoolRequest } from '../session';
import { UserId } from '../types';
import express from 'express';
import { getUserId } from '../auth/user';

export const logout = async (request: TagtoolRequest, res: express.Response) => {
  const userId: UserId = getUserId(request);
  console.log(`Got logout userId ${userId}`);
  const result: AuthenticationRestResult = {
    email: undefined,
    isLoggedIn: false,
  };
  try {
    request.session.userId = undefined;
    request.session.email = undefined;
    request.session.save((err) => {
      if (err) {
        console.error(`Failed saving session`, err);
      }
    });

    res.status(200);
    res.send(result);
  } catch (e) {
    res.status(500);
    console.log(e);
    res.send(result);
  } finally {
    res.end();
  }
};
