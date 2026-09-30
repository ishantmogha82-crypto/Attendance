// Central error handler: logs full technical detail server-side, but only
// ever sends a friendly, non-leaky message to the client.
function notFound(req, res) {
  res.status(404).json({ error: "The requested resource was not found." });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error("[error]", err);

  if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
    return res.status(409).json({ error: "A record with these details already exists." });
  }

  const status = err.status || 500;
  const message =
    status === 500
      ? "Something went wrong on our end. Please try again."
      : err.message || "Request could not be processed.";

  res.status(status).json({ error: message });
}

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = { notFound, errorHandler, ApiError };
