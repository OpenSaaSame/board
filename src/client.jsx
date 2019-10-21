import React from "react";
import ReactDOM from "react-dom";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import { composeWithDevTools } from "redux-devtools-extension";
import { BrowserRouter } from "react-router-dom";
import rootReducer from "./app/reducers";
import persistMiddleware from "./app/middleware/persistMiddleware";
import App from "./app/components/App";

// Extract initial redux state received from the server
const preloadedState = window.PRELOADED_STATE;
delete window.PRELOADED_STATE;

const store = createStore(
  rootReducer,
  preloadedState,
  composeWithDevTools(applyMiddleware(persistMiddleware))
);

const poll = () => {
  const state = store.getState();
  if(state.user) {
    fetch(
      "/api/contracts/search",
      {
          "credentials":"include",
          "headers":{
              "accept":"application/json",
              "authorization":"Bearer " + state.user.token,
              "content-type":"application/json",
              "sec-fetch-mode":"cors"
          },
          "method": "POST",
          "body" : JSON.stringify({
              "%templates": [
                {
                  "moduleName": "Danban",
                  "entityName": "Board"
                },
                {
                  "moduleName": "Danban",
                  "entityName": "Column"
                },
                {
                  "moduleName": "Danban",
                  "entityName": "Card"
                }
              ]
          }),
          "mode":"cors"
      }
    )
    .then(response => {
      return response.json();
    })
    .then(contracts => {
      const boards = contracts.result.filter(c => c.templateId.startsWith("Danban:Board")).map(c => c.argument);
      const lists = contracts.result.filter(c => c.templateId.startsWith("Danban:Column")).map(c => c.argument);
      const cards = contracts.result.filter(c => c.templateId.startsWith("Danban:Card")).map(c => c.argument);
      store.dispatch({
        type: "LOAD_DATA",
        payload: {
          boards,
          lists,
          cards
        }
      });
    })
    .catch(err => {
      throw err;
    })
  }
}

setInterval(poll, 5000);
poll();

ReactDOM.hydrate(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
  document.getElementById("app")
);
