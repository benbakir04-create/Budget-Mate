function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);

  const status = err.status || 500;
  const code = err.code || 'SERVER_ERROR';
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    error: { code, message, details: err.details || undefined }
  });
}

module.exports = errorHandler;


