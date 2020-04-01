import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Title } from "react-head";
import Header from "../Header/Header";
import BoardIndex from "./BoardIndex";
import "./Home.scss";

class Home extends Component {
  static propTypes = {
    boards: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired
      }).isRequired
    ).isRequired,
    listsById: PropTypes.object,
    history: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      name: ""
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

    const { dispatch, user } = this.props;
    const { name } = this.state;

    dispatch({
      'type': 'PutProfile',
      payload: {
        displayName: name,
        party: user.party
      }
    });
  }

  render = () => {
    const { user, history } = this.props;
    
    const profileForm = <form onSubmit={this.handleProfileSubmit}>
        <h1>Profile Details</h1>
        <div>
          <label>Name</label>
        </div>
        <div>
          <input
            type="text"
            name="name"
            onChange={this.handleChange}
          />
        </div>
        <input
          type="submit"
          value="Submit"
        />
      </form>;
    
    return (
      <>
        <Title>Home | OpenWork</Title>
        <Header />
        <div className="home">
          <div className="main-content">
            { !user.displayName ? profileForm : <BoardIndex history={history}/> }
          </div>
        </div>
      </>
    );
  };
}

const mapStateToProps = ({ boardsById, listsById, user }) => ({
  boards: Object.keys(boardsById).map(key => boardsById[key]),
  user,
  listsById
});

export default connect(mapStateToProps)(Home);
