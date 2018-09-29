import React, { Component } from 'react';
import runtimeEnv from '@mars/heroku-js-runtime-env';
import { wrapGrid } from 'animate-css-grid';
import Helpers from './Helpers';
import Show from './components/Show';
import ProgressCircle from './components/ProgressCircle';
import AddShow from './components/AddShow';

import store from './redux/store';

const env = runtimeEnv();

class Shows extends Component {
  constructor(props) {
    super(props);
    const redux = store.getState();
    this.state = {
      redux,
      shows: null,
      progressPercent: 0,
      prevPct: 0,
      first: true,
    };
    const traktAuthHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': env.REACT_APP_TRAKT_CLIENT_ID,
      'Authorization': `Bearer ${redux.token.access_token}`,
    };

    let factor = 1;
    if (localStorage.getItem('imagesCached') !== null) {
      factor = 2;
    }

    const firstCap = 25 * factor;
    const firstTotal = 2;
    let firstN = 0;

    Promise.all(
      [
        Helpers.fetchJson('https://api.trakt.tv/users/hidden/progress_watched?type=show&limit=100', 'GET', null, traktAuthHeaders).then((a) => {
          firstN += 1;
          const pct = (firstN / firstTotal) * firstCap;
          this.setState(prevState => ({
            ...prevState,
            progressPercent: pct,
            prevPct: prevState.progressPercent,
          }));
          return a;
        }),
        Helpers.fetchJson('https://api.trakt.tv/users/me/watched/shows', 'GET', null, traktAuthHeaders).then((a) => {
          firstN += 1;
          const pct = (firstN / firstTotal) * firstCap;
          this.setState(prevState => ({
            ...prevState,
            progressPercent: pct,
            prevPct: prevState.progressPercent,
          }));
          return a;
        }),
      ],
    ).then((tuple) => {
      const hiddenShows = tuple[0].map(hidden => hidden.show.ids.tmdb);
      const watchedShows = tuple[1].filter(watched => !hiddenShows.includes(watched.show.ids.tmdb));

      const secondBase = 25 * factor;
      const secondCap = 50 * factor;
      const secondTotal = watchedShows.length;
      let secondN = 0;

      const showPromises = [];
      for (let i = 0; i < watchedShows.length; i++) {
        const watched = watchedShows[i];
        /* eslint-disable no-loop-func */
        const showPromise = Helpers.fetchJson(`https://api.trakt.tv/shows/${watched.show.ids.trakt}/progress/watched`, 'GET', null, traktAuthHeaders).then((a) => {
          secondN += 1;
          const pct = (secondN / secondTotal) * (secondCap - secondBase) + secondBase;
          this.setState(prevState => ({
            ...prevState,
            progressPercent: pct,
            prevPct: prevState.progressPercent,
          }));
          return a;
        });
        /* eslint-enable no-loop-func */
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
            seasons: show.seasons,
          };
        }).filter(show => show.aired !== show.completed);
        const delay = 250;
        // if (unwatchedShows.length <= 40) {
        //   delay = 100;
        // }

        const thirdBase = 50;
        const thirdCap = 100;
        const thirdTotal = unwatchedShows.length;
        const thirdN = 0;

        this.getImages(
          unwatchedShows.map(unwatched => unwatched.ids.tmdb),
          [],
          delay,
          thirdN,
          thirdCap,
          thirdTotal,
          thirdBase,
        )
          .then((imagePaths) => {
            const urls = imagePaths.map(url => `https://image.tmdb.org/t/p/w500${url}`);
            const zipped = unwatchedShows.map((show, index) => ({ ...show, imgUrl: urls[index] }));
            this.setState(prevState => ({ ...prevState, shows: [...zipped] }));
          });
      });
    });
  }

  componentDidUpdate() {
    const { shows, first } = this.state;
    if (first && shows !== null) {
      this.setState(prevState => ({ ...prevState, first: false }));
      wrapGrid(this.grid, {
        stagger: 100,
        duration: 500,
      });
    }
  }

  async getImages(movieDbIds, imageUrls, delay, n, cap, total, base) {
    if (movieDbIds.length === 0) {
      localStorage.setItem('imagesCached', JSON.stringify(true));
      return imageUrls;
    }
    const id = movieDbIds.shift();
    let url = '';
    let num = n;
    if (id !== null) {
      const exists = localStorage.getItem(id);
      if (exists !== null) {
        url = localStorage.getItem(id);
      } else {
        const imagesJson = await Helpers.fetchJson(`https://api.themoviedb.org/3/tv/${id}/images?api_key=${env.REACT_APP_THEMOVIEDB_APIKEY}`, 'GET');
        url = imagesJson.backdrops[0].file_path;
        localStorage.setItem(id, url);
      }
      num += 1;
      const pct = (num / total) * (cap - base) + base;
      if (localStorage.getItem('imagesCached') === null) {
        this.setState(prevState => ({
          ...prevState,
          progressPercent: pct,
          prevPct: prevState.progressPercent,
        }));
      }
      if (exists === null) {
        await Helpers.sleep(delay);
      }
    }
    return this.getImages(movieDbIds, [...imageUrls, url], delay, num, cap, total, base);
  }

  addShow(show) {
    this.setState(prevState => (
      {
        ...prevState,
        shows: [
          ...prevState.shows,
          show,
        ],
      }
    ));
  }

  render() {
    const { shows, progressPercent, prevPct } = this.state;
    if (shows !== null) {
      const showElements = shows.map(show => <Show key={show.ids.trakt} show={show} />);
      return (
        <div>
          <AddShow addShow={show => this.addShow(show)} />
          <div className="shows" ref={(el) => { (this.grid = el); }}>
            {showElements}
          </div>
        </div>
      );
    }
    return (
      <div className="center">
        <ProgressCircle percent={progressPercent} prevPct={prevPct} />
      </div>
    );
  }
}

export default Shows;
