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

export type TraktShow = {
  "title": string;
  "year": number;
  "ids": {
    "trakt": number;
    "slug": string;
    "tvdb": number;
    "imdb": string;
    "tmdb": number;
    "tvrage": null;
  };
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
  static getWatchlist(): Promise<WatchlistItem[]>;
  static getCurrentUser(): Promise<User>;
};

export type Genre = {
  name: string,
  slug: string
};
export const genres: Genre[];
export default Trakt;