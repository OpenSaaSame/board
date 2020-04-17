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

  handleLogin = (event) => {
    const { dispatch } = this.props;
    const { party, jwt } = this.state;
    localStorage.setItem('party', party);
    localStorage.setItem('jwt', jwt);
    event.preventDefault();

    dispatch({
      'type': 'LOG_IN'
    });
  }

  componentWillMount = () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("party") && urlParams.get("token")) {
      this.setState({
        party: urlParams.get("party"),
        jwt: urlParams.get("token")
      });
    }
  };

  render = () => {
    const { party, jwt } = this.state;

    return (
      <>
        <Title>Home | OpenWork</Title>
        <Header />
        <div className="home">
          <div className="main-content">

            <form onSubmit={this.handleLogin}>
              <h2>Log In</h2>
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