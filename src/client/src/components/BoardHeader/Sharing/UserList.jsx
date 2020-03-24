import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import Autocomplete from "react-autocomplete"
import User from "./User"
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
          "boardId": this.props.boardId,
          "newUser" : val
        }
    });
    this.setState({ acValue: '' })
  }

  render() {
    return <div className="user-list">
      <div className="user-list-users">
      {this.props.boardUsers.map(user => 
        <User key={user._1} user={this.props.allUsers.byParty[user._1]} access={user._2} /> 
      )}
      </div>
      <Autocomplete
          getItemValue={(user) => user.party}
          items={this.filteredUsers()}
          shouldItemRender={(item, value) => item.displayName.toLowerCase().includes(value.toLowerCase())
            || (item.email && item.email.toLowerCase().includes(value.toLowerCase()))
          }
          renderItem={(user, isHighlighted) =>
              <div key={user.party} className="item" style={{ background: isHighlighted ? 'lightgray' : 'white' }}>
                <img
                  src={user.imageUrl}
                  alt={user.email || user.displayName}
                  className="user-thumbnail"
                />
                <span className="user-name">{user.email || user.displayName}</span>
              </div>
          }
          value={this.state.acValue}
          onChange={e => this.setState({ acValue: e.target.value })}
          onSelect={this.handleSelect}
          wrapperProps={{
            "className": "user-list-autocomplete"          
          }}
          menuStyle={{
            borderRadius: '3px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '5px',
            fontSize: '90%',
            position: 'fixed',
            overflow: 'auto',
            maxHeight: '50%', // TODO: don't cheat, let it flow to the bottom
          }}
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
