import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import AppParent from './views/AppParent';
import AuthRedirect from './views/AuthRedirect';

import store from './redux/store';

const Router = () => (
  <Provider store={store}>
    <BrowserRouter>
      <div>
        <Switch>
          <Route path="/redirect" component={AuthRedirect} />
          <Route path="*" component={AppParent} />
        </Switch>
      </div>
    </BrowserRouter>
  </Provider>
);

export default Router;
