const JwtStrategy = require('passport-jwt').Strategy;
const BearerStrategy = require('passport-http-bearer');
const {ExtractJwt} = require('passport-jwt');

module.exports = (secret) => {
  const jwtOptions = {
    secretOrKey: new Buffer(secret, 'base64'),
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
    algorithms: ['HS512'],
    jsonWebTokenOptions: {algorithm: 'HS512'}
  };

  const jwt = async (payload, done) => {
    try {
      if (payload) {
        return done(null, payload);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  };

  return new JwtStrategy(jwtOptions, jwt);
}