function errorMiddleware(err, req, res, next) {
  console.error("Error:", err.message);

  const statusCode = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: message,
    detail: err.detail || null,
  });
}

export default errorMiddleware;