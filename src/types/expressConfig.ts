import { ExpressServerConfig } from '@tjsr/express-server-helper';

export type Plugins =
  | 'morgan'
  | 'cookieParser'
  | 'cors'
  | 'requestIp'
  | 'trustProxy'
  | 'exposeHeaders'
  | 'urlEncoded'
  | 'json';

export const EXPRESS_DEFAULT_OPTIONS: ExpressServerConfig = {
  // TODO: express-session no longer needs cookie parser, so if the app isn't using cookies, eg we're
  // going to store all user data in a session, we don't need to use cookie-parser.
  cookieParser: true,
  exposeHeaders: '*',
  json: true,
  morgan: process.env['USE_LOGGING'] !== 'false',
  requestIp: true,
  sessionOptions: {
    skipExposeHeaders: false,
    store: undefined,
  },
  trustProxy: true,
  urlEncoded: true,
};
