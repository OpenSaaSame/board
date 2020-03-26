import React from "react";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";   
import { BrowserRouter } from "react-router-dom";
import rootReducer from "./reducers";
import App from "./components/App";
import persistMiddleware from "./middleware/persistMiddleware";
import { composeWithDevTools } from "redux-devtools-extension";

const store = createStore(
  rootReducer,
  composeWithDevTools(applyMiddleware(persistMiddleware))
);

if (localStorage.getItem('party')) {
  store.dispatch({
    type: "LOG_IN"
  });
  store.dispatch({
    type: "QUEUE_READ",
    payload: {at : Date.now()}
  });
}

const poll = () => {
  store.dispatch({
    type: "QUEUE_READ",
    payload: {at : Date.now()}
  });
}
setInterval(poll, 10000);
poll();

function Appl() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  );
}

export default Appl;
