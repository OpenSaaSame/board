import React from "react";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";   
import { HashRouter } from "react-router-dom";
import rootReducer from "./reducers";
import App from "./components/App";
import persistMiddleware from "./middleware/persistMiddleware";
import { composeWithDevTools } from "redux-devtools-extension";

const store = createStore(
  rootReducer,
  composeWithDevTools(applyMiddleware(persistMiddleware))
);

const urlParams = new URLSearchParams(window.location.search);
const party = urlParams.get("party");
const token = urlParams.get("token");
if (party && token) {
  localStorage.setItem('party', party);
  localStorage.setItem('token', token);
  // Strip query params from the location before rendering the app
  window.location = `${window.location.origin}/${window.location.hash}`
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
