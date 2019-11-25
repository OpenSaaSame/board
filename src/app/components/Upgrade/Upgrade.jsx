
import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { upgrade } from "../../middleware/persistMiddleware"
import "./Upgrade.scss";

const confirmUpgrade = user => {
  upgrade(user)
  .then(() => location.reload())
  .catch(err => {
    console.log(err);
  })
}

const skipUpgrade = dispatch => {
  dispatch({
    type: "SKIP_UPGRADE",
    payload: {}
  })
}

const Upgrade = ({dispatch, user}) => {
  let className = "upgrade"
  if (!user || !user.needsUpgrade || user.skippedUpgrade) className += "hide" 
  return <div className={className}>
    <div className="upgrade-modal">
      <h1>It's Upgrade Time!</h1>
      <p>
        You've been invited to upgrade your DAML data and rules to {user && user.version}.
      </p>
      <p>
        You can choose not to upgrade, but all boards you are a signatory on will become read-only, and this UI may stop working for old boards without notice.
      </p>
      <p>
        Please refer to the <a href="https://www.github.com/digital-asset/danban">github repo</a> for details about this upgrade.
      </p>
      <div className="buttons">
        <span className="skip-button" onClick={() => skipUpgrade(dispatch)}>Not yet</span>
        <span className="confirm-button" onClick={() => confirmUpgrade(user)}>Upgrade</span>
      </div>
    </div>
  </div>
}

Upgrade.propTypes = { user: PropTypes.object };
const mapStateToProps = state => ({ user: state.user });
export default connect(mapStateToProps)(Upgrade);