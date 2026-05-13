import { errorResponse } from "../utils/apiResponse.js";

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  const details = err.details || null;
  const code = err.code || "INTERNAL_SERVER_ERROR";

  if (process.env.NODE_ENV !== "test") {
    console.error(err);
  }

  return errorResponse(res, statusCode, message, details, code);
};

export default errorHandler;
