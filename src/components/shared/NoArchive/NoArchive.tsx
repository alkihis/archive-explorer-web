import React from 'react';
import { CenterComponent } from '../../../tools/PlacingComponents';
import BlockIcon from '@material-ui/icons/Block';
import classes from './NoArchive.module.scss';
import { Typography } from '@material-ui/core';
import { Link } from 'react-router-dom';

export default class NoArchive extends React.Component {
  render() {
    return (
      <div className="center-absolute">
        <CenterComponent className={classes.text_lighten}>
          <BlockIcon className={classes.icon} />
          <Typography variant="h3" style={{marginTop: "1rem", marginBottom: ".7rem"}}>
            Archive is not loaded
          </Typography>
          <Typography variant="h6">
            Please load an valid archive in <Link to="/" className={classes.archive_link}>
              <Typography variant="inherit" color="primary">
                Archive page
              </Typography>
            </Link>.
          </Typography>
        </CenterComponent>
      </div>
    )
  }
}
