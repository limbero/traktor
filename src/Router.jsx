import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import AppParent from './views/AppParent';
import AuthRedirect from './views/AuthRedirect';

const Router = () => (
  <BrowserRouter>
    <Switch>
      <Route path="/redirect" component={AuthRedirect} />
      <Route path="*" component={AppParent} />
    </Switch>
  </BrowserRouter>
);

export default Router;
