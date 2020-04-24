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
  handleLogin = (party, jwt) => {
    const { dispatch } = this.props;
    localStorage.setItem('party', party);
    localStorage.setItem('jwt', jwt);

    dispatch({
      'type': 'LOG_IN'
    });
    dispatch({
      type: "QUEUE_READ",
      payload: {at : Date.now()}
    });
  };

  componentWillMount() {
    this.timer = setInterval(()=> this.readLedger(), 10000);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("party") && urlParams.get("token")) {
      const party = urlParams.get("party")
      const jwt = urlParams.get("token")
      console.log("params!", party);
      this.handleLogin(party, jwt);
    }
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
        <Switch>
          <Route exact path="/" component={Registration} />
          <Redirect to="/" />
        </Switch>
        <Spinner />
      </>
    );

    const loggedInRoutes = (
      <>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/b/:boardId" component={BoardContainer} />
        </Switch>
        <Spinner />
        <Alert />
        <Upgrade />
      </>
    );

    const loggedOutRoutes = (
      <>
        <Switch>
          <Route exact path="/" component={LogIn} />
          <Redirect to="/" />
        </Switch>
      </>
    );

    var routes;
    if (!loggedIn) {
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
