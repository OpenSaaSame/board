import React, { Component } from "react";
import { Title } from "react-head";
import Header from "../Header/Header";
import { connect } from "react-redux";
import { createUserSession } from "../../middleware/persistMiddleware";

class Registration extends Component {
  constructor() {
    super();
    this.state = {
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

    const { displayName, email } = this.state;
    const { dispatch, user } = this.props;

    createUserSession(user.token, user.party, email, displayName);
    dispatch({
      type: "QUEUE_READ",
      payload: {at : Date.now()}
    });
  };

  render = () => {
    const { displayName, email } = this.state;
    return (
      <>
        <Title>Home | OpenWork</Title>
        <Header />
        <div className="home">
          <form onSubmit={this.handleProfileSubmit}>
            <h1>Profile Details</h1>
            <div>
              <label>Name</label>
            </div>
            <div>
              <input
                type="text"
                name="displayName"
                value={displayName}
                onChange={this.handleChange}
              />
            </div>
            <div>
              <label>Email</label>
            </div>
            <div>
              <input
                type="text"
                name="email"
                value={email}
                onChange={this.handleChange}
              />
            </div>
            <input
              type="submit"
              value="Submit"
            />
          </form>;
        </div>
      </>
    )
  };
}

const mapStateToProps = ({ user }) => ({ user });

export default connect(mapStateToProps)(Registration);
