import React, { Component } from 'react';
import runtimeEnv from '@mars/heroku-js-runtime-env';
import CountUp from 'react-countup';
import Helpers from '../Helpers';

import store from "../store/index";
const env = runtimeEnv();

class Show extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redux: store.getState(),
      success: 0,
      loading: false,
      show: null,
      prevPct: 0
    };
  }
  async markNextWatched(e) {
    const traktAuthHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': env.REACT_APP_TRAKT_CLIENT_ID,
      'Authorization': `Bearer ${this.state.redux.token.access_token}`
    };
    const watched = {
      episodes: [
        {
          watched_at: new Date().toISOString(),
          ids: (this.state.show ? this.state.show.next_episode.ids : this.props.show.next_episode.ids)
        }
      ]
    };
    
    const fetching = fetch('https://api.trakt.tv/sync/history', {
      method: 'POST',
      body: JSON.stringify(watched),
      headers: traktAuthHeaders
    });
    this.setState((prevState) => {
      return {
        ...prevState,
        loading: true
      };
    });

    const result = await fetching;
    if (result.status === 201) {
      this.setState((prevState) => {
        return {
          ...prevState,
          success: 1,
          loading: false
        };
      });
      const newData = Helpers.fetchJson(`https://api.trakt.tv/shows/${this.props.show.ids.trakt}/progress/watched`, 'GET', null, traktAuthHeaders);
      await Helpers.sleep(350);
      this.setState((prevState) => {
        return {
          ...prevState,
          success: 2
        };
      });
      let completedFraction = 100*(this.props.show.completed / this.props.show.aired);
      if (this.state.show) {
        completedFraction = 100*(this.state.show.completed / this.state.show.aired);
      }
      const newNext = await Promise.all([newData, Helpers.sleep(350)]);
      this.setState((prevState) => {
        return {
          ...prevState,
          success: 0,
          show: newNext[0],
          prevPct: completedFraction
        };
      });
    } else {
      this.setState((prevState) => {
        return {
          ...prevState,
          success: 0,
          loading: false
        };
      });
    }
  }
  render() {
    const show = JSON.parse(JSON.stringify(this.props.show));
    if (this.state.show) {
      show.next_episode = this.state.show.next_episode;
      show.completed = this.state.show.completed;
      show.aired = this.state.show.aired;
    }
    const next = show.next_episode;
    const completedFraction = 100*(show.completed / show.aired);

    let next_episode = (<p>All done!</p>);
    let done = true;
    if (show.completed !== show.aired) {
      done = false;
      next_episode = (<p className={ `success-${this.state.success}` }>
        { `[${show.aired-show.completed} left] Next up: S${next.season}E${next.number} ${next.title}` }
      </p>);
    }
    return (
      <div className="show" style={{ backgroundImage: `url(${show.imgUrl})`}}>
        <div className="progress-bar" style={{ width: completedFraction + '%' }} />
        <p className="percentage">
          <CountUp
              start={this.state.prevPct}
              end={completedFraction}
              duration={1.5}
              useEasing={true}
              separator=" "
              decimals={1}
              decimal="."
              suffix="%"
            />
        </p>
        <p className="title">{ show.title }</p>
        <div className="next-episode">
          {next_episode}
          <a className={ 'small-btn btn' + (this.state.success > 0 || done ? ' success' : '') + (this.state.loading ? ' loading' : '')} onClick={(done ? null : (e) => this.markNextWatched(e))}>&gt;</a>
        </div>
      </div>
    );
  }
}

export default Show;
