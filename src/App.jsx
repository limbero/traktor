import React, { Component } from 'react';
import runtimeEnv from '@mars/heroku-js-runtime-env';
import { connect } from 'react-redux';
import store from './store/index';
import { setToken } from './actions/index';
import Shows from './Shows';
import './App.css';

const hasHover = require('has-hover');

const env = runtimeEnv();

const mapStateToAppProps = state => ({ token: state.token });

class Applet extends Component {
  componentDidMount() {
    if (localStorage.getItem('traktor_trakt_token') === null) {
      return;
    }
    const state = store.getState();
    if (state.token === null) {
      store.dispatch(setToken(JSON.parse(localStorage.getItem('traktor_trakt_token'))));
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
