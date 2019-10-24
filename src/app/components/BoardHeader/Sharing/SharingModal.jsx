import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Button, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import FaShareSquare from "react-icons/lib/fa/share-square";
import Switch from "react-switch";
import UserList from "./UserList"
import "./SharingModal.scss";

class AccessModal extends Component {
  constructor() {
    super();
    this.handleChange = this.handleChange.bind(this);
  }

  static propTypes = {
    boardId: PropTypes.string.isRequired,
    isPublic: PropTypes.bool.isRequired,
    allUsers: PropTypes.object.isRequired,
    users: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired
  };

  handleChange = newPublic => {
    const { dispatch, boardId, isPublic } = this.props;
    // Dispatch update only if selected color is not the same as current board color.
    if (newPublic !== isPublic) {
      dispatch({ type: "TOGGLE_PUBLIC", payload: { boardId } });
    }
  };

  render() {
    return (
      <Wrapper
        className="access-modal-wrapper"
      >
        <Button className="access-modal">
        <FaShareSquare />
          <div className="board-header-right-text">
            &nbsp;Sharing &nbsp;&#9662;
          </div>
        </Button>
        <Menu className="access-modal-menu">
          <label className="access-modal-public">
            <span className="access-modal-public-header">Public</span>
            <Switch onChange={this.handleChange} checked={this.props.isPublic} height={22} className="access-modal-public-switch"/>
          </label>
          <div className="access-modal-users">
            <span className="access-modal-users-header">Users</span>
            <UserList />
          </div>
        </Menu>
      </Wrapper>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { boardId } = ownProps.match.params;
  return {
    isPublic: state.boardsById[boardId].isPublic,
    users: state.boardUsersById[boardId].users,
    allUsers: state.users,
    boardId
  };
};

export default withRouter(connect(mapStateToProps)(AccessModal));
