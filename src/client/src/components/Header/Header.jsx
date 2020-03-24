import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import FaSignIn from "react-icons/lib/fa/sign-in";
import FaSignOut from "react-icons/lib/fa/sign-out";
import googleSignInImg from "../../../assets/images/btn_google_signin_light_normal_web.png";
import googleSignInImg2x from "../../../assets/images/btn_google_signin_light_normal_web@2x.png"
import "./Header.scss";

class Header extends Component {
  static propTypes = { user: PropTypes.object, dispatch: PropTypes.func.isRequired };
  render = () => {
    const { user } = this.props;
    return (
      <header>
        <Link to="/" className="header-title">
          <img src={'/images/openwork.png'} alt="OpenWork logo" />
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
            <a className="" href="/auth/google" >
              <img
                className="google-sign-in"
                alt="Sign in with Google"
                src={googleSignInImg}
                srcSet={`${googleSignInImg} 1x, ${googleSignInImg2x} 2x`}
              />
            </a>
          )}
        </div>
      </header>
    );
  };
}

const mapStateToProps = ({ user }) => ({ user });

export default connect(mapStateToProps)(Header);
