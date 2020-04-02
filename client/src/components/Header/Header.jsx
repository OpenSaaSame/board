import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import FaSignOut from "react-icons/lib/fa/sign-out";
import "./Header.scss";

class Header extends Component {
  static propTypes = { user: PropTypes.object, dispatch: PropTypes.func.isRequired };

  handleSignOut = (event) => {
    const { dispatch } = this.props;

    dispatch({
      type: "LOG_OUT"
    });
  }

  render = () => {
    const { loggedIn } = this.props;
    return (
      <header>
        <Link to="/" className="header-title">
          <img src={'/images/openwork.png'} alt="OpenWork logo" />
          &nbsp;<b>Open</b>Work <span>Board</span>
        </Link>
        <div className="header-right-side">
          { loggedIn &&
            <button className="signout-link" onClick={this.handleSignOut}>
              <FaSignOut className="signout-icon" fill="#303132" />
              &nbsp;Log Out
            </button>
          }
        </div>
      </header>
    );
  };
}

const mapStateToProps = ({ loggedIn }) => ({ loggedIn });

export default connect(mapStateToProps)(Header);
