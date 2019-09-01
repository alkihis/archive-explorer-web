import React from 'react';
import classes from './Explore.module.scss';
import { setPageTitle } from '../../../helpers';
import SETTINGS from '../../../tools/Settings';
import NoArchive from '../../shared/NoArchive/NoArchive';

export default class Explore extends React.Component {
  componentDidMount() {
    setPageTitle("Explore");
  }

  render() {
    if (!SETTINGS.archive) {
      return <NoArchive />;
    }

    return (
      <div>
        <div nav-bar></div>
        <div drawer-menu></div>
      </div>
    );
  }
}
