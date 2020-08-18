import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Button, Wrapper, Menu } from "react-aria-menubutton";
import PropTypes from "prop-types";
import { FaFilter } from "react-icons/fa";

class BoardFilter extends Component {

  static propTypes = {
    boardId: PropTypes.string.isRequired,
    boardUsers: PropTypes.array.isRequired,
    allProfiles: PropTypes.object.isRequired,
    boardTags: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired
  };

  handleUserChange = event => {
    const { dispatch, boardId } = this.props;
    const filteredUser = event.target.value;

    if (filteredUser === "") {
      dispatch({
        type: "UNSET_USER_FILTER",
        payload: {
          boardId
        }
      });
    } else {
      dispatch({
        type: "SET_USER_FILTER",
        payload: {
          boardId,
          filteredUser
        }
      });
    }
  };

  handleTagChange = event => {
    const { dispatch, boardId } = this.props;
    const filteredTag = event.target.value;

    if (filteredTag === "") {
      dispatch({
        type: "UNSET_TAG_FILTER",
        payload: {
          boardId
        }
      });
    } else {
      dispatch({
        type: "SET_TAG_FILTER",
        payload: {
          boardId,
          filteredTag
        }
      });
    }
  };

  userRadioItem = user => {
    const { allProfiles } = this.props;
    return (
      <div key={user}>
        <label>
          <input type="radio" id={user} name="userFilter" value={user} />
          {allProfiles[user].displayName}
        </label>
      </div>
    );
  };

  tagRadioItem = tag => {
    return (
      <div key={tag._id}>
        <label>
          <input type="radio" id={tag._id} name="tagFilter" value={tag._id} />
          {tag.name}
        </label>
      </div>
    );
  };

  render() {
    const { boardUsers, boardTags } = this.props;

    return (
      <Wrapper
        className="board-about-wrapper"
        onSelection={this.handleSelection}
      >
        <Button className="board-about">
          <FaFilter />
          <div className="board-header-right-text">
            &nbsp;Filters &nbsp;&#9662;
          </div>
        </Button>
        <Menu className="board-about-menu">
          <h3>Users</h3>
          <form onChange={this.handleUserChange}>
            <div>
              <label><input type="radio" name="userFilter" value="" />Show all</label>
            </div>
            { boardUsers.map(user => this.userRadioItem(user)) }
          </form>
          <h3>Tags</h3>
          <form onChange={this.handleTagChange}>
            <div>
              <label><input type="radio" name="tagFilter" value="" />Show all</label>
            </div>
            { boardTags.map(tag => this.tagRadioItem(tag)) }
          </form>
        </Menu>
      </Wrapper>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { boardId } = ownProps.match.params;
  const allProfiles = state.users.byParty;
  const boardUsers = state.boardUsersById[boardId].users.map(user => user._1);
  const boardTags = state.boardsById[boardId].tags.map(tagId => state.tagsById[tagId]);
  return { boardId, allProfiles, boardUsers, boardTags };
};

export default withRouter(connect(mapStateToProps)(BoardFilter));
