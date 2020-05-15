import React, { Component } from "react";
import { Title } from "react-head";
import Header from "../Header/Header";
import { connect } from "react-redux";
import "./Session.scss"

const isLocalhost = window.location.hostname === "localhost";

class LogIn extends Component {

  constructor() {
    super();
    this.state = {
      party: "",
      token: "",
      showAdvancedAuth: isLocalhost,
      loading: false
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

  handleLogin = (party, token) => {
    const { dispatch } = this.props;
    this.setState({loading: true});

    dispatch({
      'type': 'LOG_IN',
      'payload': { party, token }
    });
    dispatch({
      type: "QUEUE_READ",
      payload: {at : Date.now()}
    });
  };

  handleSubmit = (event) => {
    event.preventDefault();
    const { party, token } = this.state;

    localStorage.setItem('party', party);
    localStorage.setItem('token', token);

    this.handleLogin(party, token);
  };

  toggleForm = () => {
    const { showAdvancedAuth } = this.state;
    this.setState({showAdvancedAuth: !showAdvancedAuth});
  }

  componentDidMount = () => {
    const party = localStorage.getItem('party');
    const token = localStorage.getItem('token');
    if (party && token) {
      this.handleLogin(party, token);
    }
  };

  dablLogInButtonUrl = () => {
    let host = window.location.host.split('.')
    const ledgerId = host[0]
    let loginUrl = host.slice(1)
    loginUrl.unshift('login')

    return 'https://' + loginUrl.join('.') + (window.location.port ? ':' + window.location.port : '')
        + '/auth/login?ledgerId=' + ledgerId
  };

  render = () => {
    const { party, token, showAdvancedAuth, loading } = this.state;

    return (
      <>
        <Title>Home | OpenWork</Title>
        <Header />
        <div className="home">
          <div className="main-content">
            <form onSubmit={this.handleSubmit} className="session-form">
              { !isLocalhost &&
                <>
                  <div>
                    <a
                      href={this.dablLogInButtonUrl()}
                      className="dabl-login"
                      disabled={loading}
                    >
                      { !loading ? "Log In with DABL" : "Logging In…" }
                    </a>
                  </div>
                  <button onClick={this.toggleForm}>
                    Advanced Options {showAdvancedAuth ? "-" : "+"}
                  </button>
                </>
              }
              <div className={!showAdvancedAuth ? "hidden" : ""}>
                <div>
                  <label>
                    Party
                    <input
                      type="text"
                      name="party"
                      value={party}
                      onChange={this.handleChange}
                    />
                  </label>
                </div>
                <div>
                  <label>
                    JWT
                    <input
                      type="password"
                      name="token"
                      value={token}
                      onChange={this.handleChange}
                    />
                  </label>
                </div>
                <input
                  type="submit"
                  value={ !loading ? "Log In" : "Logging In…" }
                  disabled={loading}
                />
              </div>
            </form>
          </div>
        </div>
      </>
    );
  };
}

export default connect()(LogIn);