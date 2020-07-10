import React from 'react';
import classes from './Settings.module.scss';
import { setPageTitle, dateFormatter, toggleDarkMode } from '../../../helpers';
import { Typography, Container, Checkbox, FormControlLabel, FormControl, FormGroup, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Tooltip, Avatar, InputLabel, Select, MenuItem, Divider } from '@material-ui/core';
import SETTINGS from '../../../tools/Settings';
import IIcon from '@material-ui/icons/Info';
import ExtendedActionsMenu from './ExtendedActionsMenu';
import LANG, { AvailableLanguages, AuthorizedLangs } from '../../../classes/Lang/Language';
import { Copyright } from '../../../tools/PlacingComponents';

type SettingsState = {
  download: boolean;
  modal_open: boolean;
  pp: boolean;
  dark_mode: boolean;
  auto_dark_mode: boolean;
  lang: AuthorizedLangs;
  download_rt: boolean;
  local_medias: boolean;
  local_videos: boolean;
}

export default class Settings extends React.Component<{}, SettingsState> {
  state: SettingsState = {
    download: SETTINGS.tweet_dl,
    modal_open: false,
    pp: SETTINGS.pp,
    dark_mode: SETTINGS.dark_mode,
    auto_dark_mode: SETTINGS.is_auto_dark_mode,
    lang: SETTINGS.lang,
    download_rt: SETTINGS.rt_dl,
    local_medias: SETTINGS.use_tweets_local_medias,
    local_videos: SETTINGS.use_tweets_local_videos,
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

  changeRtDLState(v: boolean) {
    this.setState({
      download_rt: v
    });
    SETTINGS.rt_dl = v;
  }

  changePPState(v: boolean) {
    this.setState({
      pp: v
    });
    SETTINGS.pp = v;
  }

  changeLocalMedias(v: boolean) {
    this.setState({
      local_medias: v
    });
    SETTINGS.use_tweets_local_medias = v;
  }

  changeLocalVideos(v: boolean) {
    this.setState({
      local_videos: v
    });
    SETTINGS.use_tweets_local_videos = v;
  }

  handleDarkModeChange = (_: CustomEvent<boolean>) => {
    this.changeAutoDarkState(SETTINGS.is_auto_dark_mode, false);
  };

  handleLanguageChange = (evt: React.ChangeEvent<{
    value: unknown;
  }>) => {
    const val = evt.target.value;
    this.setState({
      lang: val as AuthorizedLangs
    });
    SETTINGS.lang = val as AuthorizedLangs;
  };

  componentDidMount() {
    setPageTitle(LANG.settings);

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
            label={LANG.download_from_twitter_checkbox}
            labelPlacement="end"
          />

          <FormControlLabel
            value="media"
            control={
              <Checkbox 
                color="primary" 
                checked={this.state.download_rt}
                onChange={(_, c) => this.changeRtDLState(c)}
                disabled={SETTINGS.expired || this.state.download}
              />
            }
            label={LANG.download_rt_from_twitter_checkbox}
            labelPlacement="end"
          />

          <FormControlLabel
            value="medias_show"
            control={
              <Checkbox 
                color="primary" 
                checked={this.state.local_medias}
                onChange={(_, c) => this.changeLocalMedias(c)}
              />
            }
            label={LANG.use_local_medias}
            labelPlacement="end"
          />

          <FormControlLabel
            value="videos_show"
            control={
              <Checkbox 
                color="primary" 
                checked={this.state.local_videos}
                onChange={(_, c) => this.changeLocalVideos(c)}
              />
            }
            label={LANG.use_local_videos}
            labelPlacement="end"
            disabled={!this.state.local_medias}
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
            label={LANG.show_profile_pictures}
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
            {LANG.logout}
          </Button>
        </div>

        <div style={{display: 'flex', alignItems: 'center'}}>
          <Typography>
            {LANG.account_created_on} 
            <span className="bold"> {dateFormatter(SETTINGS.lang === "fr" ? "d/m/Y" : "Y-m-d", new Date(SETTINGS.user.created_at))}</span>.
          </Typography>
          <Tooltip placement="top" classes={{
              tooltip: classes.big_text,
              popper: classes.big_text
            }} title={LANG.thats_all_infos}>
              <IIcon className={classes.icon + " " + classes.account_icon} />
          </Tooltip>
        </div>

        <ExtendedActionsMenu />

        {SETTINGS.expired && <Typography className={classes.expired}>
          {LANG.twitter_credentials_expired}.
        </Typography>}
      </div>
    );
  }

  displaySettings() {
    return (
      <div>
        <FormGroup>
          <FormControl className={classes.formControl}>
            <InputLabel id="lang-select">{LANG.language}</InputLabel>
            <Select
              labelId="lang-select"
              value={this.state.lang}
              onChange={this.handleLanguageChange}
              className={classes.select}
            >
              {Object.entries(AvailableLanguages).map(lang => (
                <MenuItem key={lang[0]} value={lang[0]}>{lang[1]}</MenuItem>  
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            value="auto_dark_mode"
            control={
              <Checkbox 
                color="primary"
                checked={this.state.auto_dark_mode}
                onChange={(_, c) => this.changeAutoDarkState(c)} 
              />
            }
            label={LANG.automatic_dark_mode}
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
            label={LANG.enable_dark_mode}
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
        <DialogTitle id="alert-dialog-title">{LANG.logout}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {LANG.really_want_to_logout}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => this.handleClose()} color="primary" autoFocus>
            {LANG.cancel}
          </Button>
          <Button onClick={() => SETTINGS.logout(true, true)} color="secondary">
            {LANG.logout}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  render() {
    return (
      <div>
        {this.modalLogout()}

        <Container maxWidth="lg" className={classes.root}>
          <Typography variant="h4" className={classes.account_title}>
            {LANG.account}
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
            {LANG.display}
          </Typography>
          <Container className={classes.display_container}>
            {this.displaySettings()}
          </Container>

          <Divider className="divider-big-margin" />

          <Copyright version />
        </Container>
      </div>
    );
  }
}
