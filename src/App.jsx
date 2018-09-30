import React, { Component } from 'react';
import runtimeEnv from '@mars/heroku-js-runtime-env';
import { connect } from 'react-redux';
import store from './redux/store';
import { setToken } from './redux/actions';
import Shows from './Shows';
import Trakt from './apis/Trakt';
import './App.css';

const hasHover = require('has-hover');

const env = runtimeEnv();

const mapStateToAppProps = state => ({ token: state.token });

class Applet extends Component {
  static refreshTokenIfNecessaryThenStoreIt(token) {
    const expirationDate = (token.created_at + token.expires_in) * 1000;
    const aDay = 1000 * 60 * 60 * 24;

    if (new Date() > new Date(expirationDate - aDay)) {
      Trakt.refreshToken()
        .then((refreshedToken) => {
          store.dispatch(setToken(refreshedToken));
          localStorage.setItem('traktor_trakt_token', JSON.stringify(refreshedToken));
        });
    } else {
      store.dispatch(setToken(token));
    }
  }

  componentDidMount() {
    if (localStorage.getItem('traktor_trakt_token') === null) {
      return;
    }
    const state = store.getState();
    if (state.token === null) {
      Applet.refreshTokenIfNecessaryThenStoreIt(
        JSON.parse(localStorage.getItem('traktor_trakt_token')),
      );
    } else {
      Applet.refreshTokenIfNecessaryThenStoreIt(state.token);
    }
  }

  render() {
    let content;
    const { token } = this.props;
    if (!token) {
      content = (
        <p>
          <a className="btn" href={`https://api.trakt.tv/oauth/authorize?response_type=code&client_id=${env.REACT_APP_TRAKT_CLIENT_ID}&redirect_uri=${window.location.origin}/redirect`}>
            Login
          </a>
        </p>
      );
    } else {
      content = <Shows />;
    }
    return (
      <div className={`app${(hasHover ? '' : ' no-hover')}`}>
        <header className="app-header">
          <h1 className="app-title">
            <img src="min_traktor.svg" width={64} alt="tractor icon"/>
            Traktor
          </h1>
        </header>
        <div id="content">
          {content}
        </div>
      </div>
    );
  }
}
const App = connect(mapStateToAppProps)(Applet);

export default App;
