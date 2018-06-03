import React, { Component } from 'react';
import runtimeEnv from '@mars/heroku-js-runtime-env';

import { connect } from "react-redux";
import store from "./store/index";
import { setToken } from "./actions/index";
import Shows from './Shows.jsx';

import './App.css';

const env = runtimeEnv();

const mapStateToAppProps = (state) => {
  return { token: state.token };
};

class Applet extends Component {
  componentDidMount() {
    if (localStorage.getItem('token') === null) {
      return;
    }
    const state = store.getState();
    if (state.token === null) {
      store.dispatch(setToken(JSON.parse(localStorage.getItem('token'))));
    }
  }

  render() {
    let content;
    if (!this.props.token) {
      content = (<p>
        <a className="btn" href={`https://api.trakt.tv/oauth/authorize?response_type=code&client_id=${env.REACT_APP_TRAKT_CLIENT_ID}&redirect_uri=${window.location.origin}/redirect`}>Login</a>
      </p>);
    } else {
      content = <Shows />;
    }
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title"><span role="img" aria-label="tractor icon">🚜</span>Traktor</h1>
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
