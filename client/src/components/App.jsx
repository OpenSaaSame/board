import "./App.scss";

import React, { Component } from "react";
import { Route, Redirect, Switch, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { HeadProvider } from "react-head";

import { queueRead } from "../middleware/persistMiddleware";

import Home from "./Home/Home";
import BoardContainer from "./Board/BoardContainer";

import Spinner from "./Spinner/Spinner";
import Alert from "./Alert/Alert";
import Upgrade from "./Upgrade/Upgrade";
import LogIn from "./Session/LogIn";
import Registration from "./Session/Registration";

class App extends Component {
  componentDidMount() {
      this.timer = setInterval(() => {
          this.props.queueRead();
      }, 15000);
  }

  componentWillUnmount() {
    this.timer = null;
  }

  render = () => {
    const { loggedIn, user } = this.props;

    const registrationNeededRoutes = (
      <>
        <Registration />
        <Spinner />
      </>
    );

    const upgradeNeededRoutes = (
      <>
        <Upgrade />
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
      </>
    );

    const loggedOutRoutes = (
      <LogIn />
    );

    let routes;
    if (!loggedIn || user.registered === undefined) {
      routes = loggedOutRoutes;
    } else if (loggedIn && user.needsUpgrade) {
      routes = upgradeNeededRoutes;
    } else if (loggedIn && user.registered === false) {
      routes = registrationNeededRoutes;
    } else {
      routes = loggedInRoutes;
    }

    return (
      <div id="app" className="app">
        <HeadProvider>
          { routes }
        </HeadProvider>
      </div>
    );
  }
};

App.propTypes = { };

const mapStateToProps = ({ loggedIn, user }) => ({ loggedIn, user });

// Use withRouter to prevent strange glitch where other components
// lower down in the component tree wouldn't update from URL changes
export default withRouter(connect(mapStateToProps, {
    queueRead
})(App));
