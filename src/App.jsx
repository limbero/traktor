import React, { Component } from 'react';
import runtimeEnv from '@mars/heroku-js-runtime-env';

import store from "./store/index";
import { addShow } from "./actions/index";

import './App.css';

const env = runtimeEnv();

store.dispatch(addShow({ name: 'The Flash', id: 1 }));

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Welcome to Traktor</h1>
          <a href={ `https://api.trakt.tv/oauth/authorize?response_type=code&client_id=${env.REACT_APP_TRAKT_CLIENT_ID}&redirect_uri=http://localhost:3000/redirect` }>Login</a>
        </header>
      </div>
    );
  }
}

export default App;
