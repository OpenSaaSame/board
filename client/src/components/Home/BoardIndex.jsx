import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import slugify from "slugify";
import classnames from "classnames";
import BoardAdder from "./BoardAdder";
import "./Home.scss";

class BoardIndex extends Component {
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
    const { boards, listsById, history } = this.props;

    const teamBoards = boards.filter(board => board.isPublic);
    const personalBoards = boards.filter(board => !board.isPublic);

    return (
      <>
        <h2>Your Boards</h2>
        <div className="boards">
          {personalBoards.map(board => (
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
        { teamBoards.length > 0 &&
          <>
            <h2>Team Boards</h2>
            <div className="boards">
              {teamBoards.map(board => (
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
            </div>
          </>
        }
      </>
    );
  };
}

const mapStateToProps = ({ boardsById, listsById, user }) => {
  return {
      boards: Object.keys(boardsById).map(key => boardsById[key]),
      listsById
    }
  };

export default connect(mapStateToProps)(BoardIndex);
