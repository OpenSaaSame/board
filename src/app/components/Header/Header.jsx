import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import FaSignOut from "react-icons/lib/fa/sign-out";
import openworkLogo from "../../../assets/images/openwork.png";
import "./Header.scss";

class Header extends Component {
  static propTypes = { user: PropTypes.object, dispatch: PropTypes.func.isRequired };
  render = () => {
    const { user } = this.props;
    return (
      <header>
        <Link to="/" className="header-title">
          <img src={openworkLogo} alt="OpenWork logo" />
          &nbsp;<b>Open</b>Work <span>Board</span>
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
            <div />
          )}

          {user ? (
            <a className="signout-link" href="/auth/signout" >
              <FaSignOut className="signout-icon" fill="#303132" />
              &nbsp;Sign out
            </a>
          ) : (
            <a className="signout-link" href="/auth/google" >
              <FaSignIn className="signout-icon" fill="#303132" />
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
