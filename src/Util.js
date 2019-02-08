class FetchError extends Error {
  constructor(statusCode, statusText) {
    super(`${statusCode}${statusText}`);
    this.statusCode = statusCode;
    this.statusText = statusText;
    Error.captureStackTrace(this, FetchError);
  }
}

class CorsError extends Error {
}

class Util {
  static async fetch(url, init) {
    return fetch(url, init)
      .then((response) => {
        if (!response.ok) {
          throw new FetchError(response.status, response.statusText);
        }
        return response;
      });
  }

  static async fetchJson(url, init) {
    return Util.fetch(url, init).then(res => res.json());
  }

  static async fetchWithRetry(url, init, attempts) {
    return Util.fetch(url, init)
      .catch((error) => {
        if (error instanceof TypeError) { //probably CORS issue
          throw new CorsError(error.message);
        }
        if (attempts === 1) {
          throw error;
        }
        return Util.fetchWithRetry(url, init, attempts - 1);
      });
  }

  static async fetchJsonWithRetry(url, init, attempts) {
    return Util.fetchWithRetry(url, init, attempts).then(res => res.json());
  }

  static leftpad(string, paddingCharacter, desiredLength) {
    const numMissingCharacters = desiredLength - string.length;
    if (numMissingCharacters > 0) {
      return `${new Array(numMissingCharacters).fill(paddingCharacter).join('')}${string}`;
    } else {
      return string;
    }
  }

  static zeropad(number, desiredLength = 2) {
    return Util.leftpad(number.toString(10), '0', desiredLength);
  }
}

export {
  Util,
  FetchError,
  CorsError,
};
