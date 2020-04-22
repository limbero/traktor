import React, { Component } from 'react';
import TheMovieDb from '../apis/TheMovieDb';

class ShowToAdd extends Component {
  constructor(props) {
    super(props);
    this.state = {
      image: null,
    };
    this.fetchImage();
  }

  async fetchImage() {
    const { show } = this.props;
    const image = await TheMovieDb.getImage(show.ids.tmdb);
    this.setState((prevState) => ({ ...prevState, image }));
  }

  render() {
    const { addShow, show, alreadyPresent } = this.props;
    const { image } = this.state;
    return (
      <div
        className="show"
        style={{ backgroundImage: image ? `url(${image})` : 'none' }}
      >
        <div>
          <p className="title">{show.title}</p>
          <div className="next-episode">
            <p className="success-0">Add show</p>
            <button
              className="small-btn btn circular center"
              type="button"
              onClick={() => addShow(show)}
              disabled={alreadyPresent}
            >
              <span>+</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ShowToAdd;
