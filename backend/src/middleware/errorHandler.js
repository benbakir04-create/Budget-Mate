function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);

  const status = err.status || 500;
  // Unexpected errors (e.g. Prisma) are logged above but never sent to the client.
  const isServerError = status >= 500;

  res.status(status).json({
    success: false,
    error: isServerError
      ? { code: 'SERVER_ERROR', message: 'Internal server error' }
      : { code: err.code || 'ERROR', message: err.message, details: err.details || undefined },
  });
}

module.exports = errorHandler;
