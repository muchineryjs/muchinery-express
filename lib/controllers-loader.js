const { LoggerFactory } = require('muchinery');
const fs = require('fs');

const defaultControllersPath = path.join(process.cwd(), 'controllers');
const defaultRoutingBasePath = '/api/v1';
const dotFileMatch = new RegExp(/\/\.[^/]*$/);

class ControllersLoader {
  constructor(expressApp, options) {
    this.expressApp = expressApp;
    this.options = options || {};
    this.options.path = options.path || path.join(process.cwd(), 'controllers');
    this.options.routingBasePath = this.options.routingBasePath || '/api/v1';
    this.options.throwErrors = this.options.throwErrors || true;

    this.logger = LoggerFactory.getLogger(this.constructor.name);
  }

  /**
   * Starts the recursive load.
   */
  load() {
    this.recursiveLoad(this.options.path);
  }

  /**
   * Recursively loads controllers.
   * @param {string} path - initial controllers path 
   * @param {string} prefix - recursive path prefix 
   */
  recursiveLoad(path, prefix = null) {
    const currentPath = path + (prefix || '');
    this.logger.debug(`loading path: ${currentPath}`);
    fs.readdirSync(currentPath).forEach(_path => {
      const stats = fs.statSync(`${currentPath}/${_path}`);
      if (stats.isDirectory()) {
        this.recursiveLoad(path, `${prefix}/${_path}`);
      } else {
        this.loadController(`${currentPath}/${_path}`, prefix)
      }
    });
  }

  loadController(file, prefix) {
    if (dotFileMatch.test(file)) {
      this.logger.info('Ignoring this file', { file, });
      return;
    }
    try {
      try {
        this.loadRouteObj(prefix, file);
      } catch (e) {
        this.logger.error('Error loading controllers. ', {
          error: e.message,
          file,
        });
        this.logger.error(e.stack);
        if (options.throwErrors) {
          throw new Error('Error loading controllers');
        }
      }
    } catch (e) {
      this.logger.error(`Error loading file: ${file}`);
      this.logger.error(e.stack);
      if (this.options.throwErrors) {
        throw new Error(`Error loading file: ${file}`);
      }
    }
  }

  loadRouteObj(prefix, file) {
    if (file.indexOf('.js') !== file.length - 3) {
      this.logger.warn("Ignoring file because it doesn't end with .js", {
        prefix,
        file,
      });
      return;
    }
    const routeObj = require(file).autoroute;
  
    if (!routeObj) {
      this.logger.warn("Couldn't find route object for file. Does not expose route api.", {
        file,
      });
      return;
    }
  
    Object.keys(routeObj).forEach((method) => {
      const routeList = routeObj[method];
  
      if (!routeList) {
        throw new Error("Couldn't load route object for file. Not defined correctly.");
      }
  
      Object.keys(routeList).forEach((path) => {
        const func = routeList[path];
  
        let args = [prefix + path];
  
        // if func is array you need to merge them
        if (func instanceof Array) {
          args = args.concat(func);
        } else {
          args.push(func);
        }
  
        this.logger.info(`creating endpoint: ${prefix}${path}`);
        // do not change this until node 4 is out of maintenance
        // eslint-disable-next-line prefer-spread
        this.app[method].apply(this.app, args);
      });
    });
  }

}