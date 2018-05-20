import React, { Component } from 'react';
import runtimeEnv from '@mars/heroku-js-runtime-env';
import Helpers from './Helpers';
import Show from './Show.jsx';

import store from "./store/index";

const env = runtimeEnv();

class Shows extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redux: store.getState(),
      shows: null
    };
    const traktAuthHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': env.REACT_APP_TRAKT_CLIENT_ID,
      'Authorization': `Bearer ${this.state.redux.token.access_token}`
    };

    Promise.all([Helpers.fetchJson('https://api.trakt.tv/users/hidden/progress_watched?type=show&limit=100', 'GET', null, traktAuthHeaders), Helpers.fetchJson('https://api.trakt.tv/users/me/watched/shows', 'GET', null, traktAuthHeaders)]).then((tuple) => {
      let [hiddenShows, watchedShows] = tuple;
      hiddenShows = hiddenShows.map((hidden) => hidden.show.ids.tmdb)
      watchedShows = watchedShows.filter((watched) => !hiddenShows.includes(watched.show.ids.tmdb));
      const showPromises = [];
      for (let i = 0; i < watchedShows.length; i++) {
        const watched = watchedShows[i];
        const showPromise = Helpers.fetchJson(`https://api.trakt.tv/shows/${watched.show.ids.trakt}/progress/watched`, 'GET', null, {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'trakt-api-version': '2',
          'trakt-api-key': env.REACT_APP_TRAKT_CLIENT_ID,
          'Authorization': `Bearer ${this.state.redux.token.access_token}`
        });
        showPromises.push(showPromise);
      }
      Promise.all(showPromises).then((shows) => {
        this.getImages(watchedShows.map((watched) => watched.show.ids.tmdb), []).then((imagePaths) => {
          const urls = imagePaths.map((url) => `https://image.tmdb.org/t/p/w500${url}`);
          const zipped = shows.map((show, index) => {
            const watched = watchedShows[index];
            const imgUrl = urls[index];
            return {
              title: watched.show.title,
              ids: watched.show.ids,
              aired: show.aired,
              completed: show.completed,
              last_episode: show.last_episode,
              last_watched_at: show.last_watched_at,
              next_episode: show.next_episode,
              seasons: show.seasons,
              imgUrl: imgUrl
            };
          });
          console.log(zipped);
          this.setState((prevState) => {
            return { ...prevState, shows: zipped };
          });
        });
      });
    });
  }

  async getImages(movieDbIds, imageUrls) {
    if (movieDbIds.length === 0) {
      return imageUrls;
    }
    const id = movieDbIds.shift();
    let url = '';
    if (id !== null) {
      if (localStorage.getItem(id) !== null) {
        url = localStorage.getItem(id);
      } else {
        const imagesJson = await Helpers.fetchJson(`https://api.themoviedb.org/3/tv/${id}/images?api_key=${env.REACT_APP_THEMOVIEDB_APIKEY}`, 'GET');
        url = imagesJson.backdrops[0].file_path;
        localStorage.setItem(id, url);
  
        await this.sleep(250);
      }
    }
    return this.getImages(movieDbIds, [...imageUrls, url]);
  }
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  render() {
    let shows = [];
    if (this.state.shows !== null) {
      shows = this.state.shows.filter((show) => show.completed !== show.aired).map((show, index) => <Show key={index} show={show} />);
      return (
        <div className="shows">
          {shows}
        </div>
      );
    } else {
      return (
        <div>
          Sucking in data!
        </div>
      );
    }
  }
}

export default Shows;
