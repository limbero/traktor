import React, { Component } from 'react';
import { wrapGrid } from 'animate-css-grid';
import Trakt from '../apis/Trakt';
import Show from './Show';
import ProgressCircle from './ProgressCircle';
import AddShow from './AddShow';
import Statistics from './Statistics';

let first = true;

class Shows extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shows: [],
      loading: true,
      prevPercent: 0,
      percent: 0,
      hiddenShows: [],
      apiWatchedShows: [],
    };
    this.setup();
  }

  componentDidUpdate() {
    const { loading } = this.state;
    if (!loading && first) {
      first = false;
      wrapGrid(this.grid, {
        stagger: 0,
        duration: 400,
        easing: 'backOut',
        onEnd: () => {
          document.querySelector('.shows').children[0].children[0].classList.add('visible');
        },
      });
    }
  }

  async setup() {
    const [apiHiddenShows, apiWatchedShows, apiRatings, user] = await Promise.all([
      this.trackForLoading(Trakt.getHiddenShows(), 3),
      this.trackForLoading(Trakt.getShows(), 20),
      this.trackForLoading(Trakt.getRatings(), 5),
      Trakt.getCurrentUser(),
    ]);

    const hiddenShows = apiHiddenShows.map((hidden) => hidden.show.ids.trakt);
    this.setState((prevState) => ({
      ...prevState,
      hiddenShows,
      user,
      apiWatchedShows: apiWatchedShows.map(
        (watchedShow) => watchedShow.show.ids.trakt
      ),
    }));

    const watchedShows = apiWatchedShows
      .filter(
        (watchedShow) => !hiddenShows.includes(watchedShow.show.ids.trakt)
      );

    const ratedShowMap = {};
    apiRatings.forEach((ratedShow) => {
      ratedShowMap[ratedShow.show.ids.trakt] = ratedShow.rating;
    });

    const allShows = await Promise.all(
      watchedShows.map((watched) =>
        this.trackForLoading(
          Trakt.getShowProgress(watched.show.ids.trakt),
          70 / watchedShows.length
        )
      )
    );
    const showPromises = await Promise.all(
      allShows
        .map((show, index) => {
          const watched = watchedShows[index];
          return {
            addedFromSearch: false,
            title: watched.show.title,
            ids: watched.show.ids,
            aired: show.aired,
            completed: Trakt.countWatchedSinceReset(show),
            last_watched_at: watched.last_watched_at,
            reset_at: Trakt.showResetAt(watched),
            seasons: show.seasons,
            rating: ratedShowMap[watched.show.ids.trakt],
          };
        })
        .filter((show) => show.completed !== show.aired)
    );
    const shows = showPromises
      .filter((show) => show.aired > show.completed)
      .sort((a, b) => {
        if (a.rating > b.rating) {
          return -1;
        } else if (a.rating < b.rating) {
          return 1;
        } else if (a.last_watched_at > b.last_watched_at) {
          return -1;
        } else if (a.last_watched_at < b.last_watched_at) {
          return 1;
        } else {
          return 0;
        }
      });

    this.setState((prevState) => ({
      ...prevState,
      shows,
      loading: false,
    }));
  }

  addShow(show) {
    this.setState((prevState) => ({
      ...prevState,
      shows: [show, ...prevState.shows],
    }));
  }

  increaseLoading(percent) {
    this.setState((prevState) => ({
      ...prevState,
      prevPercent: prevState.percent,
      percent: prevState.percent + percent,
    }));
  }

  trackForLoading(promise, worth) {
    return promise.then((result) => {
      this.increaseLoading(worth);
      return result;
    });
  }

  render() {
    const {
      apiWatchedShows,
      hiddenShows,
      shows,
      loading,
      prevPercent,
      percent,
      user,
    } = this.state;
    const { hasHover } = this.props;

    const showIds = shows.map((show) => show.ids.trakt);

    if (loading) {
      return (
        <div className="center">
          <ProgressCircle percent={percent} prevPercent={prevPercent} />
        </div>
      );
    }
    return (
      <div>
        <div className="center">
          <AddShow addShow={(show) => this.addShow(show)} showIds={showIds} />
        </div>
        <div
          className="shows"
          ref={(el) => {
            this.grid = el;
          }}
        >
          {shows.map((show) => (
            <Show key={show.ids.trakt} show={show} hasHover={hasHover} user={user} />
          ))}
        </div>
        <Statistics
          showIds={showIds}
          includedShows={apiWatchedShows.filter(
            (showId) => !hiddenShows.includes(showId)
          )}
        />
      </div>
    );
  }
}

export default Shows;
