import React from 'react';
import ReactDOM from 'react-dom';
import * as consts from './const';
import * as helpers from './helpers';
import './index.scss';
import * as serviceWorker from './serviceWorker';
import App from './components/App/App';
import './tools/SavedArchives/SavedArchives';

console.log("Archive Explorer version", consts.VERSION);

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

/// REGISTER DEBUG
window.DEBUG.Helpers = helpers;
