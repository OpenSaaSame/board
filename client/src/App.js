import React from "react";

import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import { createLogger } from 'redux-logger';

import { HashRouter } from "react-router-dom";

import rootReducer from "./reducers";


import App from "./components/App";
import persistMiddleware from "./middleware/persistMiddleware";
import { composeWithDevTools } from "redux-devtools-extension";

const store = createStore(
    rootReducer,
    composeWithDevTools(
        applyMiddleware(
            persistMiddleware,
            createLogger({
                collapsed: true
            })
        )
    )
);

// Save fragment in local storage for post-DABL redirect
if (window.location.hash.substring(0, 3) === "#/b") {
  localStorage.setItem('postDablPath', window.location.hash);
}

const urlParams = new URLSearchParams(window.location.search);
const party = urlParams.get("party");
const token = urlParams.get("token");
if (party && token) {
  localStorage.setItem('party', party);
  localStorage.setItem('token', token);
  // Strip query params from the location before rendering the app
  // Grab the saved fragement from local storage
  const fragment = localStorage.getItem('postDablPath') || "";
  window.location = `${window.location.origin}/${fragment}`;
}

function Appl() {
  return (
    <Provider store={store}>
      <HashRouter>
        <App />
      </HashRouter>
    </Provider>
  );
}

export default Appl;
