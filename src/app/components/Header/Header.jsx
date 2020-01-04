import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import FaUserSecret from "react-icons/lib/fa/user-secret";
import FaSignOut from "react-icons/lib/fa/sign-out";
import FaSignIn from "react-icons/lib/fa/sign-in";
import openworkLogo from "../../../assets/images/openwork.png";
import "./Header.scss";

class Header extends Component {
  static propTypes = { user: PropTypes.object, dispatch: PropTypes.func.isRequired };
  render = () => {
    const { user } = this.props;
    return (
      <header>
        <Link to="/" className="header-title">
          <img src={openworkLogo} alt="Openwork logo" />
          &nbsp;Openwork
        </Link>
        <div className="header-right-side">
          {user ? (
            <img
              src={user.imageUrl}
              alt={user.displayName}
              className="user-thumbnail"
              title={user.displayName}
            />
          ) : (
            <FaUserSecret className="guest-icon" />
          )}
          {user ? (
            <a className="signout-link" href="/auth/signout">
              <FaSignOut className="signout-icon" />
              &nbsp;Sign out
            </a>
          ) : (
            <a className="signout-link" href="/auth/google">
              <FaSignIn className="signout-icon" />
              &nbsp;Sign in
            </a>
          )}
        </div>
      </header>
    );
  };
}

const mapStateToProps = ({ user }) => ({ user });

export default connect(mapStateToProps)(Header);
