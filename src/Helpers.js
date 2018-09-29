class Helpers {
  static async fetchJson(url, method, body, headers) {
    const options = {
      method,
      headers,
    };
    if (body !== null) {
      options.body = JSON.stringify(body);
    }
    return fetch(url, options).then(response => response.json())
      .catch(error => console.error(error));
  }

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default Helpers;
