import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import runtimeEnv from '@mars/heroku-js-runtime-env';
import qs from 'qs';
import Helpers from './Helpers';

import store from './store/index';
import { setToken } from './actions/index';

const env = runtimeEnv();

class AuthRedirect extends Component {
  async componentDidMount() {
    const { location } = this.props;
    const getParams = qs.parse(location.search.slice(1));
    const token = await Helpers.fetchJson('https://api.trakt.tv/oauth/token', 'POST', {
      code: getParams.code,
      client_id: env.REACT_APP_TRAKT_CLIENT_ID,
      client_secret: env.REACT_APP_TRAKT_CLIENT_SECRET,
      redirect_uri: `${window.location.origin}/redirect`,
      grant_type: 'authorization_code',
    }, {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    });
    localStorage.setItem('traktor_trakt_token', JSON.stringify(token));
    store.dispatch(setToken(token));
  }

  render() {
    return (
      <Redirect to="/" />
    );
  }
}

export default AuthRedirect;
