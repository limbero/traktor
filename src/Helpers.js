class Helpers {
  static async fetchJson(url, method, body, headers) {
    const options = {
      method: method,
      headers: headers
    };
    if (body !== null) {
      options.body = JSON.stringify(body);
    }
    return fetch(url, options).then(response => response.json())
    .catch(error => console.error(error));
  }
}

export default Helpers;
