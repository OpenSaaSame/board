import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Button, Wrapper, Menu } from "react-aria-menubutton";
import PropTypes from "prop-types";
import { FaInfoCircle } from "react-icons/fa";
import marked from "marked";
import Textarea from "react-textarea-autosize";
import "./BoardAbout.scss";

class BoardAbout extends Component {

  static propTypes = {
    board: PropTypes.object.isRequired,
    users: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      newAbout: props.board.about,
      editing: false
    };
  }

  handleSubmit = event => {
    event.preventDefault();
    const { newAbout } = this.state;
    const { dispatch, board } = this.props;

    dispatch({
      type: "CHANGE_BOARD_ABOUT",
      payload: {
        boardId: board._id,
        about: newAbout
      }
    });
  };

  handleChange = event => {
    this.setState({ newAbout: event.target.value });
  };

  handleKeyDown = event => {
    if (event.keyCode === 13 && event.shiftKey === false) {
      this.handleSubmit(event);
    }
  };

  toggleEdit = event => {
    this.setState({editing: !this.state.editing});
  }

  render() {
    const { board, users, hasAdmin } = this.props;
    const { newAbout, editing } = this.state;
    const about = board.about;

    const adminContent = (
      <>
        <h2>Description</h2>
        <form onSubmit={this.handleSubmit}>
          { editing ?
            <Textarea
              value={newAbout}
              onChange={this.handleChange}
              onKeyDown={this.handleKeyDown}
              minRows={3}
            />
          :
            <div
              dangerouslySetInnerHTML={{
                __html: marked(about)
              }}
            />
          }
          <div>
            <button onClick={this.toggleEdit}>{ editing ? "Preview" : "Edit"}</button>
            <input type="submit" value="Update" disabled={newAbout === board.about}/>
          </div>
        </form>
      </>
    );

    const aboutContent = (
      <>
        { about !== "" &&
          <h2>Description</h2>
        }
        <div
          dangerouslySetInnerHTML={{
            __html: marked(about)
          }}
        />
      </>
    );

    return (
      <Wrapper
        className="board-about-wrapper"
        onSelection={this.handleSelection}
      >
        <Button className="board-about">
          <FaInfoCircle />
          <div className="board-header-right-text">
            &nbsp;About &nbsp;&#9662;
          </div>
        </Button>
        <Menu className="board-about-menu">
          <h2>{ users.length === 1 ? "Admin" : "Admins"}</h2>
          { users.map(admin => admin.displayName).join(", ") }
          { hasAdmin ? adminContent : aboutContent }
        </Menu>
      </Wrapper>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { boardId } = ownProps.match.params;
  const board = state.boardsById[boardId];

  var admins;
  if (state.boardUsersById[boardId]) {
    admins = state.boardUsersById[boardId].users
      .filter(user => user._2 === "SignedAdmin" || user._2 === "Admin")
      .map(user => user._1);
  } else {
    admins = board.admins
  }
  const adminProfiles = admins.map(admin => state.users.byParty[admin]);

  return {
    board,
    users: adminProfiles
  };
};

export default withRouter(connect(mapStateToProps)(BoardAbout));
