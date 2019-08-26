import React, { Component } from 'react';
import ReactModal from 'react-modal';
import Trakt from '../apis/Trakt';
import ShowToAdd from './ShowToAdd';

ReactModal.setAppElement('#root');

class AddShow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      query: '',
      results: [],
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
    }));
    const { query } = this.state;
    const results = await Trakt.search(query, 20);

    const progressPromises = results.map(result => Trakt.getShowProgress(result.show.ids.trakt));
    const progresses = await Promise.all(progressPromises);

    const shows = progresses
      .map((show, index) => {
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
        };
      })
      .filter(show => show.aired !== show.completed)
      .slice(0, 9);

    this.setState(prevState => ({
      ...prevState,
      results: shows,
    }));
  }

  hideSearchModal() {
    this.setState(prevState => ({
      ...prevState,
      isOpen: false,
      results: [],
    }));
  }

  handleKeyPress(e) {
    if (e.key === 'Enter') {
      this.search();
      e.preventDefault();
    }
  }

  showSearchModal() {
    this.setState(prevState => ({
      ...prevState,
      isOpen: true,
    }), () => {
      setTimeout(() => this.queryInput.focus(), 1);
    });
  }

  render() {
    const { isOpen, query, results } = this.state;
    const { showIds } = this.props;
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
          isOpen={isOpen}
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
            <form className="center" action="#">
              <input
                type="search"
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
            </form>
            <div className="results shows">
              {
                results.map(result => (
                  <ShowToAdd
                    key={result.ids.trakt}
                    show={result}
                    addShow={() => this.addShow(result)}
                    alreadyPresent={showIds.includes(result.ids.trakt)}
                  />
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
