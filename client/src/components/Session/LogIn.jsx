import React, { Component } from "react";
import { Title } from "react-head";
import Header from "../Header/Header";
import { connect } from "react-redux";

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

  render = () => {
    return (
      <>
        <Title>Home | OpenWork</Title>
        <Header />
        <div className="home">
          <div className="main-content">

            <form onSubmit={this.handleLogin}>
              <h1>Login</h1>
              <div>
                <label>Party</label>
              </div>
              <div>
                <input
                  type="text"
                  name="party"
                  onChange={this.handleChange}
                />
              </div>
              <div>
                <label>JWT</label>
              </div>
              <div>
                <input
                  type="password"
                  name="jwt"
                  onChange={this.handleChange}
                />
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