class TheMovieDb {
  static async get(url) {
    const urlWithApiKey = `${url + (url.includes('?') ? '&' : '?')}api_key=${
      import.meta.env.VITE_THEMOVIEDB_APIKEY
    }`;

    return fetch(urlWithApiKey).then((response) => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    });
  }

  static async getImage(id) {
    if (id === null) {
      return '/testbild.jpg';
    }
    const cached = localStorage.getItem(id);
    if (cached && cached.startsWith('https://')) {
      return cached;
    }

    return TheMovieDb.get(`https://api.themoviedb.org/3/tv/${id}/images`)
      .then((response) => {
        const imageUrl = `https://image.tmdb.org/t/p/w500${response.backdrops[0].file_path}`;
        localStorage.setItem(id, imageUrl);
        return imageUrl;
      })
      .catch(() => '/testbild.jpg');
  }
}

export default TheMovieDb;
