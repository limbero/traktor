import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import qs from 'qs';
import Trakt from '../apis/Trakt';

import store from '../redux/store';
import { setToken } from '../redux/actions';

class AuthRedirect extends Component {
  constructor(props) {
    super(props);
    this.state = {
      authed: false
    }
  }

  async componentDidMount() {
    const { location } = this.props;
    const { code } = qs.parse(location.search.slice(1));
    const token = await Trakt.getTokenFromCode(code);
    store.dispatch(setToken(token));
    localStorage.setItem('traktor_trakt_token', JSON.stringify(token));
    this.setState(prevState => ({ ...prevState, authed: true }));
  }

  render() {
    if (!this.state.authed) {
      return null;
    }
    return (
      <Redirect to="/" />
    );
  }
}

export default AuthRedirect;
