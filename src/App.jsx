import React, { Component } from 'react';
import runtimeEnv from '@mars/heroku-js-runtime-env';
import Shows from './Shows';
import Trakt from './apis/Trakt';
import './App.css';

const hasHover = require('has-hover');

const env = runtimeEnv();

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedIn: false,
    };
    Trakt.token()
      .then(() => this.setState(prevState => ({ ...prevState, loggedIn: true })))
      .catch(() => this.setState(prevState => ({ ...prevState, loggedIn: false })));
  }

  render() {
    const { loggedIn } = this.state;
    return (
      <div className={`app${(hasHover ? '' : ' no-hover')}`}>
        <header className="app-header">
          <h1 className="app-title">
            <img src="min_traktor.svg" width={64} alt="tractor icon"/>
            Traktor
          </h1>
        </header>
        <div id="content">
          {
            loggedIn
              ? <Shows />
              : (
                <p>
                  <a className="btn" href={`https://api.trakt.tv/oauth/authorize?response_type=code&client_id=${env.REACT_APP_TRAKT_CLIENT_ID}&redirect_uri=${window.location.origin}/redirect`}>
                    Login
                  </a>
                </p>
              )
          }
        </div>
      </div>
    );
  }
}

export default App;
