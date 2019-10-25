import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import classnames from "classnames";
import { Button, Wrapper, Menu, MenuItem } from "react-aria-menubutton";
import FaCheck from "react-icons/lib/fa/check";
import FaEye from "react-icons/lib/fa/eye";
import FaTrash from "react-icons/lib/fa/trash";
import FaPencil from "react-icons/lib/fa/pencil";
import FaCog from "react-icons/lib/fa/cog";
import FaGavel from "react-icons/lib/fa/gavel";
import FaAngleDown from "react-icons/lib/fa/angle-down";
import "./User.scss";

class User extends Component {
  constructor() {
    super();
  }

  static propTypes = {
    boardId: PropTypes.string.isRequired,
    user: PropTypes.object.isRequired,
    access: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired
  };

  handleSelection = newAccess => {
    const { dispatch, boardId, user, access } = this.props;
    // Dispatch update only if selected color is not the same as current board color.
    if(newAccess === "Trash")
      dispatch({ type: "REMOVE_USER", payload: { boardId, user: user.party} });
    else if (newAccess !== access) {
      dispatch({ type: "CHANGE_PERMISSIONS", payload: { boardId, user: user.party, access: newAccess} });
    }
  };


  render() {
    const rights = {
      "Trash": {icon: <FaTrash />, text: "Remove"}, 
      "Read": {icon: <FaEye />, text: "Read"},
      "Write": {icon: <FaPencil />, text: "Write"},
      "Admin": {icon: <FaCog />, text: "Admin"},
      "SignedAdmin": {icon: <FaGavel />, text: "Signatory"}
    }
    const user = this.props.user;
    return <div className="user">
      <img
        src={user.imageUrl}
        alt={user.email || user.displayName}
        className="user-thumbnail"
        />
      <span className="user-name">{user.email || user.displayName}</span>
      <Wrapper
        className="user-rights-wrapper"
        onSelection={this.handleSelection}
      >
        <Button className="user-rights-picker">
          {rights[this.props.access].icon}
          <FaAngleDown className="angle-down" />
        </Button>
        <Menu className="user-rights-menu">
          {Object.keys(rights).map(right => (
            <MenuItem
              value={right}
              className={classnames("user-rights-item", right, right === this.props.access ? "active" : "inactive")}
              key={right}
            >
              {rights[right].icon}
              <span className="description">{rights[right].text}</span>
            </MenuItem>
          ))}
        </Menu>
      </Wrapper>
    </div>
  } 
}

const mapStateToProps = (state, ownProps) => {
    const { boardId } = ownProps.match.params;
    return {
      access: ownProps.access,
      user: ownProps.user,
      boardId
    };
  };

export default withRouter(connect(mapStateToProps)(User));
