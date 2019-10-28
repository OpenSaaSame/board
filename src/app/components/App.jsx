import React from "react";
import PropTypes from "prop-types";
import { Route, Redirect, Switch, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import Home from "./Home/Home";
import BoardContainer from "./Board/BoardContainer";
import "./App.scss";
import { MoonLoader } from "react-spinners";

const App = ({ user, ledger }) => {
  return (
    <div className="app">
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/b/:boardId" component={BoardContainer} />
        <Redirect to="/" />
      </Switch>
      <div className='spinner'>
        <MoonLoader
          color={'rgba(0,0,0,0.8)'}
          loading={user && (ledger.read.inProgress || ledger.read.queued || ledger.write.queue.length > 0 || ledger.write.inProgress) && true}
        />
      </div> 
    </div>
  );
};

App.propTypes = { user: PropTypes.object };

const mapStateToProps = state => ({ user: state.user, ledger: state.ledger });

// Use withRouter to prevent strange glitch where other components
// lower down in the component tree wouldn't update from URL changes
export default withRouter(connect(mapStateToProps)(App));
