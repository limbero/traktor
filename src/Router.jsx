import React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import App from './views/App';
import AuthRedirect from './AuthRedirect';

import store from './redux/store';

const Router = () => (
  <Provider store={store}>
    <BrowserRouter>
      <div>
        <Route exact path="/" component={App} />
        <Route path="/redirect" component={AuthRedirect} />
      </div>
    </BrowserRouter>
  </Provider>
);

export default Router;
