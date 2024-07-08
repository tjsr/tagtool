import {
  EXPRESS_DEFAULT_OPTIONS,
  Plugins as ExpressHelperPlugin,
  ExpressServerConfig,
} from '../types/expressConfig.js';
import { UserSessionOptions, useUserSessionMiddleware } from '@tjsr/user-session-middleware';
import cors, { CorsOptions } from 'cors';
import express, { Handler, NextFunction } from 'express';
import { isProductionMode, loadEnv } from '@tjsr/simple-env-utils';
import requestIp, { Options } from 'request-ip';

import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import session from 'express-session';

const morganLog = morgan('common');
loadEnv();
type MiddlewareAddFunction = () => Handler | void;

const toProperCase = (str: string) =>
  str
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export class ExpressServerHelper {
  private _app!: express.Express;

  private _config: ExpressServerConfig = { ...EXPRESS_DEFAULT_OPTIONS };
  private _middleware: MiddlewareAddFunction[] = [];
  private _middlewareIds: string[] = [];

  public constructor(config?: Partial<ExpressServerConfig>) {
    if (config) {
      this.config = config;
    }
  }

  public set config(config: Partial<ExpressServerConfig>) {
    if (config === undefined) {
      throw new Error('No configuration provided to startApp.');
    }
    this._config = {
      ...EXPRESS_DEFAULT_OPTIONS,
      ...config,
    };
    if (this._config.sessionOptions?.store === undefined && isProductionMode()) {
      throw new Error('MemoryStore is not permitted for use in production mode.');
    }

    if (this._config.sessionOptions.store === undefined) {
      this._config.sessionOptions.store = new session.MemoryStore();
    }
  }

  public addMiddleware(): ExpressServerHelper {
    this.loadPlugins(['morgan', 'cors', 'requestIp', 'trustProxy', 'exposeHeaders', 'cookieParser']);

    if (this._config.sessionOptions) {
      this.withUserSessionMiddleware();
    }

    this.loadPlugins(['urlEncoded', 'json']);

    return this;
  }

  public app(): express.Express {
    if (this._app === undefined) {
      this.init();
    }
    return this._app;
  }

  public init(): ExpressServerHelper {
    if (this._app === undefined) {
      this._app = express();
    }
    this.addMiddleware();
    this._middleware.forEach((middlewareAddFunction, index) => {
      const pluginNameForIndex = this._middlewareIds[index];
      const handler: Handler | void = middlewareAddFunction();
      if (handler) {
        this._app.use(handler);
      }
      if (!isProductionMode()) {
        console.log('Successfully loaded middleware', pluginNameForIndex);
      }
    });
    return this;
  }

  public withAccessControlOrigin(origin: string = '*'): ExpressServerHelper {
    return this.withHeader('Access-Control-Allow-Origin', origin);
  }

  public withCookieParser(): ExpressServerHelper {
    return this.wrapHandlerAdd(
      () => cookieParser(this._config.cookieParserSecret, this._config.cookieParserOptions),
      'cookieParser'
    );
  }

  public withCors(corsOptions: CorsOptions): ExpressServerHelper {
    return this.wrapHandlerAdd(() => cors(corsOptions), 'cors');
  }

  public withExposeHeaders(headers: string = '*'): ExpressServerHelper {
    return this.withHeader('Access-Control-Expose-Headers', headers);
  }

  public withHeader(header: string, value: string): ExpressServerHelper {
    const headerMiddleware: express.RequestHandler = (_request, response, next: NextFunction): void => {
      response.header(header, value);
      next();
    };
    this.wrapHandlerAdd(() => headerMiddleware, `header=${header}`);
    return this;
  }

  public withJson(): ExpressServerHelper {
    this.wrapHandlerAdd(() => express.json(), 'json');
    return this;
  }

  public withMorgan(): ExpressServerHelper {
    this.wrapHandlerAdd(() => morganLog, 'morgan');
    return this;
  }

  public withRequestIp(options?: Options): ExpressServerHelper {
    const useOptions: Options | undefined = options || (typeof options !== 'boolean' ? options : undefined);
    return this.wrapHandlerAdd(() => requestIp.mw(useOptions), 'requestIp');
  }

  public withTrustProxy(): ExpressServerHelper {
    this._app.set('trust proxy', true);
    return this;
  }

  public withUrlEncoded(): ExpressServerHelper {
    return this.wrapHandlerAdd(
      () =>
        express.urlencoded({
          extended: true,
        }),
      'urlEncoded'
    );
  }

  public withUserSessionMiddleware(sessionOptions?: Partial<UserSessionOptions>): ExpressServerHelper {
    const options: Partial<UserSessionOptions> = sessionOptions || this._config.sessionOptions;
    this.wrapHandlerAdd(() => useUserSessionMiddleware(this._app, options), 'useUserSessionMiddleware');
    return this;
  }

  private getWithFunction(plugin: ExpressHelperPlugin): Function {
    const withFunctionName = `with${toProperCase(plugin)}`;
    const configFunction: Function = this[withFunctionName as keyof this] as Function;
    if (configFunction === undefined) {
      throw new Error(`Function ${withFunctionName} does not exist to process plugin ${plugin}`);
    }
    return configFunction;
  }

  private loadPlugins(plugins: ExpressHelperPlugin[]): void {
    plugins.forEach((plugin: ExpressHelperPlugin) => {
      this.queuePluginToLoad(plugin, this._config);
    });
  }

  private queuePluginToLoad(pluginName: ExpressHelperPlugin, config: ExpressServerConfig): ExpressServerHelper {
    const hasPlugin = config[pluginName];
    if (hasPlugin) {
      const configFunction: Function = this.getWithFunction(pluginName);
      if (typeof config[pluginName] === 'boolean') {
        const result = configFunction.call(this);
        return result;
      } else {
        const result = configFunction.call(this, config[pluginName]);
        return result;
      }
    }
    return this;
  }

  private wrapHandlerAdd(middlewareCallbackAdd: MiddlewareAddFunction, id: string) {
    if (this._middleware.length !== this._middlewareIds.length) {
      throw new Error('Middleware array and id array length do not match.');
    }

    if (typeof middlewareCallbackAdd === 'function') {
      this._middleware.push(middlewareCallbackAdd) - 1;
      this._middlewareIds.push(id);
    } else {
      throw new Error('Add handler which is a function');
    }
    return this;
  }
}
