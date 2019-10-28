import React from "react";
import { Route, Redirect, Switch, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import Home from "./Home/Home";
import BoardContainer from "./Board/BoardContainer";
import "./App.scss";
import Spinner from "./Spinner/Spinner";
import Alert from "./Alert/Alert";

const App = () => {
  return (
      <div className="app">
      <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/b/:boardId" component={BoardContainer} />
          <Redirect to="/" />
        </Switch>
        <Spinner />
        <Alert />
      </div>
  );
};

App.propTypes = { };

const mapStateToProps = state => ({ });

// Use withRouter to prevent strange glitch where other components
// lower down in the component tree wouldn't update from URL changes
export default withRouter(connect(mapStateToProps)(App));
