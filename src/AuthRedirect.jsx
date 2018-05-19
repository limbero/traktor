import React, { Component } from 'react';
import runtimeEnv from '@mars/heroku-js-runtime-env';
import App from './App.jsx';
import qs from 'query-string';

const env = runtimeEnv();

class AuthRedirect extends Component {

  async componentDidMount() {
    const getParams = qs.parse(this.props.location.search);
    let fetched = await fetch('https://api.trakt.tv/oauth/token', {
      method: 'POST',
      body: {
        code: getParams.code,
        client_id: env.REACT_APP_CLIENT_ID,
        client_secret: env.REACT_APP_CLIENT_SECRET,
        redirect_uri: 'http://localhost:3000/redirect',
        grant_type: 'authorization_code'
      }
    });
    console.log(fetched);
  }

  render() {
    return (
      <App />
    );
  }
}

export default AuthRedirect;
