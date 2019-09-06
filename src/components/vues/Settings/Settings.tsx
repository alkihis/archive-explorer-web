import React from 'react';
import classes from './Settings.module.scss';
import { setPageTitle, dateFormatter } from '../../../helpers';
import { AppBar, Toolbar, Typography, Container, Checkbox, FormControlLabel, FormLabel, FormControl, FormGroup, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Tooltip, Avatar } from '@material-ui/core';
import SETTINGS from '../../../tools/Settings';
import IIcon from '@material-ui/icons/Info';

type SettingsState = {
  only_medias: boolean;
  only_videos: boolean;
  download: boolean;
  only_rts: boolean;
  modal_open: boolean;
  pp: boolean;
  sort_reverse_chrono: boolean;
}

export default class Settings extends React.Component<{}, SettingsState> {
  state: SettingsState = {
    only_medias: SETTINGS.only_medias,
    only_videos: SETTINGS.only_videos,
    download: SETTINGS.tweet_dl,
    only_rts: SETTINGS.only_rts,
    modal_open: false,
    pp: SETTINGS.pp,
    sort_reverse_chrono: SETTINGS.sort_reverse_chrono,
  };

  changeMediaState(v: boolean) {
    this.setState({
      only_medias: v
    });
    SETTINGS.only_medias = v;
  }

  changeVideoState(v: boolean) {
    this.setState({
      only_videos: v
    });
    SETTINGS.only_videos = v;
  }

  changeTweetDLState(v: boolean) {
    this.setState({
      download: v
    });
    SETTINGS.tweet_dl = v;
  }

  changeRTState(v: boolean) {
    this.setState({
      only_rts: v
    });
    SETTINGS.only_rts = v;
  }

  changePPState(v: boolean) {
    this.setState({
      pp: v
    });
    SETTINGS.pp = v;
  }

  changeTweetSortReverse(v: boolean) {
    this.setState({
      sort_reverse_chrono: v
    });
    SETTINGS.sort_reverse_chrono = v;
  }

  componentDidMount() {
    setPageTitle("Settings");
  }

  tweetViewSettings() {
    return (
      <FormControl component="fieldset">
        <FormLabel focused style={{marginTop: '1rem', marginBottom: '.5rem'}}>Media settings</FormLabel>
        <FormGroup>
          <FormControlLabel
            value="media"
            control={
              <Checkbox 
                color="primary"
                checked={this.state.only_medias}
                onChange={(_, c) => this.changeMediaState(c)} 
              />
            }
            label="Show only tweets with medias"
            labelPlacement="end"
          />
          
          {/* Tooltip + Checkbox disabled */}
          <div style={{display: 'flex', alignItems: 'center'}}>
            <FormControlLabel
              value="media"
              control={
                <Checkbox 
                  color="primary" 
                  checked={this.state.only_videos}
                  onChange={(_, c) => this.changeVideoState(c)}
                />
              }
              disabled={!!SETTINGS.archive && !SETTINGS.archive.is_gdpr}
              label="Show only tweets with videos or GIFs"
              labelPlacement="end"
            />
            {!!SETTINGS.archive && !SETTINGS.archive.is_gdpr && 
            <Tooltip classes={{
              tooltip: classes.big_text,
              popper: classes.big_text
            }} title="This filter is not available with a classic archive">
              <IIcon className={classes.icon} />
            </Tooltip>}
          </div>
        </FormGroup>

        <FormLabel focused style={{marginTop: '1rem', marginBottom: '.5rem'}}>Tweet settings</FormLabel>
        <FormGroup>
          <FormControlLabel
            value="media"
            control={
              <Checkbox 
                color="primary" 
                checked={this.state.sort_reverse_chrono}
                onChange={(_, c) => this.changeTweetSortReverse(c)}
              />
            }
            label="Sort tweets by more recent"
            labelPlacement="end"
          />

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
                checked={this.state.only_rts}
                onChange={(_, c) => this.changeRTState(c)} 
              />
            }
            label="Show only retweets (hide you own tweets)"
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
      <div style={{ marginBottom: 'calc(5rem + 64px)' }}>
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

        {SETTINGS.expired && <Typography className={classes.expired}>
          Twitter credentials have expired. Please log out and log in again.
        </Typography>}
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
          <Button onClick={() => SETTINGS.logout()} color="secondary">
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
          <Typography variant="h4" className="bold">
            Tweet view
          </Typography>
          <Container>
            {this.tweetViewSettings()}
          </Container>

          {/* <Divider className="divider-big-margin" /> */}

          <Typography variant="h4" className={classes.account_title}>
            Account
          </Typography>
          <Container className={classes.account_container}>
            {this.accountSettings()}
          </Container>
        </Container>
      </div>
    );
  }
}
