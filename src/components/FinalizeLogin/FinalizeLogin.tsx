import React from 'react';
import './FinalizeLogin.scss';
import { RouteComponentProps } from 'react-router';
import { BigPreloader, CenterComponent, internalError } from '../../tools/PlacingComponents';
import { setPageTitle } from '../../helpers';
import { Typography } from '@material-ui/core';
import APIHELPER from '../../tools/ApiHelper';
import SETTINGS from '../../tools/Settings';
import LANG from '../../classes/Lang/Language';

export default class FinalizeLogin extends React.Component {
  state: { in_load: boolean, failed: boolean, has_token: boolean };

  protected save_token_secret = localStorage.getItem("save_token_secret");
  protected oauth_token: string;
  protected oauth_verifier: string;
  protected oauth_denied: string;

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
      if ('denied' in params) {
        this.oauth_denied = params.denied;
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
          {LANG.check_account_wait}
        </Typography>
      </div>
    );
  }

  renderDenied() {
    return internalError(LANG.aborted_login, LANG.aborted_login_more, true);
  }

  renderTokenMiss() {
    return internalError(LANG.missing_token, LANG.missing_token_more, true);
  }

  renderFailed() {
    return internalError(LANG.invalid_request, LANG.invalid_request_more, true);
  }

  render() {
    let content: string | JSX.Element = "";

    if (this.state.has_token) {
      if (this.state.in_load) {
        content = this.renderWaiting();
      }
      else {
        content = this.renderFailed();
      }
    }
    else if (this.oauth_denied) {
      content = this.renderDenied();
    }
    else {
      content = this.renderTokenMiss();
    }

    return (
      <div className="FinalizeLogin">
        <CenterComponent style={{height: '100vh'}}>
          {content}
        </CenterComponent>
      </div>
    );
  }
}
