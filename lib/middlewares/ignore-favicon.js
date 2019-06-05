/** A moddleware to ignore the browsers' favicon requests. */
module.exports = (req, res, next) => {
  if (req.originalUrl === '/favicon.ico') {
    console.log('ignoring favicon request');
    res.status(204).json({ nope: true });
  } else {
    console.log('ignoreFavicon: nothing to ignore');
    next();
  }
};
