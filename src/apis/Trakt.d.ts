import { StreamingLocation } from "./TraktorStreaming";

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

export type TraktShowWithProgress = {
  "aired": number;
  "completed": number;
  "last_watched_at": string;
  "reset_at": string | null;
  "seasons": SeasonWithProgress[];
  "hidden_seasons": any[];
  "next_episode": NextLastEpisode | null;
  "last_episode": NextLastEpisode | null;
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

export type WatchlistItem = {
  "rank": number;
  "id": number;
  "listed_at": string;
  "notes": string;
  "type": string;
  "show": TraktShow;
};

declare class Trakt {
  static token(): Promise<Token>;

  static getCurrentUser(): Promise<User>;
  static getHiddenShows(): Promise<HiddenItem[]>;
  static getShowProgress(id: number): Promise<TraktShowWithProgress>;
  static getShows(): Promise<getAllShowsProgressShow[]>;
  static getWatchlist(): Promise<WatchlistItem[]>;

  static countWatchedSinceReset(show: ShowWithProgress): number;
  static showResetAt(show: ShowWithProgress): number;
};

export type Genre = {
  name: string,
  slug: string
};
export const genres: Genre[];
export default Trakt;