import React, { Component } from 'react';
import CountUp from 'react-countup';
import Helpers from '../Helpers';
import Trakt from '../apis/Trakt';
import TheMovieDb from '../apis/TheMovieDb';
import { Util } from '../Util';
import ShowProgressBar from './ShowProgressBar';
import StreamButton from './StreamButtons';

const hasHover = window.matchMedia("(hover: hover)").matches;

class Show extends Component {
  constructor(props) {
    super(props);
    const { show } = this.props;
    this.state = {
      success: 0,
      loading: false,
      show,
      image: null,
      prevPct: 100 * (show.completed / show.aired),
      seenEverything: false,
      initialX: Number.MIN_VALUE,
      lastX: Number.MIN_VALUE,
      lastY: Number.MIN_VALUE,
      xOffset: 0,
      xSpeed: 0,
      swiping: 0,
      elementWidth: Number.MIN_VALUE,
    };
    this.showElement = React.createRef();
    this.fetchImage();
    this.getNext(show);
  }

  async getNext(show) {
    const next_episode = await Trakt.nextEpisodeForRewatch(show);
    this.setState((prevState) => ({
      ...prevState,
      show: {
        ...prevState.show,
        next_episode,
      },
    }));
  }

  resetOrToss() {
    const { xOffset, xSpeed, swiping } = this.state;
    this.setState((prevState) => ({
      ...prevState,
      swiping: 0,
    }));
    if (xSpeed > 10 && swiping === 2) {
      const xVelocity = xOffset > 0 ? xSpeed : -xSpeed;
      this.tossStep(xVelocity);
    } else {
      this.reset();
    }
  }

  reset() {
    const { xOffset } = this.state;
    this.resetStep(xOffset < 0 ? -30 : 30);
  }

  async tossStep(velocity) {
    const { xOffset, elementWidth, show } = this.state;
    if (Math.abs(xOffset) < elementWidth) {
      this.setState((prevState) => ({
        ...prevState,
        xOffset: xOffset + velocity,
      }));
      window.requestAnimationFrame(() => this.tossStep(velocity));
    } else if (
      window.confirm(`Do you want to permanently hide ${show.title}?`)
    ) {
      const response = await Trakt.hideShow(show.ids);
      if (response.added.shows === 1) {
        this.setState((prevState) => ({
          ...prevState,
          seenEverything: true,
        }));
      } else {
        this.reset();
      }
    } else {
      this.reset();
    }
  }

  resetStep(velocity) {
    const { xOffset } = this.state;
    if (Math.abs(xOffset) > Math.abs(xOffset - velocity)) {
      this.setState((prevState) => ({
        ...prevState,
        xOffset: xOffset - velocity,
      }));
      window.requestAnimationFrame(() => this.resetStep(velocity));
    } else {
      this.setState((prevState) => ({
        ...prevState,
        initialX: Number.MIN_VALUE,
        lastX: Number.MIN_VALUE,
        lastY: Number.MIN_VALUE,
        xOffset: 0,
        xSpeed: 0,
        swiping: 0,
      }));
    }
  }

  onDown(e) {
    if (typeof e.persist === 'function') {
      e.persist();
    }
    if (e.touches && e.touches.length > 1) {
      this.setState((prevState) => ({
        ...prevState,
        swiping: 0,
      }));
      this.reset();
      return;
    }
    const clientX = e.clientX || e.changedTouches[0].clientX;
    const clientY = e.clientY || e.changedTouches[0].clientY;
    this.setState((prevState) => ({
      ...prevState,
      swiping: 1,
      initialX: clientX,
      lastX: clientX,
      lastY: clientY,
    }));
  }

  onMove(e) {
    if (typeof e.persist === 'function') {
      e.persist();
    }
    const { swiping, lastX, lastY } = this.state;
    if (swiping === 0) {
      return;
    }
    const clientX = e.clientX || e.changedTouches[0].clientX;
    const clientY = e.clientY || e.changedTouches[0].clientY;
    const xDiff = clientX - lastX;
    const yDiff = clientY - lastY;
    const xSpeed = Math.abs(xDiff);
    const ySpeed = Math.abs(yDiff);
    this.setState((prevState) => ({
      ...prevState,
      xSpeed,
    }));
    switch (swiping) {
      case 1:
        if (ySpeed >= xSpeed) {
          if (ySpeed > 0) {
            this.setState((prevState) => ({
              ...prevState,
              swiping: 0,
            }));
          }
          return;
        }
        this.setState((prevState) => ({
          ...prevState,
          swiping: 2,
        }));
      case 2:
        this.setState((prevState) => ({
          ...prevState,
          xOffset: prevState.xOffset + xDiff,
          lastX: clientX,
          lastY: clientY,
        }));
        e.preventDefault();
    }
  }

  updateElementWidth() {
    this.setState((prevState) => ({
      ...prevState,
      elementWidth: this.showElement.current.offsetWidth,
    }));
    this.showElement.current.addEventListener('touchstart', (e) =>
      this.onDown(e)
    );
    this.showElement.current.addEventListener('touchmove', (e) =>
      this.onMove(e)
    );
    this.showElement.current.addEventListener('touchend', (e) =>
      this.resetOrToss(e)
    );
  }

  componentDidMount() {
    window.addEventListener('resize', () => this.updateElementWidth());
    this.updateElementWidth();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', () => this.updateElementWidth());
  }

  async updateProgress() {
    const { show } = this.state;
    let newProgress = await Trakt.getShowProgress(show.ids.trakt);
    newProgress = {
      ...show,
      ...newProgress,
      show: {
        ...show.show,
        ...newProgress,
      },
    };
    newProgress = {
      ...newProgress,
      completed: Trakt.countWatchedSinceReset(newProgress),
      next_episode: await Trakt.nextEpisodeForRewatch(newProgress),
    };
    this.setState((prevState) => ({
      ...prevState,
      show: newProgress,
    }));
  }

  async markNextWatched() {
    const { show } = this.state;

    let showNotFromSearch = {
      ...show,
      addedFromSearchOrWatchlist: false,
    };


    const debugging = false;

    this.setState((prevState) => ({
      ...prevState,
      loading: true,
      show: {
        ...prevState.show,
        addedFromSearchOrWatchlist: false,
      },
    }));

    if (!debugging) {
      await Trakt.markEpisodeWatched(showNotFromSearch.next_episode.ids).catch(() => {
        this.setState((prevState) => ({
          ...prevState,
          success: 0,
          loading: false,
        }));
      });
      const newProgress = await Trakt.getShowProgress(showNotFromSearch.ids.trakt);
      showNotFromSearch = {
        ...showNotFromSearch,
        ...newProgress,
        show: newProgress,
        next_episode: showNotFromSearch.next_episode,
      };
    }

    const newCompleted = debugging ? showNotFromSearch.aired : Trakt.countWatchedSinceReset(showNotFromSearch);
    showNotFromSearch = {
      ...showNotFromSearch,
      completed: newCompleted,
    };
    this.setState((prevState) => ({
      ...prevState,
      success: 1,
      loading: false,
      show: {
        ...prevState.show,
        ...showNotFromSearch,
      },
    }));

    const newData = debugging
      ? Promise.resolve(showNotFromSearch.next_episode)
      : Trakt.nextEpisodeForRewatch(showNotFromSearch);
    await Helpers.sleep(350);
    this.setState((prevState) => ({
      ...prevState,
      success: 2,
    }));

    if (Trakt.countWatchedSinceReset(showNotFromSearch) === showNotFromSearch.aired) {
      return;
    }

    const [, newNext] = await Promise.all([Helpers.sleep(350), newData]);
    this.setState((prevState) => ({
      ...prevState,
      success: 0,
      show: {
        ...prevState.show,
        next_episode: newNext,
      },
      prevPct: 100 * (showNotFromSearch.completed / showNotFromSearch.aired),
    }));
  }

  async fetchImage() {
    const { show } = this.state;
    const image = await TheMovieDb.getImage(show.ids.tmdb);
    this.setState((prevState) => ({ ...prevState, image }));
  }

  render() {
    const {
      image,
      loading,
      prevPct,
      show,
      success,
      seenEverything,
      xOffset,
      elementWidth,
      swiping,
    } = this.state;

    const next = show.next_episode;
    const completedFraction = 100 * (show.completed / show.aired);

    if (seenEverything) {
      return null;
    }
    const seenAllAndReadyToRemove =
      show.completed === show.aired && [0, 2].includes(success);
    if (seenAllAndReadyToRemove) {
      setTimeout(() => {
        this.setState((prevState) => ({
          ...prevState,
          seenEverything: true,
        }));
      }, 250);
    }
    const done = false;
    return (
      <div>
        <div className={show.addedFromSearchOrWatchlist ? 'added-from-search visible' : ''}>
          <div
            onMouseDown={(e) => this.onDown(e)}
            onMouseMove={(e) => this.onMove(e)}
            onMouseUp={(e) => this.resetOrToss(e)}
            onMouseLeave={(e) => this.resetOrToss()}
            className={`show${!hasHover ? ' no-hover' : ''}${seenAllAndReadyToRemove ? ' seen-everything' : ''}`}
            style={{
              backgroundImage: image ? `url(${image})` : 'none',
              transform: `translateX(${xOffset}px)`,
              opacity: 1 - Math.abs(xOffset) / elementWidth,
              zIndex: swiping,
            }}
            ref={this.showElement}
          >
            <div className="show-top-area">
              <ShowProgressBar show={show} />
              <p
                className="title"
                onClick={() => this.updateProgress()}
                style={{ cursor: 'pointer' }}
              >{show.title}</p>
              <StreamButton title={show.title} />
            </div>
            {next ? (
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
                  className={`small-btn btn${success > 0 || done ? ' success' : ''
                    }${loading ? ' loading' : ''}`}
                  type="button"
                  onClick={done ? null : (e) => this.markNextWatched(e)}
                >
                  <span>&gt;</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

export default Show;
