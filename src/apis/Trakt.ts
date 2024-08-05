import { Util, CorsError } from '../Util';
import { StreamingLocation } from "./TraktorStreaming";
import { ZustandShowWithProgress } from '../zustand/ShowsProgressStore';
import tokenStore from '../zustand/TokenStore';

export type Token = {
  access_token: string;
  created_at: number;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
};

export type User = {
  "username": string;
  "private": boolean;
  "name": string;
  "vip": boolean;
  "vip_ep": boolean;
  "ids": {
    "slug": string;
  };
};

export type TraktIds = {
  "trakt": number;
  "slug": string;
  "tvdb": number;
  "imdb": string;
  "tmdb": number;
  "tvrage": null;
};

export type TraktShow = {
  "title": string;
  "year": number;
  "ids": TraktIds;
  "tagline": string;
  "overview": string;
  "first_aired": string;
  "airs": {
    "day": string;
    "time": string;
    "timezone": string;
  };
  "runtime": number;
  "certification": string;
  "country": string;
  "status": string;
  "rating": number;
  "votes": number;
  "comment_count": number;
  "trailer": string;
  "homepage": string;
  "network": string;
  "updated_at": string;
  "language": string;
  "languages": string[];
  "available_translations": string[];
  "genres": string[];
  "aired_episodes": number;
  "streaming_locations"?: StreamingLocation[];
};

export type EpisodeWithProgress = {
  "number": number;
  "completed": boolean;
  "last_watched_at": string;
};

export type SeasonWithProgress = {
  "number": number;
  "title": string | null;
  "aired": number;
  "completed": number;
  "episodes": EpisodeWithProgress[];
};

export type NextLastEpisode = {
  "season": number;
  "number": number;
  "title": string;
  "ids": TraktIds;
};

type ExtendedNextLastEpisode = NextLastEpisode & {
  "number_abs": number | null;
  "overview": string;
  "rating": number;
  "votes": number;
  "comment_count": number;
  "first_aired": string;
  "updated_at": string;
  "available_translations": string[];
  "runtime": number;
  "episode_type": string;
};

export type TraktShowWithProgress = {
  "aired": number;
  "completed": number;
  "last_watched_at": string;
  "reset_at": string | null;
  "seasons": SeasonWithProgress[];
  "hidden_seasons": any[];
  "next_episode": NextLastEpisode | null;
  "last_episode": NextLastEpisode | null;
  "streaming_locations"?: StreamingLocation[];
};

export type ExtendedTraktShowWithProgress = {
  "aired": number;
  "completed": number;
  "last_watched_at": string;
  "reset_at": string | null;
  "seasons": SeasonWithProgress[];
  "hidden_seasons": any[];
  "next_episode": ExtendedNextLastEpisode | null;
  "last_episode": ExtendedNextLastEpisode | null;
  "streaming_locations"?: StreamingLocation[];
};

export type getAllShowsProgressShow = {
  "plays": number;
  "last_watched_at": string;
  "last_updated_at": string;
  "reset_at": string;
  "show": {
    "title": string;
    "year": number;
    "ids": TraktIds;
  },
  "seasons": [
    {
      "number": number;
      "episodes": [
        {
          "number": number;
          "plays": number;
          "last_watched_at": string;
        },
      ]
    },
  ]
};

export type HiddenItem = {
  "hidden_at": string;
  "type": string;
  "show": {
    "title": string;
    "year": number;
    "ids": TraktIds;
  }
};

export type HiddenShowResponse = {
  "added": {
    "movies": number;
    "shows": number;
    "seasons": number;
    "users": number;
  },
  "not_found": {
    "movies": {
      "ids": TraktIds;
    }[];
    "shows": {
      "ids": TraktIds;
    }[];
    "seasons": {
      "ids": TraktIds;
    }[];
    "users": {
      "ids": TraktIds;
    }[];
  }
};

export type WatchlistItem = {
  "rank": number;
  "id": number;
  "listed_at": string;
  "notes": string;
  "type": string;
  "show": TraktShow;
};

export type HistoryEpisode = {
  "id": number;
  "watched_at": string;
  "action": string;
  "type": string;
  "episode": ExtendedNextLastEpisode;
  "show": TraktShow;
};

export type CalendarEpisode = {
  "first_aired": string;
  "episode": ExtendedNextLastEpisode;
  "show": TraktShow;
};

export type Genre = {
  name: string,
  slug: string
};

type TokenPayload = {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  refresh_token?: string;
  grant_type?: string;
  code?: string;
};

let getNewToken = false;
let onGoingTokenRequest: Promise<void | Token> | null = null;

class Trakt {
  static basicTokenPayload(): TokenPayload {
    return {
      client_id: import.meta.env.VITE_TRAKT_CLIENT_ID,
      client_secret: import.meta.env.VITE_TRAKT_CLIENT_SECRET,
      redirect_uri: `${window.location.origin}/redirect`,
    };
  }

  static async headers() {
    const token = await Trakt.token();
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': import.meta.env.VITE_TRAKT_CLIENT_ID,
      Authorization: `Bearer ${token?.access_token}`,
    };
  }

  static async token(): Promise<void | Token> {
    const tokenStoreState = tokenStore.getState();
    const token = JSON.stringify(tokenStoreState.token) === "{}" ? null : tokenStoreState.token;

    if (onGoingTokenRequest) {
      return onGoingTokenRequest;
    }
    if (getNewToken && token) {
      getNewToken = false;
      onGoingTokenRequest = Trakt.refreshToken(token).then((response) => {
        onGoingTokenRequest = null;
        return response;
      });
      const freshToken = await onGoingTokenRequest;
      if (!freshToken) { return; }
      localStorage.setItem('traktor_trakt_token', JSON.stringify(freshToken));
      tokenStoreState.setToken(freshToken);
      return freshToken;
    }

    if (token === null) {
      const localStorageToken: Token | null = JSON.parse(
        localStorage.getItem('traktor_trakt_token') || "null"
      );
      if (localStorageToken === null) {
        throw Error('Not authenticated');
      }

      const freshToken = await Trakt.refreshTokenIfNecessary(localStorageToken);

      if (!freshToken) {
        throw Error('Not authenticated');
      }
      if (freshToken?.created_at !== localStorageToken.created_at) {
        localStorage.setItem('traktor_trakt_token', JSON.stringify(freshToken));
      }
      tokenStoreState.setToken(freshToken);
      return freshToken;
    }

    const freshToken = await Trakt.refreshTokenIfNecessary(token);
    if (!freshToken) {
      throw Error('Not authenticated');
    }

    if (freshToken?.created_at !== token.created_at) {
      tokenStoreState.setToken(freshToken);
      localStorage.setItem('traktor_trakt_token', JSON.stringify(freshToken));
    }
    return freshToken;
  }

  static async getTokenFromCode(code: string) {
    return Trakt.postToTokenEndpoint({
      ...Trakt.basicTokenPayload(),
      code,
      grant_type: 'authorization_code',
    });
  }

  static async postToTokenEndpoint(payload: TokenPayload): Promise<Token> {
    return Util.fetchJson('https://api.trakt.tv/oauth/token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  static async refreshToken(token: Token): Promise<void | Token> {
    return Trakt.postToTokenEndpoint({
      ...Trakt.basicTokenPayload(),
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    }).catch(() => {
      localStorage.removeItem('traktor_trakt_token');
      window.location.reload();
    });
  }

  static async refreshTokenIfNecessary(token: Token): Promise<void | Token> {
    const expirationDate = (token.created_at + token.expires_in) * 1000;
    const aDay = 1000 * 60 * 60 * 24;

    if (new Date() > new Date(expirationDate - aDay)) {
      return Trakt.refreshToken(token);
    }

    return token;
  }

  static async get(url: RequestInfo | URL): Promise<any> {
    const init: RequestInit = {
      method: 'GET',
      headers: await Trakt.headers(),
      cache: 'no-store',
    };

    return Util.fetchJsonWithRetry(url, init, 3).catch((error) => {
      if (error instanceof CorsError) {
        getNewToken = true;
        return Trakt.get(url);
      }
      throw error;
    });
  }

  static async getCurrentUser(): Promise<User> {
    return Trakt.get(
      `https://api.trakt.tv/users/me`
    );
  }

  static async getEpisode(showId: number, season: number, episode: number) {
    return Trakt.get(
      `https://api.trakt.tv/shows/${showId}/seasons/${season}/episodes/${episode}`
    );
  }

  static async getHiddenShows(): Promise<HiddenItem[]> {
    return Trakt.get(
      'https://api.trakt.tv/users/hidden/progress_watched?type=show&limit=100'
    );
  }

  static async getHistoryDaysBack(days: number): Promise<HistoryEpisode[]> {
    const toDate = new Date();
    const fromDate = new Date(new Date().setDate(toDate.getDate() - days));
    return Trakt.getHistory(fromDate, toDate);
  }

  static async getHistory(fromDate: Date, toDate: Date): Promise<HistoryEpisode[]> {
    const from = fromDate.toISOString();
    const to = toDate.toISOString();
    return Trakt.get(
      `https://api.trakt.tv/users/me/history/shows?start_at=${from}&end_at=${to}&limit=500&extended=full`
    );
  }

  static async getCalendarDaysBack(days: number): Promise<CalendarEpisode[]> {
    const fromDate = new Date(new Date().setDate(new Date().getDate() - days));
    return Trakt.getCalendar(fromDate, days);
  }

  static async getCalendar(fromDate: Date, days: number): Promise<CalendarEpisode[]> {
    const from = fromDate.toISOString().slice(0, 10);
    return Trakt.get(`https://api.trakt.tv/calendars/my/shows/${from}/${days}?extended=full`);
  }

  static async getRatings() {
    return Trakt.get('https://api.trakt.tv/users/me/ratings/shows');
  }

  static async getResetShows() {
    return Trakt.get(
      'https://api.trakt.tv/users/hidden/progress_watched_reset?type=show&limit=100'
    );
  }

  static async getShowsProgress(): Promise<getAllShowsProgressShow[]> {
    return Trakt.get('https://api.trakt.tv/users/me/watched/shows');
  }

  static async getShowProgress(id: number): Promise<TraktShowWithProgress> {
    return Trakt.get(`https://api.trakt.tv/shows/${id}/progress/watched`);
  }

  static async getShowProgressExtended(id: number): Promise<ExtendedTraktShowWithProgress> {
    return Trakt.get(
      `https://api.trakt.tv/shows/${id}/progress/watched?extended=full`
    );
  }

  static async getWatchlist(): Promise<WatchlistItem[]> {
    return Trakt.get('https://api.trakt.tv/users/me/watchlist/shows/added?extended=full');
  }

  static async markEpisodeWatched(ids: TraktIds) {
    const watched = {
      episodes: [
        {
          watched_at: new Date().toISOString(),
          ids,
        },
      ],
    };

    return Util.fetchJsonWithRetry(
      'https://api.trakt.tv/sync/history',
      {
        method: 'POST',
        body: JSON.stringify(watched),
        headers: await Trakt.headers(),
      },
      3
    );
  }

  static async hideShow(ids: TraktIds): Promise<HiddenShowResponse> {
    const payload = {
      shows: [
        {
          ids,
        },
      ],
    };

    return Util.fetchJsonWithRetry(
      'https://api.trakt.tv/users/hidden/progress_watched',
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: await Trakt.headers(),
      },
      3
    );
  }

  static async search(query: string, limit = 9, page = 1) {
    return Trakt.get(
      `https://api.trakt.tv/search/show?query=${query}&limit=${limit}&page=${page}`
    );
  }

  static countWatchedSinceReset(show: ZustandShowWithProgress | TraktShowWithProgress): number {
    const resetAt = this.showResetAt(show);
    return show.seasons
      .filter((season) => season.number !== 0)
      .map((season: SeasonWithProgress) =>
        season.episodes
          .map((episode) =>
            Date.parse(episode.last_watched_at) > resetAt ? 1 : 0
          )
          .reduce((a: number, b: number) => a + b, 0)
      )
      .reduce((a: number, b: number) => a + b, 0);
  }

  static async nextEpisodeForRewatch(show: ZustandShowWithProgress) {
    const resetAt = this.showResetAt(show);
    const episodes = show.seasons
      .filter((season) => season.number !== 0)
      .flatMap((season: SeasonWithProgress) =>
        season.episodes.map((ep) => ({ ...ep, season: season.number }))
      );

    const lastWatched = episodes
      .map((ep, index) => ({ ...ep, index }))
      .filter(
        (episode) =>
          episode.last_watched_at &&
          Date.parse(episode.last_watched_at) > resetAt
      )
      .sort((a, b) => {
        const aDate = Date.parse(a.last_watched_at);
        const bDate = Date.parse(b.last_watched_at);
        if (aDate !== bDate) {
          return bDate - aDate;
        } else if (a.season !== b.season) {
          return b.season - a.season;
        } else {
          return b.number - a.number;
        }
      })[0];
    if (!lastWatched) {
      return Trakt.getEpisode(show.ids.trakt, 1, 1);
    }
    for (let i = lastWatched?.index || 0; i < episodes.length; i++) {
      if (!episodes[i].last_watched_at || Date.parse(episodes[i].last_watched_at) <= resetAt) {
        return Trakt.getEpisode(
          show.ids.trakt,
          episodes[i].season,
          episodes[i].number
        );
      }
    }

    if (Trakt.countWatchedSinceReset(show) < show.aired) {
      const firstUnwatched = episodes
        .map((ep, index) => ({ ...ep, index }))
        .filter(
          (episode) =>
            !episode.last_watched_at ||
            Date.parse(episode.last_watched_at) <= resetAt
        )[0];
      return Trakt.getEpisode(
        show.ids.trakt,
        firstUnwatched.season,
        firstUnwatched.number
      );
    }

    return Promise.resolve(null);
  }

  static showResetAt(show: ZustandShowWithProgress | TraktShowWithProgress | getAllShowsProgressShow) {
    if (!show.reset_at) {
      return new Date(0).getTime();
    } else if (typeof show.reset_at === 'number') {
      return show.reset_at;
    } else if (typeof show.reset_at === 'string') {
      return Date.parse(show.reset_at);
      // } else if (show.reset_at instanceof Date) {
      //   return show.reset_at.getTime();
    } else {
      throw new Error('wtf did you just pass to showResetAt?');
    }
  }
}

export const genres: Genre[] = [
  {
    "name": "Action",
    "slug": "action"
  },
  {
    "name": "Adventure",
    "slug": "adventure"
  },
  {
    "name": "Animation",
    "slug": "animation"
  },
  {
    "name": "Anime",
    "slug": "anime"
  },
  {
    "name": "Biography",
    "slug": "biography"
  },
  {
    "name": "Children",
    "slug": "children"
  },
  {
    "name": "Comedy",
    "slug": "comedy"
  },
  {
    "name": "Crime",
    "slug": "crime"
  },
  {
    "name": "Documentary",
    "slug": "documentary"
  },
  {
    "name": "Donghua",
    "slug": "donghua"
  },
  {
    "name": "Drama",
    "slug": "drama"
  },
  {
    "name": "Family",
    "slug": "family"
  },
  {
    "name": "Fantasy",
    "slug": "fantasy"
  },
  {
    "name": "Game Show",
    "slug": "game-show"
  },
  {
    "name": "History",
    "slug": "history"
  },
  {
    "name": "Holiday",
    "slug": "holiday"
  },
  {
    "name": "Home And Garden",
    "slug": "home-and-garden"
  },
  {
    "name": "Horror",
    "slug": "horror"
  },
  {
    "name": "Mini Series",
    "slug": "mini-series"
  },
  {
    "name": "Music",
    "slug": "music"
  },
  {
    "name": "Musical",
    "slug": "musical"
  },
  {
    "name": "Mystery",
    "slug": "mystery"
  },
  {
    "name": "News",
    "slug": "news"
  },
  {
    "name": "None",
    "slug": "none"
  },
  {
    "name": "Reality",
    "slug": "reality"
  },
  {
    "name": "Romance",
    "slug": "romance"
  },
  {
    "name": "Science Fiction",
    "slug": "science-fiction"
  },
  {
    "name": "Short",
    "slug": "short"
  },
  {
    "name": "Soap",
    "slug": "soap"
  },
  {
    "name": "Special Interest",
    "slug": "special-interest"
  },
  {
    "name": "Sporting Event",
    "slug": "sporting-event"
  },
  {
    "name": "Superhero",
    "slug": "superhero"
  },
  {
    "name": "Suspense",
    "slug": "suspense"
  },
  {
    "name": "Talk Show",
    "slug": "talk-show"
  },
  {
    "name": "Thriller",
    "slug": "thriller"
  },
  {
    "name": "War",
    "slug": "war"
  },
  {
    "name": "Western",
    "slug": "western"
  }
];

export default Trakt;
