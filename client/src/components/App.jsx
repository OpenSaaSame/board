import React, { Component } from "react";
import { Route, Redirect, Switch, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import Home from "./Home/Home";
import BoardContainer from "./Board/BoardContainer";
import "./App.scss";
import Spinner from "./Spinner/Spinner";
import Alert from "./Alert/Alert";
import Upgrade from "./Upgrade/Upgrade";
import LogIn from "./Session/LogIn";
import Registration from "./Session/Registration";

class App extends Component {
  componentWillMount() {
    this.timer = setInterval(()=> this.readLedger(), 10000);
  }

  componentWillUnmount() {
    this.timer = null;
  }

  readLedger = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "QUEUE_READ",
      payload: {at : Date.now()}
    });
  };

  render = () => {
    const { loggedIn, user } = this.props;

    const registrationNeededRoutes = (
      <>
        <Registration />
        <Spinner />
      </>
    );

    const loggedInRoutes = (
      <>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/b/:boardId" component={BoardContainer} />
          <Redirect to="/" />
        </Switch>
        <Spinner />
        <Alert />
        <Upgrade />
      </>
    );

    const loggedOutRoutes = (
      <LogIn />
    );

    var routes;
    if (!loggedIn || user.registered === undefined) {
      routes = loggedOutRoutes;
    } else if (loggedIn && user.registered === false) {
      routes = registrationNeededRoutes;
    } else {
      routes = loggedInRoutes;
    }

    return (
      <div id="app" className="app">
        { routes }
      </div>
    );
  }
};

App.propTypes = { };

const mapStateToProps = ({ loggedIn, user }) => ({ loggedIn, user });

// Use withRouter to prevent strange glitch where other components
// lower down in the component tree wouldn't update from URL changes
export default withRouter(connect(mapStateToProps)(App));
