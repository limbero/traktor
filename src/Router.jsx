import React, { Component } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import App from './App.jsx';
import AuthRedirect from './AuthRedirect.jsx';

class Router extends Component {
  render() {
    return (
      <BrowserRouter>
        <div>
          <Route exact path="/" component={App} />
          <Route path="/redirect" component={AuthRedirect} />
        </div>
      </BrowserRouter>
    );
  }
}

export default Router;
