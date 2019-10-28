
import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import "./Alert.scss";
import {NotificationContainer, NotificationManager} from 'react-notifications';

const Alert = ({dispatch, ledger}) => {
  if(ledger.write.error) {
    setTimeout(() => {
        NotificationManager.error("Please see console for details.", "Write failed after 10 attempts.", 5000);
        console.log(ledger.write.error);
        dispatch({
            type: "CLEAR_ERROR"
          })
    }, 0);
    
  }
  return (<NotificationContainer />)
}

Alert.propTypes = { ledger: PropTypes.object.isRequired };
const mapStateToProps = state => ({ ledger: state.ledger });
export default connect(mapStateToProps)(Alert);