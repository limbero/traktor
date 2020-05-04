import React, { Component } from 'react';
import styled from 'styled-components';

import TheMovieDb from '../apis/TheMovieDb';
import CircularButton from './elements/CircularButton';

const StyledShowToAdd = styled.div`
  & button {
    position: absolute;
    right: 13px;
    top: 0;
  }
  &:hover button {
    top: -18px;
  }
`;

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
      <StyledShowToAdd
        className="show"
        style={{ backgroundImage: image ? `url(${image})` : 'none' }}
      >
        <div>
          <p className="title">{show.title}</p>
          <div className="next-episode">
            <p className="success-0">Add show</p>
            <CircularButton
              onClick={() => addShow(show)}
              disabled={alreadyPresent}
            >
              <span>+</span>
            </CircularButton>
          </div>
        </div>
      </StyledShowToAdd>
    );
  }
}

export default ShowToAdd;
