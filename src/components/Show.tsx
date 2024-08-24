import React, { useState, useEffect, useRef } from 'react';
import CountUp from 'react-countup';
import Helpers from '../Helpers';
import Trakt from '../apis/Trakt';
import TheMovieDb from '../apis/TheMovieDb';
import { Util } from '../Util';
import ShowProgressBar from './ShowProgressBar';
import StreamButtons from './StreamButtons';
import { ZustandShowWithProgress, useShowsProgressStore } from '../zustand/ShowsProgressStore';

const hasHover = window.matchMedia("(hover: hover)").matches;

type ShowProps = {
  id: number;
};sdfsdfs

function isTouchEvent(e: Event | React.TouchEvent | React.MouseEvent): e is React.TouchEvent {
  return e && 'touches' in e;
}

function isMouseEvent(e: Event | React.TouchEvent | React.MouseEvent): e is React.MouseEvent {
  return e && 'screenX' in e;
}

const Show: React.FunctionComponent<ShowProps> = ({ id }: ShowProps) => {

  const { getShow, updateShow, updateShowFn } = useShowsProgressStore();
  const show = getShow(id);
  if (show === null) { return null; }

  const [initialShow] = useState(show);

  const [success, setSuccess] = useState(0);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [prevPct, setPrevPct] = useState(100 * (initialShow.completed / initialShow.aired));
  const [seenEverything, setSeenEverything] = useState(false);
  const [, setInitialX] = useState(Number.MIN_VALUE);
  const [lastX, setLastX] = useState(Number.MIN_VALUE);
  const [lastY, setLastY] = useState(Number.MIN_VALUE);
  const [xOffset, setXOffset] = useState(0);
  const [xSpeed, setXSpeed] = useState(0);
  const [swiping, setSwiping] = useState(0);
  const [elementWidth, setElementWidth] = useState(Number.MIN_VALUE);
  const showElement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchImage();
  }, [show.ids.trakt]);

  useEffect(() => {
    const handleResize = () => updateElementWidth();
    window.addEventListener('resize', handleResize);
    updateElementWidth();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetOrToss = () => {
    if (xSpeed > 10 && swiping === 2) {
      const xVelocity = xOffset > 0 ? xSpeed : -xSpeed;
      tossStep(xVelocity);
    } else {
      reset();
    }
    setSwiping(0);
  };

  const reset = () => {
    resetStep(xOffset > 0 ? -30 : 30);
  };

  const tossStep = async (velocity: number) => {
    setXOffset((prevOffset) => {
      if (Math.abs(prevOffset) < elementWidth) {
        window.requestAnimationFrame(() => tossStep(velocity));
        return prevOffset + velocity;
      } else if (window.confirm(`Do you want to permanently hide ${show.title}?`)) {
        Trakt.hideShow(show.ids).then(response => {
          if (response.added.shows === 1) {
            setSeenEverything(true);
          } else {
            reset();
          }
        });
      } else {
        reset();
      }
      return prevOffset + velocity
    });
  };

  const resetStep = (velocity: number) => {
    setXOffset((prevOffset) => {
      if (Math.abs(prevOffset) > 30) {
        const velocitySign = prevOffset > 0 ? -1 : 1;
        window.requestAnimationFrame(() => resetStep(velocitySign * Math.abs(velocity)));
        return prevOffset + velocity;
      } else {
        setInitialX(Number.MIN_VALUE);
        setLastX(Number.MIN_VALUE);
        setLastY(Number.MIN_VALUE);
        setXSpeed(0);
        setSwiping(0);
        return 0;
      }
    });
  };

  const onDown = (e: Event | React.MouseEvent | React.TouchEvent) => {
    if (isTouchEvent(e) && e.touches && e.touches.length > 1) {
      setSwiping(0);
      reset();
      return;
    }
    const clientX = isMouseEvent(e) ? e.clientX : isTouchEvent(e) ? e.changedTouches[0].clientX : 0;
    const clientY = isMouseEvent(e) ? e.clientY : isTouchEvent(e) ? e.changedTouches[0].clientY : 0;
    setSwiping(1);
    setInitialX(clientX);
    setLastX(clientX);
    setLastY(clientY);
  };

  const onMove = (e: Event | React.MouseEvent | React.TouchEvent) => {
    if (!isMouseEvent && !isTouchEvent) { return; }
    const clientX = isMouseEvent(e) ? e.clientX : isTouchEvent(e) ? e.changedTouches[0].clientX : 0;
    const clientY = isMouseEvent(e) ? e.clientY : isTouchEvent(e) ? e.changedTouches[0].clientY : 0;
    if (swiping === 0) return;
    const xDiff = clientX - lastX;
    const yDiff = clientY - lastY;
    const xSpeed = Math.abs(xDiff);
    const ySpeed = Math.abs(yDiff);
    setXSpeed(xSpeed);
    if (swiping === 1) {
      if (ySpeed >= xSpeed) {
        if (ySpeed > 0) {
          setSwiping(0);
        }
        return;
      }
      setSwiping(2);
    }
    if (swiping === 2) {
      setXOffset((prevOffset) => prevOffset + xDiff);
      setLastX(clientX);
      setLastY(clientY);
      e.preventDefault();
    }
  };

  const updateElementWidth = () => {
    if (showElement.current === null) { return; }
    setElementWidth(showElement.current.offsetWidth);
    showElement.current.addEventListener('touchstart', onDown);
    showElement.current.addEventListener('touchmove', onMove);
    showElement.current.addEventListener('touchend', resetOrToss);
  };

  const updateProgress = async (currentShow: ZustandShowWithProgress) => {
    const newProgress = await Trakt.getShowProgressExtended(currentShow.ids.trakt);

    let newProgressWithTitleAndIds: ZustandShowWithProgress = {
      ...currentShow,
      aired: newProgress.aired,
      completed: Trakt.countWatchedSinceReset(newProgress),
      last_watched_at: newProgress.last_watched_at,
      reset_at: Trakt.showResetAt(newProgress),
      seasons: newProgress.seasons,
      runtime: newProgress.last_episode?.runtime || newProgress.next_episode?.runtime,
    };

    if (newProgressWithTitleAndIds.completed === newProgressWithTitleAndIds.aired) {
      setTimeout(() => setSeenEverything(true), 350);
    } else {
      newProgressWithTitleAndIds.next_episode = await Trakt.nextEpisodeForRewatch(newProgressWithTitleAndIds);
    }
    updateShow(newProgressWithTitleAndIds);
  };

  const markNextWatched = async () => {
    let showNotFromSearch: ZustandShowWithProgress = {
      ...show,
      addedFromSearchOrWatchlist: false,
    };
    if (!showNotFromSearch.next_episode) { return; }
    setLoading(true);
    updateShowFn((prevShow) => {
      const prevShowNotFromSearch = {
        ...prevShow,
        addedFromSearchOrWatchlist: false,
      };
      // updateShow(prevShowNotFromSearch);
      return prevShowNotFromSearch;
    }, id);

    const debugging = false;
    if (!debugging) {
      try {
        await Trakt.markEpisodeWatched(showNotFromSearch.next_episode.ids);
      } catch {
        setSuccess(0);
        setLoading(false);
        return;
      }
      const newProgress = await Trakt.getShowProgressExtended(showNotFromSearch.ids.trakt);
      showNotFromSearch = {
        ...showNotFromSearch,
        aired: newProgress.aired,
        completed: Trakt.countWatchedSinceReset(newProgress),
        last_watched_at: newProgress.last_watched_at,
        reset_at: Trakt.showResetAt(newProgress),
        seasons: newProgress.seasons,
        next_episode: showNotFromSearch.next_episode,
        runtime: newProgress.last_episode?.runtime || newProgress.next_episode?.runtime,
      };
    }

    const newCompleted = debugging ? showNotFromSearch.aired : Trakt.countWatchedSinceReset(showNotFromSearch);
    showNotFromSearch = {
      ...showNotFromSearch,
      completed: newCompleted,
    };

    updateShow(showNotFromSearch);
    setSuccess(1);
    setLoading(false);

    const newData = debugging ? Promise.resolve(showNotFromSearch.next_episode) : Trakt.nextEpisodeForRewatch(showNotFromSearch);
    await Helpers.sleep(350);
    setSuccess(2);

    if (Trakt.countWatchedSinceReset(showNotFromSearch) === showNotFromSearch.aired) {
      setTimeout(() => setSeenEverything(true), 350);
      setTimeout(() => updateShow(showNotFromSearch), 750);
      return;
    }

    const [, newNext] = await Promise.all([Helpers.sleep(350), newData]);
    setSuccess(0);
    updateShowFn((prevShow) => {
      const showWithNewNext = {
        ...prevShow,
        next_episode: newNext,
      };
      setTimeout(() => updateShow(showWithNewNext), 500);
      return showWithNewNext;
    }, id);
    setPrevPct(100 * (showNotFromSearch.completed / showNotFromSearch.aired));
  };

  const fetchImage = async () => {
    const image = await TheMovieDb.getImage(show.ids.tmdb.toString());
    setImage(image);
  };

  const next = show.next_episode;
  const completedFraction = 100 * (show.completed / show.aired);

  if (seenEverything || initialShow.completed === initialShow.aired) {
    return null;
  }

  const seenAllAndReadyToRemove = show.completed === show.aired && [0, 2].includes(success);

  return (
    <div>
      <div className={show.addedFromSearchOrWatchlist ? 'added-from-search visible' : ''}>
        <div
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={resetOrToss}
          onMouseLeave={resetOrToss}
          className={`show${!hasHover ? ' no-hover' : ''}${seenAllAndReadyToRemove ? ' seen-everything' : ''}`}
          style={{
            backgroundImage: image ? `url(${image})` : 'none',
            transform: `translateX(${xOffset}px)`,
            opacity: 1 - Math.abs(xOffset) / elementWidth,
            zIndex: swiping,
          }}
          ref={showElement}
        >
          <div className="show-top-area">
            <ShowProgressBar show={show} />
            <p
              className="title"
              onClick={() => updateProgress(show)}
              style={{ cursor: 'pointer' }}
            >{show.title}</p>
            <StreamButtons showStreamingLocations={show?.streaming_locations || []} />
          </div>
          {next ? (
            <div className="next-episode">
              <p className="prefix">Next up</p>
              <a
                href={`https://trakt.tv/shows/${show.ids.slug}/seasons/${next.season}/episodes/${next.number}`}
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
                className={`small-btn btn${success > 0 || seenAllAndReadyToRemove ? ' success' : ''}${loading ? ' loading' : ''}`}
                type="button"
                onClick={seenAllAndReadyToRemove ? undefined : markNextWatched}
              >
                <span>&gt;</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Show;