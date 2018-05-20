import React, { Component } from 'react';
import Helpers from './Helpers';

import store from "./store/index";


class Show extends Component {
  render() {
    const show = this.props.show;
    const next = show.next_episode;
    const completedFraction = (100*(show.completed / show.aired)).toFixed(1) + '%';
    return (
      <div className="show" style={{ backgroundImage: `url(${show.imgUrl})`}}>
        <div className="progress-bar" style={{ width: completedFraction }} />
        <p className="percentage">{ completedFraction }</p>
        <p className="title">{ show.title }</p>
        <p className="next-episode">{ `[${show.aired-show.completed} left] Next up: S${next.season}E${next.number} ${next.title}` }</p>
      </div>
    );
  }
}

export default Show;
