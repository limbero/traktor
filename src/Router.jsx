import React from 'react';
import qs from 'qs';
import { Provider } from 'react-redux';
import App from './views/App';
import AuthRedirect from './views/AuthRedirect';

import store from './redux/store';

const Router = () => {
  const { code } = qs.parse(window.location.search.slice(1));
  if (code) {
    return (<Provider store={store}><AuthRedirect location={window.location}/></Provider>);
  } else {
    return (<Provider store={store}><App /></Provider>);
  }
};

export default Router;
