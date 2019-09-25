import React from 'react';
import './FinalizeLogin.scss';
import { RouteComponentProps } from 'react-router';
import { BigPreloader, CenterComponent, internalError } from '../../tools/PlacingComponents';
import { setPageTitle } from '../../helpers';
import { Typography } from '@material-ui/core';
import APIHELPER from '../../tools/ApiHelper';
import SETTINGS from '../../tools/Settings';

export default class FinalizeLogin extends React.Component {
  state: { in_load: boolean, failed: boolean, has_token: boolean };

  protected save_token_secret = localStorage.getItem("save_token_secret");
  protected oauth_token: string;
  protected oauth_verifier: string;

  constructor(props: RouteComponentProps) {
    super(props);
    setPageTitle("Login");

    const query_string = props.location.search.split('?')[1];

    if (query_string) {
      const params: { [k: string]: string } = {};

      for (const pair of query_string.split('&')) {
        const [key, value] = pair.split('=', 2);
        params[key] = value;
      }

      if ('oauth_token' in params) {
        this.oauth_token = params.oauth_token;
      }
      if ('oauth_verifier' in params) {
        this.oauth_verifier = params.oauth_verifier;
      }
    }

    this.state = { 
      in_load: true, 
      failed: false,
      has_token: !!this.save_token_secret && !!this.oauth_token && !!this.oauth_verifier
    };
  }

  componentDidMount() {
    // Validating access token
    // console.log(this.state);

    if (this.state.has_token) {
      // Validating...
      const req = APIHELPER.request('users/access', {
        parameters: {
          oauth_token: this.oauth_token,
          oauth_verifier: this.oauth_verifier,
          oauth_token_secret: this.save_token_secret
        },
        method: 'POST',
        auth: false,
        body_mode: 'form-encoded'
      });

      req
        .then((login_data: { status: boolean, token: string }) => {
          SETTINGS.token = login_data.token;
          localStorage.removeItem('save_token_secret');
          window.location.pathname = "/archive/";
        })
        .catch(() => this.setState({ in_load: false, failed: true }));
    }
  }

  renderWaiting() {
    return (
      <div>
        <BigPreloader />
        <Typography color="textPrimary" style={{marginTop: '30px'}}>
          Checking your Twitter account...
        </Typography>
      </div>
    );
  }

  renderTokenMiss() {
    return internalError("Missing token", "In order to authentificate, Twitter need to send some credentials. They're missing.", true);
  }

  renderFailed() {
    return internalError("Invalid request", "Request is invalid, or token has expired. Try to log in again.", true);
  }

  render() {
    return (
      <div className="FinalizeLogin">
        <CenterComponent style={{height: '100vh'}}>
          {this.state.has_token ? (
            this.state.in_load ? 
            this.renderWaiting() :
            this.renderFailed()
          ) : 
            this.renderTokenMiss()
          }
        </CenterComponent>
      </div>
    );
  }
}
