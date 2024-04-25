import * as EmailValidator from 'email-validator';

import { AuthenticationRestResult } from '../types/apicalls.js';
import { TagtoolRequest } from '../session.js';
import { UserModel } from '../types/model.js';
import express from 'express';
import { getDbUserByEmail } from '../database/mysql.js';

export const login = async (req: TagtoolRequest, res: express.Response) => {
  try {
    const email: string = req.body.email;
    if (!EmailValidator.validate(email)) {
      res.status(400);
      return;
    }

    const user: UserModel = await getDbUserByEmail(email);

    if (!user) {
      const result: AuthenticationRestResult = {
        email: undefined,
        isLoggedIn: false,
        message: 'Invalid email',
      };
      req.session.userId = undefined;
      req.session.email = undefined;
      req.session.save((err: Error) => {
        if (err) {
          console.error('Failed saving session', err);
        }
      });

      res.statusCode = 403;
      return res.send(result);
    }

    const result: AuthenticationRestResult = {
      email: email,
      isLoggedIn: true,
      sessionId: req.session.id,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('x-session-id', req.session.id);
    res.cookie('sessionId', req.session.id);

    req.session.userId = user.userId;
    req.session.email = email;
    console.log(`User ${email} logged in and has userId ${user.userId}`);
    req.session.save((err: Error) => {
      if (err) {
        console.error('Failed saving session', err);
      }
    });

    res.status(200);
    res.send(result);
  } catch (e) {
    res.status(500);
    console.warn(e);
    res.send();
  } finally {
    res.end();
  }
};
