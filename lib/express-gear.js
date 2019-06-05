const { Gear, LoggerFactory } = require('muchinery');
const express = require('express');
// const Router = require('./router');
const http = require('http');
const bodyParser = require('body-parser');
const compression = require('compression');
const methodOverride = require('method-override');
const helmet = require('helmet');
const cors = require('cors');
const ignoreFavicon = require('./middlewares/ignore-favicon');
// const errorMiddleware = require('./middlewares/error');
const enableDestroy = require('server-destroy');
const passport = require('passport');
const passportStrategy = require('./authorization/passport-strategy');
const autoroute = require('express-autoroute');

class ExpressGear extends Gear {
  constructor() {
    super('expressApi');
    this.logger = LoggerFactory.getLogger(this.constructor.name);
  }

  async start() {
    return new Promise(async (resolve, reject) => {
      try {
        this.app = express();
        this.configureApp();
    
        // routing
        this.app.use(this._config.basePath, (req, res) => {
          this.logger.info('Request received');
          return res.json({
            status: 'UP'
          })
        });

        await this.loadControllers(this._config.controllersPath || 'routes');

        // error handlers
        // this.setupErrorHandlers();
    
        await this.startServer();
        resolve();
      } catch(error) {
        reject(error);
      }
    });
  }

  async loadControllers(controllersPath) {
    return new Promise((resolve, reject) => {
      try {
        autoroute(this.app, {
          throwErrors: true,
          logger: this.logger,
          routesDir: process.cwd() + '/' + controllersPath
        })
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      this.logger.debug('starting API server');
      this.server = http.createServer(this.app);
      this.server.listen(this._config.port, (err) => {
        if (err) {
          return reject(err);
        }
        this.logger.info(`API server Listening on http://${this.server.address().address}:${this.server.address().port}`);

        return resolve();
      });

      /* Hack to close all pending connections: https://github.com/isaacs/server-destroy */
      enableDestroy(this.server);
    })
  }

  configureApp() {
    this.logger.debug('configuring API express app');
    const middlwaresOptions = this._config.middlewares || {
      defaults: true,
      ignoreFavicon: true,
    };
    
    // this._requestLoggerTransport = new RequestLoggerTransport();
    // this._app.use(expressWinston.logger(this._requestLoggerTransport.requestsLoggerTransports));
    if (middlwaresOptions.defaults) {
      this.use(bodyParser.json(), 'bodyParser.json');
      this.use(bodyParser.urlencoded({extended: true}), 'bodyParser.urlencoded');
      this.use(compression(), 'compression');
      this.use(methodOverride(), 'methodOverride');
      this.use(helmet(), 'helmet');
    }
    
    // {exposedHeaders: '*'}
    if (middlwaresOptions.cors) {
      this.logger.info(`setting CORS middleware with ${JSON.stringify(middlwaresOptions.cors)}`);
      this.app.use(cors(middlwaresOptions.cors));
    }
    
    
    (middlwaresOptions.ignoreFavicon) && this.use(ignoreFavicon, 'ignoreFavicon');
    
    if (middlwaresOptions.authorization) {
      this.use(passport.initialize(), 'passport');
      if (middlwaresOptions.authorization.jwt.secret) {
        passport.use('jwt', passportStrategy(middlwaresOptions.authorization.jwt.secret));
      }
    }
  }

  use(middleware, name = null) {
    name && this.logger.info(`setting ${name} middleware`);
    this.app.use(middleware);
  }
  /*
  setupErrorHandlers() {
    // configure error logger
    // this.app.use(expressWinston.errorLogger(this._requestLoggerTransport.errorLoggerTransports));
    // this.logger.debug('errorLogger ok');

    // convert APIError error
    this._app.use(errorMiddleware.converter);
    this._logger.debug('errorMiddleware.converter ok');

    // catch 404 and go on to error handler
    this._app.use(errorMiddleware.notFound);
    this._logger.debug('errorMiddleware.notFound ok');

    // error handler: stacktrace is sent only in development
    this._app.use(errorMiddleware.handler);
    this._logger.debug('errorMiddleware.handler ok');
  }
*/

}

module.exports = ExpressGear;

