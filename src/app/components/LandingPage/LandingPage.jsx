import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Title } from "react-head";
import googleLogo from "../../../assets/images/google-logo.svg";
import kanbanLogo from "../../../assets/images/kanban-logo.png";
import squid from "../../../assets/images/welcome-squid.svg";
import "./LandingPage.scss";

class LandingPage extends Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired
  };

  enterAsGuest = () => {
    this.props.dispatch({ type: "ENTER_AS_GUEST" });
  };

  render = () => (
    <div className="landing-page">
      <Title>Sign in | Danban</Title>
      <div className="landing-page-background">
        <img
          src={squid}
          alt="background"
        />
      </div>
      <div className="landing-page-info-wrapper">
        <div className="landing-page-info">
          <div className="landing-page-heading">
            <img
              src={kanbanLogo}
              alt="Danban logo"
              className="landing-page-logo"
            />
            &nbsp;
            <h1>Danban</h1>
          </div>
          <p className="landing-page-description">
            An open source kanban application inspired by Trello and backed by DAML. Check out the
            source code on{" "}
            <a
              href="https://github.com/digital-asset/danban"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>.
          </p>
          <div className="signin-buttons">
            <div>
              <a href="/auth/google" className="signin-button google-button">
                <img
                  className="google-logo"
                  src={googleLogo}
                  alt="google logo"
                />
                &nbsp;Sign in with Google
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default connect()(LandingPage);
