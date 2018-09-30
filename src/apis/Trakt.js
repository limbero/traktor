import runtimeEnv from '@mars/heroku-js-runtime-env';
import store from '../redux/store';

const env = runtimeEnv();

class Trakt {
  static basicTokenPayload() {
    return {
      client_id: env.REACT_APP_TRAKT_CLIENT_ID,
      client_secret: env.REACT_APP_TRAKT_CLIENT_SECRET,
      redirect_uri: `${window.location.origin}/redirect`,
    };
  }

  static headers() {
    const { token } = store.getState();
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': env.REACT_APP_TRAKT_CLIENT_ID,
      'Authorization': `Bearer ${token.access_token}`,
    };
  }

  static async get(url) {
    const init = {
      method: 'GET',
      headers: Trakt.headers(),
      cache: 'no-store',
    };

    return fetch(url, init)
      .then((response) => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response.json();
      });
  }

  static async getHiddenShows() {
    return Trakt.get('https://api.trakt.tv/users/hidden/progress_watched?type=show&limit=100');
  }

  static async getShows() {
    return Trakt.get('https://api.trakt.tv/users/me/watched/shows');
  }

  static async getShowProgress(id) {
    return Trakt.get(`https://api.trakt.tv/shows/${id}/progress/watched`);
  }

  static async getTokenFromCode(code) {
    return Trakt.postToTokenEndpoint({
      ...Trakt.basicTokenPayload(),
      code,
      grant_type: 'authorization_code',
    });
  }

  static async postToTokenEndpoint(payload) {
    return fetch('https://api.trakt.tv/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).then((response) => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    });
  }

  static async refreshToken() {
    const { token } = store.getState();

    return Trakt.postToTokenEndpoint({
      ...Trakt.basicTokenPayload(),
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    });
  }

  static async markEpisodeWatched(ids) {
    const watched = {
      episodes: [
        {
          watched_at: new Date().toISOString(),
          ids,
        },
      ],
    };

    return fetch('https://api.trakt.tv/sync/history', {
      method: 'POST',
      body: JSON.stringify(watched),
      headers: Trakt.headers(),
    }).then((response) => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    });
  }

  static async search(query, limit = 9, page = 1) {
    return Trakt.get(`https://api.trakt.tv/search/show?query=${query}&limit=${limit}&page=${page}`);
  }
}

export default Trakt;
