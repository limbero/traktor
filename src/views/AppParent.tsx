import { useEffect, useState } from 'react';
import { BrowserRouter, NavLink, Route } from 'react-router-dom';
import styled from 'styled-components';

import './App.scss';

import ShowsProgress from './ShowsProgress.tsx';
import Watchlist from './Watchlist';
import Trakt from '../apis/Trakt';
import StreamingServices from '../components/StreamingServices.js';
import CircularButton from '../components/elements/CircularButton';
import { useTokenStore } from '../zustand/TokenStoreHook';

const hasHover = window.matchMedia("(hover: hover)").matches;
const isIosPwa = 'standalone' in window.navigator && window.navigator.standalone;
// kudos to https://stackoverflow.com/a/50544192
// Detects if device is in standalone mode

const StreamingPicker = styled.div`
  display: flex;
  flex-flow: column wrap;
  align-content: center;
  gap: 8px 30px;

  text-align: left;
  height: 450px;
  @media only screen and (max-width: 950px) {
    height: 600px;
  }
  @media only screen and (max-width: 750px) {
    height: 900px;
  }
  @media only screen and (max-width: 500px) {
    height: auto;
  }
  margin-bottom: 20px;
`;

const MenuNav = styled.nav`
  margin-bottom: 30px;

  & a {
    display: inline-block;

    margin: 10px;
    padding: 7px 15px 10px;
    border-radius: 3px;

    text-decoration: none;
    color: var(--fg-color);
    background-color: var(--bg-color-2);
    &:hover {
      background-color: var(--bg-color-3);
    }
    &.active {
      color: #FFF;
      background-color: var(--primary-color);
      &:hover {
        background-color: var(--primary-color-2);
      }
    }
  }
`;

const AppParent = () => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  const [showStreamingServices, setShowStreamingServices] = useState<boolean>(false);
  const {token} = useTokenStore();

  useEffect(() => {
    Trakt.token()
      .then(() => {
        setLoggedIn(true);
      })
      .catch(() => {
        setLoggedIn(false);
      });
  }, [token]);

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
          <CircularButton onClick={() => window.location.reload()}>
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
      </header>
      <div id="content">
        {loggedIn ? (
          <BrowserRouter>
            <MenuNav>
              <NavLink exact to="/">Progress</NavLink>
              <NavLink to="/watchlist">Watchlist</NavLink>
            </MenuNav>
            <div>
              <Route exact path="/">
                <ShowsProgress />
              </Route>
              <Route path="/watchlist">
                <Watchlist />
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
