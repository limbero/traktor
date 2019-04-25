import runtimeEnv from '@mars/heroku-js-runtime-env';
import store from '../redux/store';
import { setToken } from '../redux/actions';
import { Util, CorsError }  from '../Util';

const env = runtimeEnv();
let getNewToken = false;
let onGoingTokenRequest = null;

class Trakt {
  static basicTokenPayload() {
    return {
      client_id: env.REACT_APP_TRAKT_CLIENT_ID,
      client_secret: env.REACT_APP_TRAKT_CLIENT_SECRET,
      redirect_uri: `${window.location.origin}/redirect`,
    };
  }

  static async headers() {
    const token = await Trakt.token();
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': env.REACT_APP_TRAKT_CLIENT_ID,
      'Authorization': `Bearer ${token.access_token}`,
    };
  }

  static async token() {
    const { token } = store.getState();

    if (onGoingTokenRequest) {
      return onGoingTokenRequest;
    }
    if (getNewToken) {
      getNewToken = false;
      onGoingTokenRequest = Trakt.refreshToken(token)
        .then((response) => {
          onGoingTokenRequest = null;
          return response;
        });
      const freshToken = await onGoingTokenRequest;
      localStorage.setItem('traktor_trakt_token', JSON.stringify(freshToken));
      store.dispatch(setToken(freshToken));
      return freshToken;
    }

    if (token === null) {
      const localStorageToken = JSON.parse(localStorage.getItem('traktor_trakt_token'));
      if (localStorageToken === null) {
        console.log('both are null');
        throw Error('Not authenticated');
      }

      const freshToken = await Trakt.refreshTokenIfNecessary(localStorageToken);
      if (freshToken.created_at !== localStorageToken.created_at) {
        localStorage.setItem('traktor_trakt_token', JSON.stringify(freshToken));
      }
      store.dispatch(setToken(freshToken));
      return freshToken;
    }

    const freshToken = await Trakt.refreshTokenIfNecessary(token);

    if (freshToken.created_at !== token.created_at) {
      store.dispatch(setToken(freshToken));
      localStorage.setItem('traktor_trakt_token', JSON.stringify(freshToken));
    }
    return freshToken;
  }

  static async getTokenFromCode(code) {
    return Trakt.postToTokenEndpoint({
      ...Trakt.basicTokenPayload(),
      code,
      grant_type: 'authorization_code',
    });
  }

  static async postToTokenEndpoint(payload) {
    return Util.fetchJson('https://api.trakt.tv/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  static async refreshToken(token) {
    return Trakt.postToTokenEndpoint({
      ...Trakt.basicTokenPayload(),
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    }).catch(() => {
      localStorage.removeItem('traktor_trakt_token');
      window.location.reload();
    });
  }

  static async refreshTokenIfNecessary(token) {
    const expirationDate = (token.created_at + token.expires_in) * 1000;
    const aDay = 1000 * 60 * 60 * 24;

    if (new Date() > new Date(expirationDate - aDay)) {
      return Trakt.refreshToken(token);
    }

    return token;
  }

  static async get(url) {
    const init = {
      method: 'GET',
      headers: await Trakt.headers(),
      cache: 'no-store',
    };

    return Util.fetchJsonWithRetry(url, init, 3)
      .catch((error) => {
        if (error instanceof CorsError) {
          getNewToken = true;
          return Trakt.get(url);
        }
        throw error;
      });
  }

  static async getHiddenShows() {
    return Trakt.get('https://api.trakt.tv/users/hidden/progress_watched?type=show&limit=100');
  }

  static async getRatings() {
    return Trakt.get('https://api.trakt.tv/users/me/ratings/shows');
  }

  static async getShows() {
    return Trakt.get('https://api.trakt.tv/users/me/watched/shows?extended=full');
  }

  static async getShowProgress(id) {
    return Trakt.get(`https://api.trakt.tv/shows/${id}/progress/watched`);
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

    return Util.fetchJsonWithRetry('https://api.trakt.tv/sync/history', {
      method: 'POST',
      body: JSON.stringify(watched),
      headers: await Trakt.headers(),
    }, 3);
  }

  static async search(query, limit = 9, page = 1) {
    return Trakt.get(`https://api.trakt.tv/search/show?query=${query}&limit=${limit}&page=${page}`);
  }
}

export default Trakt;
