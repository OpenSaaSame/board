import "./Session.scss"

import jwtDecode from 'jwt-decode';

import React, { Component } from "react";
import { Title } from "react-head";

import { connect } from "react-redux";

import { login } from "../../reducers/index";
import { queueRead } from "../../middleware/persistMiddleware";

import Header from "../Header/Header";


const isLocalhost = window.location.hostname === "localhost";

function getTokenParty(jwt) {
    if (!jwt || jwt.split('.').length !== 3) {
        return null;
    }

    const apiBlock = jwtDecode(jwt)["https://daml.com/ledger-api"];

    if (apiBlock && apiBlock['actAs']) {
        return apiBlock['actAs'][0];
    }

    return null;
}

class LogIn extends Component {

  constructor() {
    super();
    this.state = {
      token: "",
      loading: false,
      showAdvanced: false
    };
  }

  handleLogin = (party, token) => {
    const { login, queueRead } = this.props;

    this.setState({loading: true});

    login(party, token);
    queueRead();
  };

  handleSubmit = (event) => {
    event.preventDefault();
      const { token } = this.state;

      const party = getTokenParty(token);

    localStorage.setItem('party', party);
    localStorage.setItem('token', token);

    this.handleLogin(party, token);
  };

  componentDidMount = () => {
    const party = localStorage.getItem('party');
    const token = localStorage.getItem('token');
    if (party && token) {
      this.handleLogin(party, token);
    }
  };

  dablLogInButtonUrl = () => {
    let host = window.location.host.split('.')
    const ledgerId = host[0]
    let loginUrl = host.slice(1)
    loginUrl.unshift('login')

    return 'https://' + loginUrl.join('.') + (window.location.port ? ':' + window.location.port : '')
        + '/auth/login?ledgerId=' + ledgerId
  };

  render = () => {
      const { token, loading, showAdvanced } = this.state;

      const party = getTokenParty(token);

   return (
      <>
        <Title>Home | OpenWork</Title>
        <Header />
        <div className="home">
          <div className="main-content">
            <div className="login-panel">
             { !isLocalhost &&
                 <>
                    <a
                      href={this.dablLogInButtonUrl()}
                      className="dabl-login"
                      disabled={loading}>
                      Log In with DABL
                    </a>
                    <input
                      name="showAdvanced"
                      type="checkbox"
                      checked={showAdvanced}
                      onChange={() => this.setState({ showAdvanced: !showAdvanced})} />
                    <label htmlFor="showAdvanced">Advanced Login</label>
               </>}
           { (isLocalhost || showAdvanced) &&
              <form onSubmit={this.handleSubmit} className="session-form">
                  {isLocalhost && <h2>Local Login</h2>}
                  <div className="field">
                    <label htmlFor="token">JWT</label>
                    <textarea
                      id="token"
                      type="password"
                      name="token"
                      cols={60}
                      rows={8}
                      value={token}
                      onChange={(evt) => this.setState({token: evt.target.value})}/>
                  </div>
                  <div className="field">
                    <label htmlFor="party">Party</label>
                    <span id="party">{party}</span>
                  </div>
                  <input
                    type="submit"
                    value={ !loading ? "Log In" : "Logging In…" }
                    disabled={!party || loading}/>
               </form>}
             </div>
           </div>
        </div>
      </>
    );
  };
}


export default connect(null, {
    login,
    queueRead
})(LogIn);
