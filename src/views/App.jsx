import React, { Component } from 'react';
import runtimeEnv from '@mars/heroku-js-runtime-env';
import Shows from '../components/Shows';
import Trakt from '../apis/Trakt';
import './App.scss';

import CircularButton from '../components/elements/CircularButton';

const hasHover = require('has-hover');

const env = runtimeEnv();

// kudos to https://stackoverflow.com/a/50544192
// Detects if device is in standalone mode
function isIosPwa() {
  return 'standalone' in window.navigator && window.navigator.standalone;
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedIn: false,
    };
  }

  componentDidMount() {
    Trakt.token()
      .then(() => {
        this.setState((prevState) => ({ ...prevState, loggedIn: true }));
      })
      .catch(() =>
        this.setState((prevState) => ({ ...prevState, loggedIn: false }))
      );
  }

  render() {
    const { loggedIn } = this.state;
    return (
      <div className={`app${hasHover ? '' : ' no-hover'}`}>
        {isIosPwa() ? (
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
            <Shows hasHover={hasHover} />
          ) : (
            <p>
              <a
                className="btn"
                href={`https://api.trakt.tv/oauth/authorize?response_type=code&client_id=${env.REACT_APP_TRAKT_CLIENT_ID}&redirect_uri=${window.location.origin}/redirect`}
              >
                Login
              </a>
            </p>
          )}
        </div>
      </div>
    );
  }
}

export default App;
