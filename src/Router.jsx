import React, { Component } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import App from './App.jsx';
import AuthRedirect from './AuthRedirect.jsx';

import { Provider } from "react-redux";
import store from "./store/index";

class Router extends Component {
  render() {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <div>
            <Route exact path="/" component={App} />
            <Route path="/redirect" component={AuthRedirect} />
          </div>
        </BrowserRouter>
      </Provider>
    );
  }
}

export default Router;
