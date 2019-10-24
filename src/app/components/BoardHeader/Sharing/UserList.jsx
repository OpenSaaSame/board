import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import Autocomplete from "react-autocomplete"
import "./UserList.scss";

class UserList extends Component {
  constructor() {
    super();
    this.state = { acValue: '' };
  }

  static propTypes = {
    boardId: PropTypes.string.isRequired,
    allUsers: PropTypes.object.isRequired,
    boardUsers: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired
  };

  filteredUsers = () => {
    const userParties = this.props.boardUsers.map(user => user._1);
    return this.props.allUsers.list.filter(user => !userParties.includes(user.party));
  }

  handleSelect = (val) => {
    this.props.dispatch({
      "type": "ADD_USER",
      "payload": {
          "newUser" : val
        }
    });
    this.setState({ acValue: '' })
  }

  render() {
    return <div className="user-list">
      {this.props.boardUsers.map(user => {
        return (
          <div className="user-list-users" key={user}>
            <span>{this.props.allUsers.byParty[user["_1"]].displayName}</span>
            <span>{user["_2"]}</span>
          </div>
        )
      })}
      <Autocomplete
          getItemValue={(user) => user.party}
          items={this.filteredUsers()}
          renderItem={(user, isHighlighted) =>
              <div style={{ background: isHighlighted ? 'lightgray' : 'white' }}>
                {user.displayName}
              </div>
          }
          value={this.state.acValue}
          onChange={e => this.setState({ acValue: e.target.value })}
          onSelect={this.handleSelect}
      />
  </div>
  } 
}

const mapStateToProps = (state, ownProps) => {
    const { boardId } = ownProps.match.params;
    return {
      boardUsers: state.boardUsersById[boardId].users,
      allUsers: state.users,
      boardId,
    };
  };

export default withRouter(connect(mapStateToProps)(UserList));
