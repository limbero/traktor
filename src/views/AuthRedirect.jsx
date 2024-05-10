import React, { Component } from 'react';
import qs from 'qs';
import App from './App';
import Trakt from '../apis/Trakt';

import store from '../redux/store';
import { setToken } from '../redux/actions';

class AuthRedirect extends Component {
  constructor(props) {
    super(props);
    this.state = {
      authed: false,
      error: false,
    };
  }

  async componentDidMount() {
    const { location } = this.props;
    const { code } = qs.parse(location.search.slice(1));

    let token;
    try {
      token = await Trakt.getTokenFromCode(code);
    } catch (fetchError) {
      this.setState((prevState) => ({
        ...prevState,
        error: fetchError,
      }));
      return;
    }
    store.dispatch(setToken(token));
    localStorage.setItem('traktor_trakt_token', JSON.stringify(token));
    this.setState((prevState) => ({ ...prevState, authed: true }));
  }

  render() {
    const { authed, error } = this.state;
    if (!authed && !error) {
      return null;
    }
    return <App />;
  }
}

export default AuthRedirect;
