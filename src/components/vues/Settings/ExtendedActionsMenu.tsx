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
        toast("Unable to load sessions. Try again later", "error");
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
        toast("Unable to delete account. Check your network.", "error");
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
        toast("Unable to revoke token. Try again later.", "error");
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
            {"current" in e ? <span className="bold"> (current)</span> : ""}
          </Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.details}>
          <Typography>
            Session created on <span className="bold">{dateFormatter("Y-m-d", new Date(e.date))} </span> 
            with IP address <span className="bold">{e.login_ip}</span>.
          </Typography>
          <Typography>
            Last use on <span className="bold">{dateFormatter("Y-m-d", new Date(e.last_use))}</span>.
          </Typography>

          <Button color="secondary" onClick={() => this.revokeToken(e.token)} className={classes.revoke_btn}>
            Revoke
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
          You don't any open session.
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
            Close
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
        <DialogTitle>Delete your account ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You will be disconnect from every device you've used to explore archives.
            Are you sure you want to continue ?
          </DialogContentText>
          <DialogContentText>
            You can re-create an account later using the <span className="bold">Sign in with Twitter</span> button.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={this.closeModalOne} color="primary" autoFocus>
            Cancel
          </Button>
          <Button onClick={this.openModalTwo} color="secondary">
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  modalDeleteConfirm() {
    const content = <div>
      <DialogTitle>Delete your account ?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Please confirm your action.
        </DialogContentText>
        <DialogContentText>
          <span className="bold">If you currently have running tasks, they will be cancelled.</span>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={this.closeModalTwo} color="primary" autoFocus>
          Cancel
        </Button>
        <Button onClick={this.closeAndDelete} color="secondary">
          Delete account
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
          Advanced settings
        </Button>
        <Menu
          anchorEl={this.state.anchor}
          keepMounted
          open={Boolean(this.state.anchor)}
          onClose={this.handleClose}
        >
          <MenuItem onClick={this.openGestionToken}>Open sessions</MenuItem>
          <MenuItem onClick={this.openModalOne}>Delete my account</MenuItem>
        </Menu>
      </div>
    );
  }
}