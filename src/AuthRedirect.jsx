import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import qs from 'qs';
import Trakt from './apis/Trakt';

import store from './redux/store';
import { setToken } from './redux/actions';

class AuthRedirect extends Component {
  async componentDidMount() {
    const { location } = this.props;
    const { code } = qs.parse(location.search.slice(1));
    const token = await Trakt.getTokenFromCode(code);
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
