
import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import "./Upgrade.scss";

const Upgrade = ({dispatch, user}) => {
  let className = "upgrade"
  if (user && !user.needsUpgrade) className += "hide" 
  return <div className={className}>
    You need an upgrade!
  </div>
}

Upgrade.propTypes = { user: PropTypes.object };
const mapStateToProps = state => ({ ledger: state.user });
export default connect(mapStateToProps)(Upgrade);