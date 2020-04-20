import React, { Component } from "react";
import { Title } from "react-head";
import Header from "../Header/Header";
import { connect } from "react-redux";
import "./Session.scss"

class LogIn extends Component {

  constructor() {
    super();
    this.state = {
      party: "",
      jwt: "",
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

  handleSubmit = (event) => {
    event.preventDefault();
    const { party, jwt } = this.state;
    this.handleLogin(party, jwt);
  };

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

  componentWillMount = () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("party") && urlParams.get("token")) {
      const party = urlParams.get("party")
      const jwt = urlParams.get("token")
      this.handleLogin(party, jwt);
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
    const { party, jwt } = this.state;

    return (
      <>
        <Title>Home | OpenWork</Title>
        <Header />
        <div className="home">
          <div className="main-content">
            <form onSubmit={this.handleSubmit}>
              <h2>Log In</h2>
              { window.location.hostname !== "localhost" &&
                <a href={this.dablLogInButtonUrl()} className="dabl-login">Log In with DABL</a>
              }
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
                    name="jwt"
                    value={jwt}
                    onChange={this.handleChange}
                  />
                </label>
              </div>
              <input
                type="submit"
                value="Submit"
              />
            </form>
          </div>
        </div>
      </>
    );
  };
}

export default connect()(LogIn);