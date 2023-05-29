import React from 'react';
import classes from './More.module.scss';
import LANG from '../../../classes/Lang/Language';
import { Typography } from '@material-ui/core';
import SETTINGS from '../../../tools/Settings';

export default function Blocks() {
  return (
    <div>
      <Typography variant="h4" className={classes.main_title}>
        {LANG.blocks}
      </Typography>

      <Typography>
        {LANG.you_have_blocked} <span className={classes.number}>{SETTINGS.archive.blocks.size}</span> {LANG.users}.
      </Typography>
    </div>
  );
}
