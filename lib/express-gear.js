const { Gear } = require('muchinery');

module.exports = class ExpressGear extends Gear {
  constructor({routingService}) {
    super();
    this.api = 'express-component';
    this.routingService = routingService;
  }

  start() {
    this.logger.info(`${ExpressGear.name} started`);
    this.logger.debug(`gear config: ${JSON.stringify(this._config, null, 2)}`);
    this.logger.debug(`routed: ` + JSON.stringify(this.routingService.route()));
  }

  startApi() {
    return this.api;
  }

  static get name() {
    return 'expressApi';
  }

}



