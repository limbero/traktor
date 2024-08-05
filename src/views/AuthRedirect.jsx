import React, { useState, useEffect } from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import qs from 'qs';

import Trakt from '../apis/Trakt';

import { useTokenStore } from '../zustand/TokenStore';
import store from '../redux/store';
import { setToken } from '../redux/actions';

const AuthRedirect = () => {
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const tokenStore = useTokenStore();

  useEffect(() => {
    const fetchToken = async () => {
      const { code } = qs.parse(location.search.slice(1));

      let token;
      try {
        token = await Trakt.getTokenFromCode(code);
      } catch (fetchError) {
        setError(fetchError);
        return;
      }
      store.dispatch(setToken(token));
      tokenStore.setToken(token);
      localStorage.setItem('traktor_trakt_token', JSON.stringify(token));
      setAuthed(true);
    };

    fetchToken();
  }, [location]);

  if (!authed && !error) {
    return null;
  }

  return <Redirect to="/" />;
};

export default AuthRedirect;