import React from 'react';
import classes from './DirectMessages.module.scss';
import { setPageTitle, isArchiveLoaded } from '../../../helpers';
import MailIcon from '@material-ui/icons/Mail';
import SETTINGS from '../../../tools/Settings';
import NoArchive from '../../shared/NoArchive/NoArchive';
import NoGDPR from '../../shared/NoGDPR/NoGDPR';
import { Conversation } from 'twitter-archive-reader';
import { Toolbar, AppBar, Typography, Container } from '@material-ui/core';

type DMProps = {

};

type DMState = {
  /** Selected conversation */
  conversation: Conversation | null;

  /** Sort mode */
  sort_mode: "asc" | "desc" | "count";

  /** Groups groups together */
  separate_single_groups: boolean;
};

export default class DirectMessages extends React.Component<DMProps, DMState> {
  state: DMState = {
    conversation: null,
    sort_mode: "count",
    separate_single_groups: true
  };

  componentDidMount() {
    setPageTitle("Direct messages");
  }

  render() {
    if (!isArchiveLoaded()) {
      return <NoArchive />;
    }

    if (!SETTINGS.archive.is_gdpr) {
      return <NoGDPR 
        icon={MailIcon} 
        message="Loaded archive does not support direct messages." 
      />;
    }

    return (
      <div>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" noWrap>
              {this.state.conversation ? "Conversation" : "Direct messages"}
            </Typography>
          </Toolbar>
        </AppBar>
        <Container>
          Hello !
        </Container>
      </div>
    );
  }
}
