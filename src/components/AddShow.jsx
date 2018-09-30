import React, { Component } from 'react';
import ReactModal from 'react-modal';
import Trakt from '../apis/Trakt';
import TheMovieDb from '../apis/TheMovieDb';

ReactModal.setAppElement('#root');

class AddShow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      query: '',
      results: [],
      images: [],
    };
  }

  setQuery(query) {
    this.setState(prevState => ({
      ...prevState,
      query,
    }));
  }

  addShow(show) {
    const { addShow } = this.props;
    addShow(show);
    this.hideSearchModal();
  }

  async search() {
    this.setState(prevState => ({
      ...prevState,
      results: [],
      images: [],
    }));
    const { query } = this.state;
    let results = await Trakt.search(query);
    results = results.slice(0, 9);

    const progressPromises = results.map(result => Trakt.getShowProgress(result.show.ids.trakt));
    const progresses = await Promise.all(progressPromises);

    const imagePromises = results.map(result => TheMovieDb.getImage(result.show.ids.tmdb));
    const images = await Promise.all(imagePromises);

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

  hideSearchModal() {
    this.setState(prevState => ({
      ...prevState,
      show: false,
      results: [],
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
      setTimeout(() => this.queryInput.focus(), 1);
    });
  }

  render() {
    const { results } = this.state;
    const { query, show } = this.state;
    return (
      <div>
        <div className="center">
          <button className="small-btn btn circular plus center" type="button" onClick={() => this.showSearchModal()}>
            <span>
              +
            </span>
          </button>
        </div>
        <ReactModal
          isOpen={show}
          contentLabel="Minimal Modal Example"
          onRequestClose={() => this.hideSearchModal()}
          shouldCloseOnOverlayClick
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
              value={query}
              onChange={e => this.setQuery(e.target.value)}
              onKeyPress={e => this.handleKeyPress(e)}
              ref={(input) => { this.queryInput = input; }}
            />
            <button className="btn" onClick={() => this.search()} type="button">
              <span role="img" aria-label="search">
                🔍
              </span>
            </button>
            <div className="results shows">
              {
                results.map(result => (
                  <div key={result.ids.trakt} className="show" style={{ backgroundImage: `url(${result.imgUrl ? result.imgUrl : '/testbild.jpg'})` }}>
                    <div>
                      <p className="title">
                        { result.title }
                      </p>
                      <div className="next-episode">
                        <p className="success-0">
                          Add show
                        </p>
                        <button className="small-btn btn circular center" type="button" onClick={() => this.addShow(result)}>
                          <span>
                            +
                          </span>
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
