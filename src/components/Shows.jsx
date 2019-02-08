import React, { Component } from 'react';
import { wrapGrid } from 'animate-css-grid';
import Trakt from '../apis/Trakt';
import Show from './Show';
import ProgressCircle from './ProgressCircle';
import AddShow from './AddShow';

let first = true;

class Shows extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shows: [],
      loading: true,
      prevPercent: 0,
      percent: 0,
    };

    Promise.all(
      [
        this.trackForLoading(Trakt.getHiddenShows(), 5),
        this.trackForLoading(Trakt.getShows(), 20),
        this.trackForLoading(Trakt.getRatings(), 5),
      ],
    ).then((triple) => {
      const hiddenShows = triple[0].map(hidden => hidden.show.ids.trakt);
      const watchedShows = triple[1]
        .filter(watched => (
          !hiddenShows.includes(watched.show.ids.trakt)
        ))
        .filter((watched) => {
          const watchedEpisodes = watched.seasons
            .filter(season => season.number !== 0)
            .map(season => season.episodes.length)
            .reduce((a, b) => a + b, 0);
          return watchedEpisodes !== watched.show.aired_episodes;
        });

      const ratedShowMap = {};
      triple[2].forEach((ratedShow) => {
        ratedShowMap[ratedShow.show.ids.trakt] = ratedShow.rating;
      });

      Promise.all(watchedShows.map(watched => (
        this.trackForLoading(
          Trakt.getShowProgress(watched.show.ids.trakt),
          70 / watchedShows.length,
        )
      ))).then((allShows) => {
        const shows = allShows
          .map((show, index) => {
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
              rating: ratedShowMap[watched.show.ids.trakt],
            };
          })
          .filter(show => show.aired !== show.completed)
          .sort((a, b) => {
            if (a.rating > b.rating) {
              return -1;
            } else if (a.rating < b.rating) {
              return 1;
            } else {
              if (a.last_watched_at > b.last_watched_at) {
                return -1;
              } else if (a.last_watched_at < b.last_watched_at) {
                return 1;
              } else {
                return 0;
              }
            }
          });

        this.setState(
          prevState => ({
            ...prevState,
            shows,
            loading: false,
          }),
        );
      });
    });
  }

  componentDidUpdate() {
    const { loading } = this.state;
    if (!loading && first) {
      first = false;
      wrapGrid(this.grid, {
        stagger: 100,
        duration: 500,
      });
    }
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

  increaseLoading(percent) {
    this.setState(
      prevState => ({
        ...prevState,
        prevPercent: prevState.percent,
        percent: prevState.percent + percent,
      }),
    );
  }

  trackForLoading(promise, worth) {
    return promise.then((result) => {
      this.increaseLoading(worth);
      return result;
    });
  }

  render() {
    const {
      shows,
      loading,
      prevPercent,
      percent,
    } = this.state;
    const {
      hasHover
    } = this.props;

    if (loading) {
      return (
        <div className="center">
          <ProgressCircle percent={percent} prevPercent={prevPercent} />
        </div>
      );
    }
    return (
      <div>
        <AddShow addShow={show => this.addShow(show)} />
        <div className="shows" ref={(el) => { (this.grid = el); }}>
          {
            shows.map(show => <Show key={show.ids.trakt} show={show} hasHover={hasHover} />)
          }
        </div>
      </div>
    );
  }
}

export default Shows;
