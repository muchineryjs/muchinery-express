const { createGear, LoggerFactory } = require('muchinery');
const express = require('express');
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
const ControllersLoader = require('./controllers-loader');
const path = require('path');

const ExpressGear = (name) => createGear(name, LoggerFactory.getLogger(name))({
  async start() {
    try {
      this.app = express();
      this.configureApp();
      await this.loadControllers();

      // error handlers
      // this.setupErrorHandlers();
  
      await this.startServer();
    } catch(error) {
      throw error;
    }
  },

  async loadControllers() {
    return new Promise((resolve, reject) => {
      try {
        const loader = new ControllersLoader(this.app, {
          path: path.join(process.cwd(), this._config.controllers.path),
          routingBasePath: this._config.basePath,
        });
        loader.load();
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  },

  async startServer() {
    return new Promise((resolve, reject) => {
      this._logger.debug('starting API server');
      this.server = http.createServer(this.app);
      this.server.listen(this._config.port, (err) => {
        if (err) {
          reject(err);
        }
        this._logger.info(`API server Listening on http://${this.server.address().address}:${this.server.address().port}`);

        resolve();
      });

      /* Hack to close all pending connections: https://github.com/isaacs/server-destroy */
      enableDestroy(this.server);
    })
  },

  configureApp() {
    this._logger.debug('configuring API express app');
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
      this._logger.info(`setting CORS middleware with ${JSON.stringify(middlwaresOptions.cors)}`);
      this.app.use(cors(middlwaresOptions.cors));
    }
    
    
    (middlwaresOptions.ignoreFavicon) && this.use(ignoreFavicon, 'ignoreFavicon');
    
    if (middlwaresOptions.authorization) {
      this.use(passport.initialize(), 'passport');
      if (middlwaresOptions.authorization.jwt.secret) {
        passport.use('jwt', passportStrategy(middlwaresOptions.authorization.jwt.secret));
      }
    }
  },

  use(middleware, name = null) {
    name && this._logger.info(`setting ${name} middleware`);
    this.app.use(middleware);
  },

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
});



module.exports = ExpressGear;

