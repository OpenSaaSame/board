import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Title } from "react-head";
import slugify from "slugify";
import classnames from "classnames";
import Header from "../Header/Header";
import BoardAdder from "./BoardAdder";
import "./Home.scss";

class Home extends Component {
  static propTypes = {
    boards: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired
      }).isRequired
    ),
    listsById: PropTypes.object,
    history: PropTypes.object.isRequired,
    user: PropTypes.object
  };

  constructor() {
    super();
    this.state = {
      party: "",
      jwt: ""
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
    const { boards, listsById, history, user } = this.props;

    return (
      <>
        <Title>Home | OpenWork</Title>
        <Header />
        <div className="home">
          <div className="main-content">
            {user === undefined
            ? <form onSubmit={this.handleSubmit}>
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
            : <>
                <h1>Boards</h1>
                <div className="boards">
                  {boards.map(board => (
                    <Link
                      key={board._id}
                      className={classnames("board-link", board.color)}
                      to={`/b/${board._id}/${slugify(board.title, {
                        lower: true
                      })}`}
                    >
                      <div className="board-link-title">{board.title}</div>
                      <div className="mini-board">
                        {board.lists.map(listId => (
                          <div
                            key={listId}
                            className="mini-list"
                            style={{
                              height: `${Math.min(
                                (listsById[listId].cards.length + 1) * 18,
                                100
                              )}%`
                            }}
                          />
                        ))}
                      </div>
                    </Link>
                  ))}
                  <BoardAdder history={history} />
                </div>
              </>
            }
          </div>
        </div>
      </>
    );
  };
}

const mapStateToProps = ({ boardsById, listsById, user }) => {
  if (user) {
    return {
      boards: Object.keys(boardsById).map(key => boardsById[key]),
      user,
      listsById
    }
  } else {
    return {user}
  }
};

export default connect(mapStateToProps)(Home);
