import React from 'react';
import BlockIcon from '@material-ui/icons/Block';
import classes from './NoArchive.module.scss';
import { Typography } from '@material-ui/core';
import { Link } from 'react-router-dom';
import EmptyMessage from '../EmptyMessage/EmptyMessage';
import LANG from '../../../classes/Lang/Language';

export default function NoArchive() {
  return (
    <EmptyMessage 
      icon={BlockIcon} 
      main={LANG.archive_not_loaded} 
      second={<div>
        {LANG.load_valid_in} <Link to="/archive/" className={classes.archive_link}>
          <Typography variant="inherit" color="primary">
            {LANG.archive_page}
          </Typography>
        </Link>.
      </div>}
    />
  );
}
