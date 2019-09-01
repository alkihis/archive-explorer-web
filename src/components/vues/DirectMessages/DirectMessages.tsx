import React from 'react';
import classes from './DirectMessages.module.scss';
import { setPageTitle, isArchiveLoaded } from '../../../helpers';
import MailIcon from '@material-ui/icons/Mail';
import SETTINGS from '../../../tools/Settings';
import NoArchive from '../../shared/NoArchive/NoArchive';
import NoGDPR from '../../shared/NoGDPR/NoGDPR';

export default class DirectMessages extends React.Component {
  componentDidMount() {
    setPageTitle("Direct messages");
  }

  render() {
    if (!isArchiveLoaded()) {
      return <NoArchive />;
    }

    if (!SETTINGS.archive.is_gdpr) {
      return <NoGDPR icon={MailIcon} 
        message="Loaded archive does not support direct messages." 
      />;
    }

    return (
      <div>
        <div nav-bar></div>
        <div drawer-menu></div>
      </div>
    );
  }
}
