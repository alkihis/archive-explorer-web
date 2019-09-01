import React from 'react';
import classes from './Search.module.scss';
import { setPageTitle, isArchiveLoaded } from '../../../helpers';
import SETTINGS from '../../../tools/Settings';
import NoArchive from '../../shared/NoArchive/NoArchive';

export default class Search extends React.Component {
  componentDidMount() {
    setPageTitle("Search");
  }

  render() {
    if (!isArchiveLoaded()) {
      return <NoArchive />;
    }

    return (
      <div>
        <div nav-bar></div>
      </div>
    );
  }
}
