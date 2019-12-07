import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";

class CardUser extends Component {
  static propTypes = {
    cardId: PropTypes.string.isRequired,
    allUsers: PropTypes.object.isRequired,
    assignee: PropTypes.string,
    dispatch: PropTypes.func.isRequired
  };

  handleChange = event => {
    const { cardId, dispatch } = this.props;
    if (event.target.value == "None") {
      dispatch({
        type: "REMOVE_CARD_ASSIGNEE",
        payload: {
          cardId
        }
      });
    } else {
      dispatch({
        type: "CHANGE_CARD_ASSIGNEE",
        payload: {
          cardId,
          assignee: event.target.value
        }
      });
    }
  };

  render() {
    const { allUsers, assignee } = this.props;
    const users = [{party: "None", email: "None"}, ... allUsers.list ];
    const userList = users.map(user => {
      return <option key={user.party} value={user.party}>{user.email}</option>
    });

    return  <div>
              <div>
                {allUsers.byParty[assignee] ? allUsers.byParty[assignee].email : "Not assigned"}
              </div>
              <select value={assignee} onChange={this.handleChange}>
                {userList}
              </select>
            </div>
  }
}

const mapStateToProps = (state, ownProps) => {
  return {... ownProps, allUsers: state.users};
}

export default withRouter(connect(mapStateToProps)(CardUser));
