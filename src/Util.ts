import CorsError from './errors/CorsError';
import FetchError from './errors/FetchError';

class Util {
  static async fetch(url: RequestInfo | URL, init: RequestInit | undefined): Promise<Response> {
    return fetch(url, init).then((response) => {
      if (!response.ok) {
        return Promise.reject(
          new FetchError(response.status, response.statusText)
        );
      }
      return response;
    });
  }

  static async fetchJson(url: RequestInfo | URL, init: RequestInit | undefined): Promise<any> {
    return Util.fetch(url, init).then((res) => res.json());
  }

  static async fetchWithRetry(url: RequestInfo | URL, init: RequestInit | undefined, attempts: number): Promise<Response> {
    return Util.fetch(url, init).catch((error) => {
      if (error instanceof TypeError) {
        // probably CORS issue
        throw new CorsError(error.message);
      }
      if (attempts === 1) {
        throw error;
      }
      return Util.fetchWithRetry(url, init, attempts - 1);
    });
  }

  static async fetchJsonWithRetry(url: RequestInfo | URL, init: RequestInit | undefined, attempts: number): Promise<any> {
    return Util.fetchWithRetry(url, init, attempts).then((res) => res.json());
  }

  static leftpad(string: string, paddingCharacter: string, desiredLength: number) {
    const numMissingCharacters = desiredLength - string.length;
    if (numMissingCharacters > 0) {
      return `${new Array(numMissingCharacters)
        .fill(paddingCharacter)
        .join('')}${string}`;
    } else {
      return string;
    }
  }

  static zeropad(number: number, desiredLength = 2) {
    return Util.leftpad(number.toString(10), '0', desiredLength);
  }
}

export { Util, FetchError, CorsError };
