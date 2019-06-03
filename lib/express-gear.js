const { Gear } = require('muchinery');
const express = require('express');
// const Router = require('./router');
const http = require('http');
const bodyParser = require('body-parser');
const compression = require('compression');
const methodOverride = require('method-override');
const helmet = require('helmet');
const cors = require('cors');
// const ignoreFavicon = require('./middlewares/ignore-favicon');
// const errorMiddleware = require('./middlewares/error');
const enableDestroy = require('server-destroy');
// const passport = require('passport');
// const passportStrategy = require('./passport-strategy');

module.exports = class ExpressGear extends Gear {
  constructor() {
    super();
  }

  async start() {
    return new Promise(async (resolve, reject) => {
      try {
        this.logger.info(`${ExpressGear.name} started`);
        this.logger.info(`bootstrapping ${ExpressGear.name} gear`);
        this.app = express();
        this.configureApp();
    
        // routing
        this.app.use(this._config.basePath, (req, res) => {
          this.logger.info('Request received');
          return res.json({
            status: 'UP'
          })
        });
    
        // error handlers
        // this.setupErrorHandlers();
    
        await this.startServer();
        resolve();
      } catch(error) {
        reject(error);
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

    // this._requestLoggerTransport = new RequestLoggerTransport();
    // this._app.use(expressWinston.logger(this._requestLoggerTransport.requestsLoggerTransports));

    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({extended: true}));
    this.app.use(compression());
    this.app.use(methodOverride());
    this.app.use(helmet());
    this.app.use(cors({exposedHeaders: '*'}));
    // this.app.use(ignoreFavicon);

    
    /*
    if (this._securityConfig.enabled) {
      this._app.use(passport.initialize());
      passport.use('jwt', passportStrategy(this._securityConfig.jwt.secret));
    }
    */
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
  static get name() {
    return 'expressApi';
  }

}



