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
  render = () => {
    const { loggedIn, user } = this.props;

    const loggedInRoutes = (
      <>
        <Switch>
          <Route exact path="/registration" component={Registration} />
          { (user && user.registered === false) &&
            <Redirect to="/registration" />
          }
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
      <>
        <Switch>
          <Route exact path="/" component={LogIn} />
          <Redirect to="/" />
        </Switch>
        <Spinner />
      </>
    );

    return (
        <div id="app" className="app">
          { (loggedIn && user.registered !== undefined) ? loggedInRoutes : loggedOutRoutes }
        </div>
    );
  }
};

App.propTypes = { };

const mapStateToProps = ({ loggedIn, user }) => ({ loggedIn, user });

// Use withRouter to prevent strange glitch where other components
// lower down in the component tree wouldn't update from URL changes
export default withRouter(connect(mapStateToProps)(App));
