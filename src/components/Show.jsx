import React, { Component } from 'react';
import CountUp from 'react-countup';
import Helpers from '../Helpers';
import Trakt from '../apis/Trakt';
import TheMovieDb from '../apis/TheMovieDb';

class Show extends Component {
  constructor(props) {
    super(props);
    const { show } = this.props;
    this.state = {
      success: 0,
      loading: false,
      show,
      image: null,
      prevPct: 0,
    };
    this.fetchImage();
  }

  async markNextWatched() {
    const { show } = this.state;

    this.setState(prevState => ({
      ...prevState,
      loading: true,
    }));

    await Trakt.markEpisodeWatched(show.next_episode.ids)
      .catch(() => {
        this.setState(prevState => ({
          ...prevState,
          success: 0,
          loading: false,
        }));
      });

    this.setState(prevState => ({
      ...prevState,
      success: 1,
      loading: false,
    }));

    const newData = Trakt.getShowProgress(show.ids.trakt);
    await Helpers.sleep(350);
    this.setState(prevState => ({
      ...prevState,
      success: 2,
    }));

    const newNext = await Promise.all([newData, Helpers.sleep(350)]);
    this.setState(prevState => ({
      ...prevState,
      success: 0,
      show: {
        ...prevState.show,
        ...newNext[0],
      },
      prevPct: 100 * (show.completed / show.aired),
    }));
  }

  async fetchImage() {
    const { show } = this.state;
    const image = await TheMovieDb.getImage(show.ids.tmdb);
    this.setState(prevState => ({ ...prevState, image }));
  }

  render() {
    const {
      image,
      loading,
      prevPct,
      show,
      success,
    } = this.state;

    const next = show.next_episode;
    const completedFraction = 100 * (show.completed / show.aired);

    if (show.completed === show.aired) {
      return null;
    }
    const done = false;
    return (
      <div className="show" style={{ backgroundImage: (image ? `url(${image})` : 'none') }}>
        <div>
          <div className="progress-bar" style={{ width: `${completedFraction}%` }} />
          <p className="percentage">
            <CountUp
              start={prevPct}
              end={completedFraction}
              duration={1.5}
              useEasing
              separator=" "
              decimals={1}
              decimal="."
              suffix="%"
            />
          </p>
          <p className="title">
            { show.title }
          </p>
          <div className="next-episode">
            <p className={`success-${success}`}>
              { `[${show.aired - show.completed} left] Next up: S${next.season}E${next.number} ${next.title}` }
            </p>
            <button className={`small-btn btn${success > 0 || done ? ' success' : ''}${loading ? ' loading' : ''}`} type="button" onClick={(done ? null : e => this.markNextWatched(e))}>
              <span>&gt;</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default Show;
