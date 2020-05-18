import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Button, Wrapper, Menu } from "react-aria-menubutton";
import { FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import "./Header.scss";

class Header extends Component {
  static propTypes = {
    user: PropTypes.object,
    dispatch: PropTypes.func.isRequired
  };

  handleSignOut = (event) => {
    event.preventDefault();

    localStorage.removeItem('party');
    localStorage.removeItem('token');
    
    const { dispatch } = this.props;
    dispatch({
      type: "LOG_OUT"
    });
    dispatch({
      type: "CANCEL_READ"
    });

    window.location = ("/");
  };

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
            <Wrapper className="sign-out-wrapper">
              <Button className="sign-out-button">
                <FaUserCircle />
              </Button>
              <Menu className="sign-out-menu">
                <button
                  className="signout-button"
                  onClick={this.handleSignOut}
                >
                  <FaSignOutAlt className="signout-icon" fill="#303132" style={{verticalAlign: 'middle'}} />
                  &nbsp;Log Out
                </button>
              </Menu>
            </Wrapper>
          }
        </div>
      </header>
    );
  };
}

const mapStateToProps = ({ loggedIn }) => ({ loggedIn });

export default connect(mapStateToProps)(Header);
