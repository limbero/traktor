class Util {
  static async fetch(url, init) {
    return fetch(url, init)
      .then((response) => {
        if (!response.ok) {
          throw Error(response.statusText);
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
        if (attempts === 1) {
          throw error;
        }
        return Util.fetchWithRetry(url, init, attempts - 1);
      });
  }

  static async fetchJsonWithRetry(url, init, attempts) {
    return Util.fetchWithRetry(url, init, attempts).then(res => res.json());
  }
}

export default Util;
