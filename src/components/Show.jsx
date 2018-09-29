import React, { Component } from 'react';
import runtimeEnv from '@mars/heroku-js-runtime-env';
import CountUp from 'react-countup';
import Helpers from '../Helpers';

import store from '../store/index';

const env = runtimeEnv();

class Show extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redux: store.getState(),
      success: 0,
      loading: false,
      show: null,
      prevPct: 0,
    };
  }

  async markNextWatched() {
    const { redux, show } = this.state;
    const traktAuthHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': env.REACT_APP_TRAKT_CLIENT_ID,
      'Authorization': `Bearer ${redux.token.access_token}`,
    };
    const watched = {
      episodes: [
        {
          watched_at: new Date().toISOString(),
          ids: (show ? show.next_episode.ids : this.props.show.next_episode.ids),
        },
      ],
    };

    const fetching = fetch('https://api.trakt.tv/sync/history', {
      method: 'POST',
      body: JSON.stringify(watched),
      headers: traktAuthHeaders,
    });
    this.setState(prevState => ({
      ...prevState,
      loading: true,
    }));

    const result = await fetching;
    if (result.status === 201) {
      this.setState(prevState => ({
        ...prevState,
        success: 1,
        loading: false,
      }));
      const newData = Helpers.fetchJson(`https://api.trakt.tv/shows/${this.props.show.ids.trakt}/progress/watched`, 'GET', null, traktAuthHeaders);
      await Helpers.sleep(350);
      this.setState(prevState => ({
        ...prevState,
        success: 2,
      }));
      let completedFraction = 100 * (this.props.show.completed / this.props.show.aired);
      if (show) {
        completedFraction = 100 * (show.completed / show.aired);
      }
      const newNext = await Promise.all([newData, Helpers.sleep(350)]);
      this.setState(prevState => ({
        ...prevState,
        success: 0,
        show: newNext[0],
        prevPct: completedFraction,
      }));
    } else {
      this.setState(prevState => ({
        ...prevState,
        success: 0,
        loading: false,
      }));
    }
  }

  render() {
    const {
      show,
      success,
      prevPct,
      loading,
    } = this.state;

    const propShow = JSON.parse(JSON.stringify(this.props.show));
    if (show) {
      propShow.next_episode = show.next_episode;
      propShow.completed = show.completed;
      propShow.aired = show.aired;
    }
    const next = propShow.next_episode;
    const completedFraction = 100 * (propShow.completed / propShow.aired);

    if (propShow.completed === propShow.aired) {
      return null;
    }
    const done = false;
    return (
      <div className="show" style={{ backgroundImage: `url(${propShow.imgUrl})` }}>
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
            { propShow.title }
          </p>
          <div className="next-episode">
            <p className={`success-${success}`}>
              { `[${propShow.aired - propShow.completed} left] Next up: S${next.season}E${next.number} ${next.title}` }
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
