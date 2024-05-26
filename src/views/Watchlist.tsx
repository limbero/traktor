import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import styled from 'styled-components';

import Trakt, { genres } from '../apis/Trakt.js';
import TheMovieDb from '../apis/TheMovieDb.js';

import { useNewShowStore } from '../zustand/NewShowStore';
import { useWatchlistStore } from '../zustand/WatchlistStore';
import useLoading from '../hooks/useLoading';

import { streamingServicesMap } from '../components/StreamingServices.js';
import ProgressCircle from '../components/ProgressCircle';
import ShowToAdd from '../components/ShowToAdd';
import TraktorStreaming from '../apis/TraktorStreaming.js';
import { useHistory } from 'react-router-dom';

const GenrePicker = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: space-around;
  gap: 8px 30px;

  max-width: 900px;
  margin: 0 auto 20px;
`;

const Filters = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px 30px;
`;

interface imagesMap {
  [key: number]: string;
};
interface genresBooleanMap {
  [key: string]: boolean;
};

function Watchlist() {
  const history = useHistory();

  const { watchlist, setWatchlist } = useWatchlistStore();
  const { addNewShow } = useNewShowStore();

  const [loadedPercentage, incrementLoadedPercentage] = useLoading();

  const [showGenres, setShowGenres] = useState<boolean>(false);
  const [genresFilter, setGenresFilter] = useState<genresBooleanMap | null>(null);

  const [streamingServices] = useLocalStorage<streamingServicesMap | null>("traktor-streaming-services", null);
  const [filterOnStreaming, setFilterOnStreaming] = useState<boolean>(false);

  const [images, setImages] = useState<imagesMap | null>(null);
  useEffect(() => {
    (async () => {
      if (watchlist) { return; }
      const watchlistItems = await Trakt.getWatchlist().then(resp => {
        incrementLoadedPercentage(60);
        return resp;
      });

      const streamingLocationPromises = watchlistItems.map((item) => TraktorStreaming.getLocationsForShow(item.show.title).then(resp => {
        incrementLoadedPercentage(20 / watchlistItems.length);
        return resp;
      }));

      const streamingLocations = await Promise.all(streamingLocationPromises);
      const watchlistWithServices = watchlistItems.map((item, idx) => ({
        ...item,
        show: {
          ...item.show,
          streaming_locations: streamingLocations[idx],
        },
      }));

      setWatchlist(watchlistWithServices);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (watchlist === null) { return; }

      const imagePromisesForItems = watchlist.map((item) => TheMovieDb.getImage(item.show.ids.tmdb.toString()).then(resp => {
        incrementLoadedPercentage(20 / watchlist.length);
        return resp;
      }));

      const imagesForItems = await Promise.all(imagePromisesForItems);
      const imagesObject: imagesMap = {};
      imagesForItems.forEach((image, idx) => imagesObject[watchlist[idx].id] = image);

      setImages(imagesObject);

      const newGenresFilter: genresBooleanMap = {};
      const genresFromShows = new Set(watchlist.flatMap(item => item.show.genres));
      Array.from(genresFromShows).sort().forEach(genre => {
        newGenresFilter[genre] = false;
      });
      setGenresFilter(newGenresFilter);
    })();
  }, [watchlist])

  if (watchlist === null || images === null || streamingServices === null || genresFilter === null) {
    return (<div className="center">
      <ProgressCircle percent={loadedPercentage.current} prevPercent={loadedPercentage.previous} />
    </div>);
  }

  const myServices = Object.keys(streamingServices).filter(key => streamingServices[key]);
  let filteredWatchlist = watchlist;
  if (filterOnStreaming) {
    filteredWatchlist = filteredWatchlist.filter(item => {
      if (!item.show?.streaming_locations) return false;
      for (let idx = 0; idx < item.show.streaming_locations.length; idx++) {
        if (myServices.includes(item.show.streaming_locations[idx].technical_name)) {
          return true;
        }
      }
      return false;
    });
  }
  if (new Set(Object.values(genresFilter)).has(true)) {
    filteredWatchlist = filteredWatchlist.filter(item => {
      if (!item.show?.genres) return true;
      for (let idx = 0; idx < item.show.genres.length; idx++) {
        if (genresFilter[item.show.genres[idx]]) {
          return true;
        }
      }
      return false;
    });
  }

  const genresFromShows = new Set(watchlist.flatMap(item => item.show.genres));
  const genresWithShows = genres.filter(genre => genresFromShows.has(genre.slug));

  return (<>
    <div>
      <h2
        style={{ textAlign: "center", cursor: "pointer" }}
        onClick={() => setShowGenres(!showGenres)}
      >
        Genres <span style={{ fontSize: "0.5em", verticalAlign: "middle" }}>{showGenres ? "▲" : "▼"}</span>
      </h2>
      <GenrePicker style={{ display: showGenres ? "flex" : "none" }}>
        {
          genresWithShows.map(genre => (
            <div key={genre.slug}>
              <input
                type="checkbox"
                id={genre.slug}
                onChange={() => {
                  const newGenresFilter = { ...genresFilter };
                  newGenresFilter[genre.slug] = !newGenresFilter[genre.slug];
                  setGenresFilter(newGenresFilter);
                }}
                checked={genresFilter[genre.slug]}
              />
              <label htmlFor={genre.slug}>
                {genre.name}
              </label>
            </div>
          ))
        }
      </GenrePicker>
    </div>
    <div>
      <Filters>
        <div>
          <input
            type="checkbox"
            id="streaming-filter"
            onChange={() => setFilterOnStreaming(!filterOnStreaming)}
            checked={filterOnStreaming}
          />
          <label htmlFor="streaming-filter">
            Only display shows on my streaming services
          </label>
        </div>
      </Filters>
    </div>
    <div className="shows">
      {
        filteredWatchlist.map(item => (
          <ShowToAdd
            key={item.id}
            show={item.show}
            addShow={async () => {
              const showProgress = await Trakt.getShowProgress(item.show.ids.trakt);
              addNewShow({
                addedFromSearch: true,
                title: item.show.title,
                ids: item.show.ids,
                aired: item.show.aired_episodes,
                completed: showProgress.completed,
                last_watched_at: showProgress.last_watched_at,
                reset_at: Trakt.showResetAt(showProgress),
                seasons: showProgress.seasons,
              });
              setWatchlist(watchlist.filter(wlitem => wlitem.id !== item.id));
              history.push("/");
            }}
            alreadyPresent={false}
            streamingServices={myServices}
          />
        ))
      }
    </div>
  </>);
}

export default Watchlist;