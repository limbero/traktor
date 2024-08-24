import { useEffect, useRef } from 'react';

import Trakt, { ExtendedTraktShowWithProgress, HiddenItem, getAllShowsProgressShow } from '../apis/Trakt';

import { useShowsProgressStore, ZustandShowWithProgress } from '../zustand/ShowsProgressStore';
import useLoading from '../hooks/useLoading';

import Show from '../components/Show';
import ProgressCircle from '../components/ProgressCircle';
import AddShow from '../components/AddShow.jsx';
import Statistics from '../components/Statistics';
import { useNewShowStore } from '../zustand/NewShowStore.ts';
import TraktorStreaming from '../apis/TraktorStreaming.ts';

function ShowsProgress() {
  const { shows, setShows, prependShow } = useShowsProgressStore();
  const { addNewShow, clearNewShow, newShow } = useNewShowStore();

  const [loadedPercentage, incrementLoadedPercentage] = useLoading();
  const gridRef = useRef<HTMLDivElement>(null);

  const trackForLoading = (promise: Promise<any>, worth: number) => {
    return promise.then((result) => {
      incrementLoadedPercentage(worth);
      return result;
    });
  };

  const getNext = async (show: ZustandShowWithProgress): Promise<ZustandShowWithProgress> => {
    return Trakt.nextEpisodeForRewatch(show).then(next_episode => ({
      ...show,
      next_episode,
    }));
  };

  useEffect(() => {
    if (newShow === null || shows === null) { return; }
    if (newShow.ids.trakt === shows[0].ids.trakt) {
      clearNewShow();
      setTimeout(() => {
        setShows(shows.map(show => ({
          ...show,
          addedFromSearchOrWatchlist: false,
        })))
      }, 500)
    } else {
      Promise.all([
        getNext(newShow),
        TraktorStreaming.getLocationsForShow(newShow.title),
      ]).then(([showWithNext, showStreamingLocations]) => prependShow({
        ...showWithNext,
        streaming_locations: showStreamingLocations,
      }));
    }
  }, [shows, newShow]);

  useEffect(() => {
    (async () => {
      if (shows !== null) { return; }
      const [apiHiddenShows, apiWatchedShows]: [HiddenItem[], getAllShowsProgressShow[]] = await Promise.all([
        trackForLoading(Trakt.getHiddenShows(), 10),
        trackForLoading(Trakt.getShowsProgress(), 20),
      ]);

      const hiddenShows = apiHiddenShows.map((hidden) => hidden.show.ids.trakt);

      const nonHiddenShows = apiWatchedShows
        .filter(
          (watchedShow) => !hiddenShows.includes(watchedShow.show.ids.trakt)
        );

      const nonHiddenShowsProgress: ExtendedTraktShowWithProgress[] = await Promise.all(
        nonHiddenShows.map((watched: getAllShowsProgressShow) =>
          trackForLoading(
            Trakt.getShowProgressExtended(watched.show.ids.trakt),
            70 / nonHiddenShows.length
          )
        )
      );
      const fetchedShows = nonHiddenShowsProgress
        .map((show, index): ZustandShowWithProgress => {
          const watched = nonHiddenShows[index];
          return {
            addedFromSearchOrWatchlist: false,
            title: watched.show.title,
            ids: watched.show.ids,
            aired: show.aired,
            completed: Trakt.countWatchedSinceReset(show),
            last_watched_at: watched.last_watched_at,
            reset_at: Trakt.showResetAt(watched),
            seasons: show.seasons,
            runtime: show.last_episode?.runtime || show.next_episode?.runtime,
          };
        })
        .filter((show) => show.aired > show.completed)
        .sort((a, b) => {
          if (a.last_watched_at > b.last_watched_at) {
            return -1;
          } else if (a.last_watched_at < b.last_watched_at) {
            return 1;
          } else {
            return 0;
          }
        });

      setShows(fetchedShows);

      const showsWithNextEpisode = await Promise.all(fetchedShows.map(getNext));
      setShows(showsWithNextEpisode);

      const showsStreamingLocations = await Promise.all(fetchedShows.map((show) => TraktorStreaming.getLocationsForShow(show.title)));
      setShows(showsWithNextEpisode.map((show, idx) => ({
        ...show,
        streaming_locations: showsStreamingLocations[idx],
      })));
    })();
  }, [shows]);

  if (shows === null) {
    return (
      <div className="center">
        <ProgressCircle percent={loadedPercentage.current} prevPercent={loadedPercentage.previous} />
      </div>
    );
  }

  const showIds = shows.map(show => show.ids.trakt);

  return (
    <div>
      <div className="center">
        <AddShow addShow={addNewShow} showIds={showIds} />
      </div>
      <div
        className="shows"
        ref={gridRef}
      >
        {shows.map((show) => (
          <Show key={show.ids.trakt} id={show.ids.trakt} />
        ))}
      </div>
      <Statistics shows={shows} />
    </div>
  );
}

export default ShowsProgress;
