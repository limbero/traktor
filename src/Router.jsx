import React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import AppParent from './views/AppParent';
import AuthRedirect from './views/AuthRedirect';

import store from './redux/store';

const Router = () => (
  <Provider store={store}>
    <BrowserRouter>
      <div>
        <Route path="/redirect" component={AuthRedirect} />
        <Route path="*" component={AppParent} />
      </div>
    </BrowserRouter>
  </Provider>
);

export default Router;
