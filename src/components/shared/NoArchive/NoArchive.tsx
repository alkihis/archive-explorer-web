import React from 'react';
import BlockIcon from '@material-ui/icons/Block';
import classes from './NoArchive.module.scss';
import { Typography } from '@material-ui/core';
import { Link } from 'react-router-dom';
import EmptyMessage from '../EmptyMessage/EmptyMessage';

export default function NoArchive() {
  return (
    <EmptyMessage 
      icon={BlockIcon} 
      main={"Archive is not loaded"} 
      second={<div>
        Please load an valid archive in <Link to="/archive/" className={classes.archive_link}>
          <Typography variant="inherit" color="primary">
            Archive page
          </Typography>
        </Link>.
      </div>}
    />
  );
}
