import React, { Component } from 'react';
import ReactModal from 'react-modal';
import runtimeEnv from '@mars/heroku-js-runtime-env';
import Helpers from '../Helpers';
import Show from './Show';

import store from '../store/index';

const env = runtimeEnv();
ReactModal.setAppElement('#root');

class AddShow extends Component {
  constructor(props) {
    super(props);
    const redux = store.getState();
    this.state = {
      redux,
      show: false,
      traktAuthHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': env.REACT_APP_TRAKT_CLIENT_ID,
        'Authorization': `Bearer ${redux.token.access_token}`,
      },
      query: '',
      results: [],
      images: [],
    };
  }

  hideSearchModal() {
    this.setState(prevState => ({
      ...prevState,
      show: false,
      results: [],
      images: [],
    }));
  }

  async search() {
    this.setState(prevState => ({
      ...prevState,
      results: [],
      images: [],
    }));
    let results = await Helpers.fetchJson(`https://api.trakt.tv/search/show?query=${this.state.query}&limit=9`, 'GET', null, this.state.traktAuthHeaders);
    results = results.slice(0, 9);

    const progressPromises = results.map(result => {
      return Helpers.fetchJson(`https://api.trakt.tv/shows/${result.show.ids.trakt}/progress/watched`, 'GET', null, this.state.traktAuthHeaders);
    });
    const progresses = await Promise.all(progressPromises);

    const imagePromises = results.map(result => {
      return Helpers.fetchJson(`https://api.themoviedb.org/3/tv/${result.show.ids.tmdb}/images?api_key=${env.REACT_APP_THEMOVIEDB_APIKEY}`, 'GET');
    });
    const responses = await Promise.all(imagePromises);
    const images = responses.map(response => {
      if (
        !response.hasOwnProperty('backdrops') ||
        response.backdrops.length === 0
      ) {
        return null;
      }
      return `https://image.tmdb.org/t/p/w500${response.backdrops[0].file_path}`;
    });

    const shows = progresses.map((show, index) => {
      const watched = results[index];
      return {
        title: watched.show.title,
        ids: watched.show.ids,
        aired: show.aired,
        completed: show.completed,
        last_episode: show.last_episode,
        last_watched_at: show.last_watched_at,
        next_episode: show.next_episode,
        seasons: show.seasons,
        imgUrl: images[index],
      };
    });

    this.setState(prevState => ({
      ...prevState,
      results: shows,
      images,
    }));
  }

  addShow(show) {
    this.props.addShow(show);
    this.hideSearchModal();
  }

  setQuery(query) {
    this.setState(prevState => ({
      ...prevState,
      query,
    }));
  }

  handleKeyPress(e) {
    if (e.key === 'Enter') {
      this.search();
    }
  }

  showSearchModal() {
    this.setState(prevState => ({
      ...prevState,
      show: true,
    }), () => {
      setTimeout(() => { this.queryInput && this.queryInput.focus() }, 1);
    });
  }

  render() {
    const { results, images } = this.state;
    return (
      <div>
        <button className="small-btn btn circular" type="button" onClick={() => this.showSearchModal()}>
          +
        </button>
        <ReactModal
          isOpen={this.state.show}
          contentLabel="Minimal Modal Example"
          onRequestClose={() => this.hideSearchModal()}
          shouldCloseOnOverlayClick={true}
          className="Modal"
          overlayClassName="modalOverlay"
        >
          <button className="small-btn btn circular modalX" onClick={() => this.hideSearchModal()} type="button">
            <span role="img" aria-label="close">
              ✕
            </span>
          </button>
          <div className="inner">
            <input
              type="text"
              value={this.state.query}
              onChange={(e) => this.setQuery(e.target.value)}
              onKeyPress={(e) => this.handleKeyPress(e)}
              ref={(input) => { this.queryInput = input; }}
            />
            <button className="btn" onClick={() => this.search()} type="button">
              <span role="img" aria-label="search">
                🔍
              </span>
            </button>
            <div className="results shows">
              {
                results.map((show, index) => (
                  <div key={show.ids.trakt} className="show" style={{ backgroundImage: `url(${show.imgUrl})` }}>
                    <div>
                      <p className="title">
                        { show.title }
                      </p>
                      <div className="next-episode">
                        <p className="success-0">
                          Add show
                        </p>
                        <button className="small-btn btn circular" type="button" onClick={() => this.addShow(show)}>
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </ReactModal>
      </div>
    );
  }
}

export default AddShow;
