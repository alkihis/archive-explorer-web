import React from 'react';
import { Button, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, ExpansionPanel, ExpansionPanelSummary, Typography, ExpansionPanelDetails } from '@material-ui/core';
import { IToken } from '../../../tools/interfaces';
import { CenterComponent, BigPreloader } from '../../../tools/PlacingComponents';
import APIHELPER from '../../../tools/ApiHelper';
import SETTINGS from '../../../tools/Settings';
import { toast } from '../../shared/Toaster/Toaster';
import classes from './ExtendedActions.module.scss';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { dateFormatter } from '../../../helpers';
import LANG from '../../../classes/Lang/Language';

type MState = {
  anchor: HTMLElement;
  modal_token: boolean;
  modal_delete_1: boolean;
  modal_delete_2: boolean;
  delete_preloader: boolean;
  tokens: IToken[] | null;
};

export default class ExtendedActionsMenu extends React.Component<{}, MState> {
  state: MState = {
    anchor: null,
    modal_token: false,
    modal_delete_1: false,
    modal_delete_2: false,
    delete_preloader: false,
    tokens: null,
  };

  handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    this.setState({
      anchor: event.currentTarget
    });
  }

  handleClose = () => {
    this.setState({
      anchor: null
    });
  }

  openGestionToken = () => {
    this.setState({
      anchor: null,
      modal_token: true,
      tokens: null
    });

    APIHELPER.request('users/tokens/show')
      .then(t => {
        this.setState({
          tokens: t
        });
      })
      .catch(() => {
        toast(LANG.unable_load_sessions, "error");
      });
  }

  closeGestionToken = () => {
    this.setState({
      modal_token: false
    });
  }

  openModalOne = () => {
    this.setState({
      anchor: null,
      modal_delete_1: true
    });
  }

  closeModalOne = () => {
    this.setState({
      modal_delete_1: false
    });
  }

  openModalTwo = () => {
    this.setState({
      anchor: null,
      modal_delete_1: false,
      modal_delete_2: true,
      delete_preloader: false
    });
  }

  closeModalTwo = () => {
    this.setState({
      modal_delete_2: false,
      delete_preloader: false
    });
  }

  closeAndDelete = () => {
    // Show preloader
    this.setState({
      delete_preloader: true
    });

    // Delete account
    APIHELPER.request('users/destroy', { method: 'POST' })
      .then(() => {
        localStorage.clear();
        SETTINGS.reload();
      })
      .catch(() => {
        toast(LANG.unable_delete_account, "error");
      });

    // Close modal
    this.closeModalTwo();
  }

  revokeToken(id: string) {
    this.setState({
      tokens: this.state.tokens.filter(t => t.token !== id)
    });

    APIHELPER.request('users/tokens/revoke', { method: 'POST', parameters: { token: id } })
      .catch(() => {
        toast(LANG.unable_revoke_token, "error");
      });
  }

  generateSessions() {
    return this.state.tokens.map((e, index) => (
      <ExpansionPanel className={classes.panel} key={e.token}>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
        >
          <Typography className={classes.heading}>
            Session <span className="bold">{index + 1}</span>
            {"current" in e ? <span className="bold"> ({LANG.current})</span> : ""}
          </Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.details}>
          <Typography>
            {LANG.session_created_on} <span className="bold">{dateFormatter(SETTINGS.lang === "fr" ? "d/m/Y" : "Y-m-d", new Date(e.date))} </span> 
            {LANG.with_ip_address} <span className="bold">{e.login_ip}</span>.
          </Typography>
          <Typography>
            {LANG.last_use_on} <span className="bold">{dateFormatter(SETTINGS.lang === "fr" ? "d/m/Y" : "Y-m-d", new Date(e.last_use))}</span>.
          </Typography>

          <Button color="secondary" onClick={() => this.revokeToken(e.token)} className={classes.revoke_btn}>
            {LANG.revoke}
          </Button>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    ));
  }

  generateBaseSessions() {
    if (this.state.tokens === null) {
      return (
        <CenterComponent className={classes.loader_sessions}>
          <BigPreloader />
        </CenterComponent>
      );
    }
    else if (this.state.tokens.length === 0) {
      return (
        <Typography variant="h6">
          {LANG.no_open_session}.
        </Typography>
      );
    }
    else {
      return this.generateSessions();
    }
  }

  modalGestionToken() {
    return (
      <Dialog
        open={true}
        onClose={this.closeGestionToken}
        classes={{
          paper: classes.dialog
        }}
      >
        <DialogTitle>Sessions</DialogTitle>
        <DialogContent>
          {this.generateBaseSessions()}
        </DialogContent>
        <DialogActions>
          <Button onClick={this.closeGestionToken} color="primary">
            {LANG.close}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  modalDeleteOne() {
    return (
      <Dialog
        open={true}
        onClose={this.closeModalOne}
      >
        <DialogTitle>{LANG.delete_your_account} ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {LANG.delete_account_1_text}
          </DialogContentText>
          <DialogContentText>
            {LANG.delete_account_2_text} <span className="bold">{LANG.sign_in_with_twitter}</span>{LANG.button_delete_account}.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.closeModalOne} color="primary" autoFocus>
            {LANG.cancel}
          </Button>
          <Button onClick={this.openModalTwo} color="secondary">
            {LANG.continue}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  modalDeleteConfirm() {
    const content = <div>
      <DialogTitle>{LANG.delete_your_account} ?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {LANG.confirm_action}.
        </DialogContentText>
        <DialogContentText>
          <span className="bold">{LANG.will_cancel_running_tasks}.</span>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={this.closeModalTwo} color="primary" autoFocus>
          {LANG.cancel}
        </Button>
        <Button onClick={this.closeAndDelete} color="secondary">
          {LANG.delete_account}
        </Button>
      </DialogActions>
    </div>;

    const preloader = <div style={{}}>
      <CenterComponent>
        <BigPreloader />
      </CenterComponent>
    </div>;

    return (
      <Dialog
        open={true}
        onClose={this.closeModalTwo}
      >
        {this.state.delete_preloader ? preloader : content}
      </Dialog>
    );
  }

  render() {
    return (
      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        {this.state.modal_token && this.modalGestionToken()}
        {this.state.modal_delete_1 && this.modalDeleteOne()}
        {this.state.modal_delete_2 && this.modalDeleteConfirm()}

        <Button onClick={this.handleClick} color="primary">
          {LANG.advanced_settings}
        </Button>
        <Menu
          anchorEl={this.state.anchor}
          keepMounted
          open={Boolean(this.state.anchor)}
          onClose={this.handleClose}
        >
          <MenuItem onClick={this.openGestionToken}>{LANG.open_sessions}</MenuItem>
          <MenuItem onClick={this.openModalOne}>{LANG.delete_my_account}</MenuItem>
        </Menu>
      </div>
    );
  }
}