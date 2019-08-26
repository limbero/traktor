import React, { Component } from "react";
import CountUp from "react-countup";
import Helpers from "../Helpers";
import Trakt from "../apis/Trakt";
import TheMovieDb from "../apis/TheMovieDb";
import { Util } from "../Util";

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
      seenEverything: false,
    };
    this.fetchImage();
  }

  async markNextWatched() {
    let { show } = this.state;

    const debugging = false;

    this.setState(prevState => ({
      ...prevState,
      loading: true,
      show: {
        ...prevState.show,
        addedFromSearch: false,
      },
    }));

    if (!debugging) {
      await Trakt.markEpisodeWatched(show.next_episode.ids).catch(() => {
        this.setState(prevState => ({
          ...prevState,
          success: 0,
          loading: false,
        }));
      });
    }

    const newCompleted = debugging ? show.aired : show.completed + 1;

    this.setState(prevState => ({
      ...prevState,
      success: 1,
      loading: false,
      show: {
        ...prevState.show,
        completed: newCompleted,
      },
    }));

    ({ show } = this.state);
    const newData = debugging
      ? Promise.resolve(show.next_episode)
      : Trakt.nextEpisodeForRewatch({ ...show, show }, show.completed);
    await Helpers.sleep(350);
    this.setState(prevState => ({
      ...prevState,
      success: 2,
    }));

    if (show.completed === show.aired) {
      return;
    }

    const [, newNext] = await Promise.all([Helpers.sleep(350), newData]);
    this.setState(prevState => ({
      ...prevState,
      success: 0,
      show: {
        ...prevState.show,
        next_episode: newNext,
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
      seenEverything,
    } = this.state;
    const { hasHover } = this.props;

    const next = show.next_episode;
    const completedFraction = 100 * (show.completed / show.aired);

    if (seenEverything) {
      return null;
    }
    const seenAllAndReadyToRemove =
      show.completed === show.aired && [0, 2].includes(success);
    if (seenAllAndReadyToRemove) {
      setTimeout(() => {
        this.setState(prevState => ({
          ...prevState,
          seenEverything: true,
        }));
      }, 250);
    }
    const done = false;
    return (
      <div>
        <div
          className={`show${!hasHover ? " no-hover" : ""}${
            show.addedFromSearch ? " added-from-search" : ""
          }${seenAllAndReadyToRemove ? " seen-everything" : ""}`}
          style={{ backgroundImage: image ? `url(${image})` : "none" }}
        >
          <div className="show-top-area">
            <div
              className="progress-bar"
              style={{ width: `${completedFraction}%` }}
            />
            <p className="title">{show.title}</p>
          </div>
          <div className="next-episode">
            <p className="prefix">Next up</p>
            <a
              href={`https://trakt.tv/shows/${show.ids.slug}/seasons/${show.next_episode.season}/episodes/${show.next_episode.number}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`episode-info success-${success}`}
            >
              <p className="season-and-episode-number">
                {`S${Util.zeropad(next.season)}E${Util.zeropad(next.number)}`}
              </p>
              <p className="episode-title">{next.title}</p>
            </a>
            <div className="progress-text">
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
              <p className="absolute">{`[${show.completed}/${show.aired}]`}</p>
            </div>
            <button
              className={`small-btn btn${
                success > 0 || done ? " success" : ""
              }${loading ? " loading" : ""}`}
              type="button"
              onClick={done ? null : e => this.markNextWatched(e)}
            >
              <span>&gt;</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default Show;
