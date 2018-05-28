import React, { Component } from 'react';
import runtimeEnv from '@mars/heroku-js-runtime-env';
import Helpers from './Helpers';
import Show from './components/Show.jsx';
import ProgressCircle from './components/ProgressCircle.jsx';

import store from "./store/index";

const env = runtimeEnv();

class Shows extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redux: store.getState(),
      shows: null,
      progressPercent: 0,
      prevPct: 0
    };
    const traktAuthHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': env.REACT_APP_TRAKT_CLIENT_ID,
      'Authorization': `Bearer ${this.state.redux.token.access_token}`
    };

    const firstCap = 25;
    const firstTotal = 2;
    let firstN = 0;

    Promise.all(
      [
        Helpers.fetchJson('https://api.trakt.tv/users/hidden/progress_watched?type=show&limit=100', 'GET', null, traktAuthHeaders).then((a)=> {
          const pct = (++firstN / firstTotal) * firstCap;
          this.setState((prevState) => {
            return {
              ...prevState,
              progressPercent: pct,
              prevPct: prevState.progressPercent
            };
          });
          return a;
        }),
        Helpers.fetchJson('https://api.trakt.tv/users/me/watched/shows', 'GET', null, traktAuthHeaders).then((a)=> {
          const pct = (++firstN / firstTotal) * firstCap;
          this.setState((prevState) => {
            return {
              ...prevState,
              progressPercent: pct,
              prevPct: prevState.progressPercent
            };
          });
          return a;
        })
      ]
    ).then((tuple) => {
      let [hiddenShows, watchedShows] = tuple;
      hiddenShows = hiddenShows.map((hidden) => hidden.show.ids.tmdb)
      watchedShows = watchedShows.filter((watched) => !hiddenShows.includes(watched.show.ids.tmdb));

      const secondBase = 25;
      const secondCap = 50;
      const secondTotal = watchedShows.length;
      let secondN = 0;

      const showPromises = [];
      for (let i = 0; i < watchedShows.length; i++) {
        const watched = watchedShows[i];
        const showPromise = Helpers.fetchJson(`https://api.trakt.tv/shows/${watched.show.ids.trakt}/progress/watched`, 'GET', null, traktAuthHeaders).then((a)=> {
          const pct = (++secondN / secondTotal) * (secondCap - secondBase) + secondBase;
          this.setState((prevState) => {
            return {
              ...prevState,
              progressPercent: pct,
              prevPct: prevState.progressPercent
            };
          });
          return a;
        });
        showPromises.push(showPromise);
      }
      Promise.all(showPromises).then((allShows) => {
        const unwatchedShows = allShows.map((show, index) => {
          const watched = watchedShows[index];
          return {
            title: watched.show.title,
            ids: watched.show.ids,
            aired: show.aired,
            completed: show.completed,
            last_episode: show.last_episode,
            last_watched_at: show.last_watched_at,
            next_episode: show.next_episode,
            seasons: show.seasons
          };
        }).filter((show) => show.aired !== show.completed);
        let delay = 250;
        // if (unwatchedShows.length <= 40) {
        //   delay = 100;
        // }

        const thirdBase = 50;
        const thirdCap = 100;
        const thirdTotal = unwatchedShows.length;
        let thirdN = 0;

        this.getImages(unwatchedShows.map((unwatched) => unwatched.ids.tmdb), [], delay, thirdN, thirdCap, thirdTotal, thirdBase).then((imagePaths) => {
          const urls = imagePaths.map((url) => `https://image.tmdb.org/t/p/w500${url}`);
          const zipped = unwatchedShows.map((show, index) => {
            return { ...show, imgUrl: urls[index] };
          });
          this.setState((prevState) => {
            return { ...prevState, shows: zipped };
          });
        });
      });
    });
  }

  async getImages(movieDbIds, imageUrls, delay, n, cap, total, base) {
    if (movieDbIds.length === 0) {
      return imageUrls;
    }
    const id = movieDbIds.shift();
    let url = '';
    if (id !== null) {
      const exists = localStorage.getItem(id);
      if (exists !== null) {
        url = localStorage.getItem(id);
      } else {
        const imagesJson = await Helpers.fetchJson(`https://api.themoviedb.org/3/tv/${id}/images?api_key=${env.REACT_APP_THEMOVIEDB_APIKEY}`, 'GET');
        url = imagesJson.backdrops[0].file_path;
        localStorage.setItem(id, url);
      }
      const pct = (++n / total) * (cap - base) + base;
      this.setState((prevState) => {
        return {
          ...prevState,
          progressPercent: pct,
          prevPct: prevState.progressPercent
        };
      });
      if (exists === null) {
        await Helpers.sleep(delay);
      }
    }
    return this.getImages(movieDbIds, [...imageUrls, url], delay, n, cap, total, base);
  }

  render() {
    let shows = [];
    if (this.state.shows !== null) {
      shows = this.state.shows.map((show, index) => <Show key={index} show={show} />);
      return (
        <div className="shows">
          {shows}
        </div>
      );
    } else {
      return (
        <div>
          <ProgressCircle percent={this.state.progressPercent} prevPct={this.state.prevPct} />
        </div>
      );
    }
  }
}

export default Shows;
