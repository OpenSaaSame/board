import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

class UserList extends Component {
  static propTypes = {
    cardId: PropTypes.string.isRequired,
    allUsers: PropTypes.object.isRequired,
    assignee: PropTypes.string,
    dispatch: PropTypes.func.isRequired
  };

  handleChange = event => {
    const { cardId, dispatch } = this.props;
    dispatch({
      type: "CHANGE_CARD_ASSIGNEE",
      payload: {
        cardId,
        assignee: event.target.value
      }
    });
  };

  render() {
    const { allUsers, assignee } = this.props;
    const users = [{party: "None", email: "None"}, ... allUsers.list ];
    const userList = users.map(user => {
      return <option key={user.party} value={user.party}>{user.email}</option>
    });

    return  <div>
              <select value={assignee} onChange={this.handleChange}>
                {userList}
              </select>
            </div>
  }
}

export default connect()(UserList);
