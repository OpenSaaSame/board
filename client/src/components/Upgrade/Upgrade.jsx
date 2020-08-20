
import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { upgrade } from "../../middleware/persistMiddleware"
import { Title } from "react-head";
import Header from "../Header/Header";

import "./Upgrade.scss";

const confirmUpgrade = async (dispatch, user, upgradeInvite, setLoading) => {
  setLoading(true);
  try{
    upgrade(user, upgradeInvite.version, upgradeInvite.cid);
    dispatch({
      type: "QUEUE_READ",
      payload: {at : Date.now() + 500}
    });
  } catch (err) {
    console.log(err);
  }
};

const humanizedVersion = (v) => v.split(".")[1].replace("_", ".");

const Upgrade = ({dispatch, user, upgradeInvites}) => {
  const [loading, setLoading] = useState(false);
  const latestInvite = upgradeInvites[0];
  
  return (
    <>
      <Title>Home | OpenWork</Title>
      <Header />
      <div className="home">
        <div className="main-content">
          <div className="upgrade">
            <h1>It's Upgrade Time!</h1>
            <p>
              Your workspace operator is requesting that you upgrade the database and workflows to {user && humanizedVersion(user.version)}.
            </p>
            <div className="buttons">
              <span
                className="confirm-button"
                onClick={() => confirmUpgrade(dispatch, user, latestInvite, setLoading)}
                disabled={loading}
              >
                { loading ? "Loading..." : "Upgrade" }
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

Upgrade.propTypes = { user: PropTypes.object, upgradeInvites: PropTypes.object.isRequired };
const mapStateToProps = state => ({ user: state.user, upgradeInvites: state.upgradeInvites });
export default connect(mapStateToProps)(Upgrade);
