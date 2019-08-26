class FetchError extends Error {
  constructor(statusCode, statusText) {
    super(`${statusCode}${statusText}`);
    this.statusCode = statusCode;
    this.statusText = statusText;
    Error.captureStackTrace(this, FetchError);
  }
}

export default FetchError;
