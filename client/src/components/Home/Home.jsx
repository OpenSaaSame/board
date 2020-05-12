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
    history: PropTypes.object.isRequired
  };

  render = () => {
    const { history } = this.props;
    
    return (
      <>
        <Title>Home | OpenWork</Title>
        <Header />
        <div className="home">
          <div className="main-content">
            <BoardIndex history={history} />
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
