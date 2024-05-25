import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import styled from 'styled-components';

import Trakt, { genres, User, WatchlistItem } from '../apis/Trakt.js';
import TheMovieDb from '../apis/TheMovieDb.js';

// import StreamButton from '../components/StreamButton.jsx';
import ShowToAdd from '../components/ShowToAdd';
import StreamingServices, { streamingServicesMap } from '../components/StreamingServices.js';
import TraktorStreaming from '../apis/TraktorStreaming.js';

const StreamingPicker = styled.div`
  display: flex;
  flex-flow: column wrap;
  align-content: center;
  gap: 8px 30px;
  height: 450px;
`;

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
function Watchlist({newShows, setNewShows}: {newShows: string[], setNewShows: Function}) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[] | null>(null);

  const [showGenres, setShowGenres] = useState<boolean>(false);
  const [genresFilter, setGenresFilter] = useState<genresBooleanMap | null>(null);

  const [showStreamingServices, setShowStreamingServices] = useState<boolean>(false);
  const [filterOnStreaming, setFilterOnStreaming] = useState<boolean>(false);

  const [streamingServices] = useLocalStorage<streamingServicesMap | null>("traktor-streaming-services", null);
  const [images, setImages] = useState<imagesMap | null>(null);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    (async () => {
      const traktUserPromise = Trakt.getCurrentUser();

      const watchlistItems = await Trakt.getWatchlist();

      const imagePromisesForItems = watchlistItems.map((item) => TheMovieDb.getImage(item.show.ids.tmdb.toString()));
      const streamingLocationPromises = watchlistItems.map((item) => TraktorStreaming.getLocationsForShow(item.show.title));

      const imagesForItems = await Promise.all(imagePromisesForItems);
      const imagesObject: imagesMap = {};
      imagesForItems.forEach((image, idx) => imagesObject[watchlistItems[idx].id] = image);

      const streamingLocations = await Promise.all(streamingLocationPromises);
      const watchlistWithServices = watchlistItems.map((item, idx) => ({
        ...item,
        show: {
          ...item.show,
          streaming_locations: streamingLocations[idx],
        },
      }));

      setWatchlist(watchlistWithServices);
      setUser(await traktUserPromise);
      setImages(imagesObject);
    })();
  }, []);
  useEffect(() => {
    if (watchlist === null) {
      return;
    }
    const newGenresFilter: genresBooleanMap = {};
    const genresFromShows = new Set(watchlist.flatMap(item => item.show.genres));
    Array.from(genresFromShows).sort().forEach(genre => {
      newGenresFilter[genre] = false;
    });
    setGenresFilter(newGenresFilter);
  }, [watchlist])

  if (watchlist === null || images === null || user === null || streamingServices === null || genresFilter === null) {
    return null;
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
    <h1 style={{ textAlign: "center" }}>Watchlist</h1>
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
      <h2
        style={{ textAlign: "center", cursor: "pointer" }}
        onClick={() => setShowStreamingServices(!showStreamingServices)}
      >
        Streaming Services <span style={{ fontSize: "0.5em", verticalAlign: "middle" }}>{showStreamingServices ? "▲" : "▼"}</span>
      </h2>
      <StreamingPicker style={{ display: showStreamingServices ? "flex" : "none" }}>
        <StreamingServices />
      </StreamingPicker>
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
            addShow={() => {
              setNewShows([...newShows, item.show.ids.slug]);
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