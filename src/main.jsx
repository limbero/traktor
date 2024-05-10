import ReactDOM from 'react-dom/client';
import './index.css';
import Router from './Router.jsx';
import * as serviceWorker from './serviceWorker.js';
import { SyntheticEvent } from 'react';

ReactDOM.createRoot(document.getElementById('root')).render(
  <Router />,
);

serviceWorker.register({
  // kudos to https://stackoverflow.com/a/58596965
  onUpdate: (registration) => {
    const waitingServiceWorker = registration.waiting;

    if (waitingServiceWorker) {
      waitingServiceWorker.addEventListener('statechange', (event) => {
        if (event.target.state === 'activated') {
          window.location.reload();
        }
      });
      waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  },
});
