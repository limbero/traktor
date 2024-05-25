import { useEffect, useState } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';

import './App.scss';

import Shows from '../components/Shows';
import Watchlist from './Watchlist';
import Trakt from '../apis/Trakt';
import CircularButton from '../components/elements/CircularButton';

const hasHover = window.matchMedia("(hover: hover)").matches;
const isIosPwa = 'standalone' in window.navigator && window.navigator.standalone;
// kudos to https://stackoverflow.com/a/50544192
// Detects if device is in standalone mode

const AppParent = () => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [newShows, setNewShows] = useState<string[]>([]);

  useEffect(() => {
    Trakt.token()
      .then(() => {
        setLoggedIn(true);
      })
      .catch(() => {
        setLoggedIn(false);
      });
  }, []);


  return (
    <div className={`app${hasHover ? '' : ' no-hover'}`}>
      {isIosPwa ? (
        <div
          style={{
            position: 'absolute',
            top: '27px',
            left: '27px',
          }}
        >
          <CircularButton onClick={() => window.location.reload(true)}>
            <span>&#8635;</span>
          </CircularButton>
        </div>
      ) : null}
      <header className="app-header">
        <h1 className="app-title">
          <img
            src="traktor_3.svg"
            width={64}
            alt="tractor icon"
            style={{ marginRight: '10px' }}
          />
          Traktor
        </h1>
      </header>
      <div id="content">
        {loggedIn ? (
          <BrowserRouter>
            <div>
              <Route exact path="/">
                <Shows hasHover={hasHover} newShows={newShows} />
              </Route>
              <Route path="/watchlist">
                <Watchlist newShows={newShows} setNewShows={setNewShows} />
              </Route>
            </div>
          </BrowserRouter>

        ) : (
          <p>
            <a
              className="btn"
              href={`https://api.trakt.tv/oauth/authorize?response_type=code&client_id=${import.meta.env.VITE_TRAKT_CLIENT_ID}&redirect_uri=${window.location.origin}/redirect`}
            >
              Login
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

export default AppParent;
