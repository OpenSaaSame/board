import React, { Component } from "react";
import { Title } from "react-head";
import { connect } from "react-redux";

import Header from "../Header/Header";

import { createUserSession, queueRead } from "../../middleware/persistMiddleware";

import "./Session.scss"

class Registration extends Component {
  constructor() {
    super();
    this.state = {
      submitted: false,
      displayName: "",
      email: ""
    };
  }

  handleChange = (event) => {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  };

  handleProfileSubmit = (event) => {
    event.preventDefault();
    this.setState({submitted: true});

    const { user, queueRead } = this.props;
    const { displayName, email } = this.state;

    createUserSession(user.token, user.party, email, displayName)
          .then(() => {
              /* Reduce session creation latency. This has to be done
               * on a delay to account for the fact that the user is
               * not fully registered until a bot has fired in
               * response to the createUserSession call. Longer term,
               * the streaming websocket API will fix more reliably
               * this without the explicit sleep.
               */
              setTimeout(() => { queueRead(); }, 500);
          });
  };

  render = () => {
    const { displayName, email, submitted } = this.state;
    return (
      <>
        <Title>Home | OpenWork</Title>
        <Header />
        <div className="home">
          <div className="main-content">
            <form onSubmit={this.handleProfileSubmit} className="session-form">
              <h2>Register Your Profile</h2>
              <div>
                <label>
                  Name
                  <input
                    type="text"
                    name="displayName"
                    value={displayName}
                    onChange={this.handleChange}
                  />
                </label>
              </div>
              <div>
                <label>
                  Email
                  <input
                    type="text"
                    name="email"
                    value={email}
                    onChange={this.handleChange}
                  />
                </label>
              </div>
              <input
                type="submit"
                value={!submitted ? "Register" : "Waiting…"}
                disabled={submitted}
              />
            </form>
          </div>
        </div>
      </>
    )
  };
}

const mapStateToProps = ({ user }) => ({ user });

export default connect(mapStateToProps, {
    queueRead
})(Registration);
