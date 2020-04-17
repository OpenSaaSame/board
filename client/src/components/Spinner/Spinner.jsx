
import React from "react";
import { MoonLoader } from "react-spinners";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import FaExclamationTriagle from "react-icons/lib/fa/exclamation-triangle";
import ReactTooltip from 'react-tooltip'
import "./Spinner.scss";

const Spinner = ({user, ledger, loggedIn}) => {
    return (<div className='spinner'>
        <MoonLoader
          color={'rgba(0,0,0,0.8)'}
          loading={loggedIn && user && ledger && (ledger.network.error || ledger.read.inProgress || ledger.read.queued || ledger.write.queue.length > 0 || ledger.write.inProgress) && true}
        />
        {ledger && ledger.network.error && 
            <div className="warning" data-tip="Connection Problem. Retrying." >
                <FaExclamationTriagle  />
                <ReactTooltip />
            </div>
        }
    </div>)
}

Spinner.propTypes = { user: PropTypes.object, ledger: PropTypes.object, loggedIn: PropTypes.bool };

const mapStateToProps = state => ({ user: state.user, ledger: state.ledger, loggedIn: state.loggedIn });

export default connect(mapStateToProps)(Spinner);