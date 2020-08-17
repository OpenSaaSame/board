import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Button, Wrapper, Menu } from "react-aria-menubutton";
import PropTypes from "prop-types";
import { FaInfoCircle } from "react-icons/fa";

class BoardFilter extends Component {

  static propTypes = {
    boardId: PropTypes.string.isRequired,
    boardUsers: PropTypes.array.isRequired,
    allProfiles: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired
  };

  handleSubmit = event => {
    event.preventDefault();
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

  handleChange = event => {
    this.setState({ newAbout: event.target.value });
  };

  radioItem = user => {
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

  render() {
    const { boardUsers } = this.props;

    return (
      <Wrapper
        className="board-about-wrapper"
        onSelection={this.handleSelection}
      >
        <Button className="board-about">
          <FaInfoCircle />
          <div className="board-header-right-text">
            &nbsp;Filters &nbsp;&#9662;
          </div>
        </Button>
        <Menu className="board-about-menu">
          <h3>Users</h3>
          <form onChange={this.handleSubmit}>
            <div>
              <label><input type="radio" name="userFilter" value="" />Show all</label>
            </div>
            { boardUsers.map(user => this.radioItem(user)) }
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
  return { boardId, allProfiles, boardUsers };
};

export default withRouter(connect(mapStateToProps)(BoardFilter));
