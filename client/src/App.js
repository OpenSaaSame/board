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
