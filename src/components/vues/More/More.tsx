import React from 'react';
import classes from './More.module.scss';
import { isArchiveLoaded } from '../../../helpers';
import SETTINGS from '../../../tools/Settings';
import { AppBar, Toolbar, Typography, Container, Dialog, DialogTitle, DialogContent, DialogActions, Button, DialogContentText, Tabs, Tab } from '@material-ui/core';
import LANG from '../../../classes/Lang/Language';
import Help from './Help';
import Mutes from './Mutes';
import Blocks from './Blocks';
import Followers, { Followings } from './Followers';
import AdAndUserData from './AdAndUserData';
import LegalMentions from './LegalMentions';

type MoreState = {  
  active_tab: number;
};

export default class More extends React.Component<{}, MoreState> {
  state: MoreState = {
    active_tab: 0
  };

  componentDidMount() {
    window.scroll(0, 0);
  }

  get components_for_tabs() : React.ComponentType[] {
    return [
      Help,
      AdAndUserData,
      // Favorites,
      Followers,
      Followings,
      Mutes,
      Blocks,
      LegalMentions,
    ];
  }

  changeActiveTab = (_: any, index: number) => {
    this.setState({
      active_tab: index
    });
  }

  renderTabbar() {
    const enabled = {
      mutes: false,
      blocks: false,
      favorites: false,
      followers: false,
      followings: false,
      ads_and_user_data: false,
    };

    // Check which part is available
    if (isArchiveLoaded() && SETTINGS.archive.is_gdpr) {
      const ar = SETTINGS.archive;
      enabled.mutes = !!ar.mutes.size;
      enabled.blocks = !!ar.blocks.size;
      enabled.followers = !!ar.followers.size;
      enabled.followings = !!ar.followings.size;
      enabled.favorites = ar.favorites.has_extended_favorites;
      enabled.ads_and_user_data = !!(ar.user.personalization || ar.ads.impressions.length || ar.user.screen_name_history.length);
    }

    return (
      <AppBar position="static" className={classes.tabs}>
        <Tabs value={this.state.active_tab} onChange={this.changeActiveTab} variant="scrollable">
          <Tab label={LANG.help} />
          <Tab label={LANG.ads_and_user_data} disabled={!enabled.ads_and_user_data} />
          {/* <Tab label={LANG.favorites} disabled={!enabled.favorites} /> */}
          <Tab label={LANG.followers} disabled={!enabled.followers} />
          <Tab label={LANG.followings} disabled={!enabled.followings} />
          <Tab label={LANG.mutes} disabled={!enabled.mutes} />
          <Tab label={LANG.blocks} disabled={!enabled.blocks} />
          <Tab label={LANG.legal_mentions} />
        </Tabs>
      </AppBar>
    );
  }

  renderCorrectContent() {
    const Comp = this.components_for_tabs[this.state.active_tab];

    if (!Comp) {
      return this.renderTabNotFound();
    }
    return <Comp />;
  }

  renderTabNotFound() {
    return <div>DEBUG: Tab Not Found. This is unexpected.</div>;
  }

  render() {
    return <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" color="inherit">
            {LANG.more}
          </Typography>
        </Toolbar>
      </AppBar>

      {this.renderTabbar()}

      <Container maxWidth="lg" className={classes.root}>
        {this.renderCorrectContent()}
      </Container>
    </div>;
  }
}

export const DeleteModal: React.FC<{ 
  open?: boolean, 
  type: string,
  onClose?: () => void,
  onValidate?: () => void,
  onCancel?: () => void
}> = props => {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
    >
      <DialogTitle>{LANG.delete_all_your} {props.type} ?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {LANG.permanently_remove_your} {props.type} {LANG.from_twitter_account}.{" "}
          {LANG.are_you_sure_you_want} ?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel} color="primary" autoFocus>
          {LANG.cancel}
        </Button>
        <Button onClick={props.onValidate} color="secondary">
          {LANG.start_task}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
