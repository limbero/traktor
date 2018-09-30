import React, { Component } from 'react';
import { wrapGrid } from 'animate-css-grid';
import Trakt from './apis/Trakt';
import TheMovieDb from './apis/TheMovieDb';
import Show from './components/Show';
import ProgressCircle from './components/ProgressCircle';
import AddShow from './components/AddShow';

let first = true;

class Shows extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shows: [],
      images: [],
      loading: true,
      prevPercent: 0,
      percent: 0,
    };

    Promise.all(
      [
        this.trackForLoading(Trakt.getHiddenShows(), 10),
        this.trackForLoading(Trakt.getShows(), 20),
      ],
    ).then((tuple) => {
      const hiddenShows = tuple[0].map(hidden => hidden.show.ids.trakt);
      const watchedShows = tuple[1].filter(watched => !hiddenShows.includes(watched.show.ids.trakt));

      Promise.all(watchedShows.map(watched => this.trackForLoading(Trakt.getShowProgress(watched.show.ids.trakt), 70 / watchedShows.length)))
        .then((allShows) => {
          const shows = allShows.map((show, index) => {
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

          this.setState(
            prevState => ({
              ...prevState,
              shows,
              images: shows.map(() => null),
              loading: false,
            }),
            () => this.fetchImages(),
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
        images: [
          ...prevState.images,
          null,
        ],
      }
    ),
    this.fetchImages);
  }

  async fetchImages() {
    const { shows } = this.state;
    shows.forEach((show, index) => {
      TheMovieDb.getImage(show.ids.tmdb).then((image) => {
        this.setState((prevState) => {
          return {
            ...prevState,
            images: Object.assign([...prevState.images], { [index]: image }),
          };
        });
      });
    });
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
      images,
      loading,
      prevPercent,
      percent,
    } = this.state;

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
            shows.map((show, index) => <Show key={show.ids.trakt} image={images[index]} show={show} />)
          }
        </div>
      </div>
    );
  }
}

export default Shows;
