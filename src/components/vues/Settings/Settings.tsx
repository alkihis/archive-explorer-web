import React from 'react';
import classes from './Settings.module.scss';
import { setPageTitle, dateFormatter, toggleDarkMode } from '../../../helpers';
import { AppBar, Toolbar, Typography, Container, Checkbox, FormControlLabel, FormControl, FormGroup, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Tooltip, Avatar } from '@material-ui/core';
import SETTINGS from '../../../tools/Settings';
import IIcon from '@material-ui/icons/Info';
import ExtendedActionsMenu from './ExtendedActionsMenu';
import { VERSION } from '../../../const';

type SettingsState = {
  download: boolean;
  modal_open: boolean;
  pp: boolean;
  dark_mode: boolean;
  auto_dark_mode: boolean;
}

export default class Settings extends React.Component<{}, SettingsState> {
  state: SettingsState = {
    download: SETTINGS.tweet_dl,
    modal_open: false,
    pp: SETTINGS.pp,
    dark_mode: SETTINGS.dark_mode,
    auto_dark_mode: SETTINGS.is_auto_dark_mode,
  };

  changeDarkState(v: boolean, refresh_settings = true) {
    this.setState({
      dark_mode: v,
      auto_dark_mode: false
    });

    if (refresh_settings)
      toggleDarkMode(v);
  }

  changeAutoDarkState(v: boolean, refresh_settings = true) {
    if (v) {
      this.setState({
        dark_mode: SETTINGS.dark_mode,
        auto_dark_mode: true
      });
    }
    else {
      this.setState({
        dark_mode: SETTINGS.dark_mode,
        auto_dark_mode: false
      });
    }

    if (refresh_settings) {
      if (v) {
        SETTINGS.dark_mode = null;
      }
      else {
        const actual = SETTINGS.dark_mode;
        SETTINGS.dark_mode = actual;
      }
    }
  }

  changeTweetDLState(v: boolean) {
    this.setState({
      download: v
    });
    SETTINGS.tweet_dl = v;
  }

  changePPState(v: boolean) {
    this.setState({
      pp: v
    });
    SETTINGS.pp = v;
  }

  handleDarkModeChange = (_: CustomEvent<boolean>) => {
    this.changeAutoDarkState(SETTINGS.is_auto_dark_mode, false);
  };

  componentDidMount() {
    setPageTitle("Settings");

    // @ts-ignore
    window.addEventListener('darkmodechange', this.handleDarkModeChange);
  }

  componentWillUnmount() {
    // @ts-ignore
    window.removeEventListener('darkmodechange', this.handleDarkModeChange);
  }

  tweetViewSettings() {
    return (
      <FormControl component="fieldset">
        <FormGroup>
          <FormControlLabel
            value="media"
            control={
              <Checkbox 
                color="primary" 
                checked={this.state.download}
                onChange={(_, c) => this.changeTweetDLState(c)}
                disabled={SETTINGS.expired}
              />
            }
            label="Download tweets from Twitter (gives more accurate infos)"
            labelPlacement="end"
          />

          <FormControlLabel
            value="media"
            control={
              <Checkbox 
                color="primary" 
                checked={this.state.pp}
                onChange={(_, c) => this.changePPState(c)} 
              />
            }
            label="Show profile pictures"
            labelPlacement="end"
          />
        </FormGroup>
      </FormControl>
    );
  }

  accountSettings() {
    return (
      <div>
        <div className={classes.acc_details}>
          <Avatar 
            alt="Twitter avatar" 
            src={SETTINGS.twitter_user.profile_image_url_https.replace('_normal', '')} 
            className={classes.avatar} 
          />
          <div className={classes.tn}>{SETTINGS.twitter_user.name}</div>
          <div className={classes.sn}>@{SETTINGS.twitter_user.screen_name}</div>

          <Button className={classes.logout} onClick={() => this.handleClickOpen()} color="secondary">
            Logout
          </Button>
        </div>

        <div style={{display: 'flex', alignItems: 'center'}}>
          <Typography>
            Account created on 
            <span className="bold"> {dateFormatter("Y-m-d", new Date(SETTINGS.user.created_at))}</span>.
          </Typography>
          <Tooltip placement="top" classes={{
              tooltip: classes.big_text,
              popper: classes.big_text
            }} title="That's all the information we have from you. Archive Explorer doesn't store any other kind of data.">
              <IIcon className={classes.icon + " " + classes.account_icon} />
          </Tooltip>
        </div>

        <ExtendedActionsMenu />

        {SETTINGS.expired && <Typography className={classes.expired}>
          Twitter credentials have expired. Please log out and log in again.
        </Typography>}
      </div>
    );
  }

  displaySettings() {
    return (
      <div>
        <FormGroup>
          <FormControlLabel
            value="auto_dark_mode"
            control={
              <Checkbox 
                color="primary"
                checked={this.state.auto_dark_mode}
                onChange={(_, c) => this.changeAutoDarkState(c)} 
              />
            }
            label="Automatic dark mode"
            labelPlacement="end"
            />

          <FormControlLabel
            value="dark_mode"
            control={
              <Checkbox 
                color="primary"
                checked={this.state.dark_mode}
                onChange={(_, c) => this.changeDarkState(c)} 
                disabled={this.state.auto_dark_mode}
              />
            }
            label="Enable dark mode"
            labelPlacement="end"
          />
        </FormGroup>
      </div>
    );
  }

  handleClickOpen() {
    this.setState({ modal_open: true });
  }

  handleClose() {
    this.setState({ modal_open: false });
  }

  modalLogout() {
    return (
      <Dialog
        open={this.state.modal_open}
        onClose={() => this.handleClose()}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Logout</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Do you want to log out ? You can't use this application again until you're logged in again.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => this.handleClose()} color="primary" autoFocus>
            Cancel
          </Button>
          <Button onClick={() => SETTINGS.logout(true, true)} color="secondary">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  render() {
    return (
      <div>
        {this.modalLogout()}
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" color="inherit">
              Settings
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" className={classes.root}>
          <Typography variant="h4" className={classes.account_title}>
            Account
          </Typography>
          <Container className={classes.account_container}>
            {this.accountSettings()}
          </Container>

          <Typography variant="h4" className={classes.account_title}>
            Tweets
          </Typography>
          <Container className={classes.account_container}>
            {this.tweetViewSettings()}
          </Container>

          <Typography variant="h4" className={classes.account_title}>
            Display
          </Typography>
          <Container className={classes.account_container}>
            {this.displaySettings()}
          </Container>

          <Container className={classes.version}>
            <div className={classes.version_pos}>Archive Explorer version {VERSION}</div>
          </Container>
        </Container>
      </div>
    );
  }
}
