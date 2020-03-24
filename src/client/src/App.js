import React from "react";
import { createStore } from "redux";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import rootReducer from "./reducers";
import App from "./components/App";

const store = createStore(
  rootReducer,
);

const poll = () => {
  store.dispatch({
    type: "QUEUE_READ",
    payload: {at : Date.now()}
  });
}

setInterval(poll, 30000);
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
