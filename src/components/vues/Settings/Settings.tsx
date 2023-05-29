import React from 'react';
import classes from './Settings.module.scss';
import { setPageTitle, toggleDarkMode } from '../../../helpers';
import { Typography, Container, Checkbox, FormControlLabel, FormControl, FormGroup, InputLabel, Select, MenuItem, Divider } from '@material-ui/core';
import SETTINGS from '../../../tools/Settings';
import LANG, { AvailableLanguages, AuthorizedLangs } from '../../../classes/Lang/Language';
import { Copyright } from '../../../tools/PlacingComponents';

type SettingsState = {
  modal_open: boolean;
  pp: boolean;
  dark_mode: boolean;
  auto_dark_mode: boolean;
  lang: AuthorizedLangs;
  local_medias: boolean;
  local_videos: boolean;
  as_list: boolean;
}

export default class Settings extends React.Component<{}, SettingsState> {
  state: SettingsState = {
    modal_open: false,
    pp: SETTINGS.pp,
    dark_mode: SETTINGS.dark_mode,
    auto_dark_mode: SETTINGS.is_auto_dark_mode,
    lang: SETTINGS.lang,
    local_medias: SETTINGS.use_tweets_local_medias,
    local_videos: SETTINGS.use_tweets_local_videos,
    as_list: SETTINGS.show_explore_as_list,
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

  changeTweetAsListState(v: boolean) {
    this.setState({
      as_list: v
    });
    SETTINGS.show_explore_as_list = v;
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

          <FormControlLabel
            value="aslist"
            control={
              <Checkbox
                color="primary"
                checked={this.state.as_list}
                onChange={(_, c) => this.changeTweetAsListState(c)}
              />
            }
            label={LANG.show_tweets_as_list}
            labelPlacement="end"
          />
        </FormGroup>
      </FormControl>
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

  render() {
    return (
      <div>
        <Container maxWidth="lg" className={classes.root}>
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
