/** A moddleware to ignore the browsers' favicon requests. */
module.exports = (req, res, next) => {
  if (req.originalUrl === '/favicon.ico') {
    res.status(204).json({ nope: true });
  } else {
    next();
  }
};
