import React from 'react';
import classes from './More.module.scss';
import LANG from '../../../classes/Lang/Language';
import { Typography, Button } from '@material-ui/core';
import SETTINGS from '../../../tools/Settings';
import { toast } from '../../shared/Toaster/Toaster';
import Tasks from '../../../tools/Tasks';
import { DEBUG_MODE } from '../../../const';
import { DeleteModal } from './More';

export default function Mutes() {
  const [open, setOpen] = React.useState(false);

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleValidate() {
    setOpen(false);

    // Starting the task
    const mutes: string[] = DEBUG_MODE ? Array(10000).fill("1") : [...SETTINGS.archive.mutes];

    Tasks.start(mutes, "mute")
      .catch(() => {
        toast(LANG.task_start_error, "error");
      });
  }

  return (
    <div>
      <Typography variant="h4" className={classes.main_title}>
        {LANG.mutes}
      </Typography>

      <Typography>
        {LANG.you_have_muted} <span className={classes.number}>{SETTINGS.archive.mutes.size}</span> {LANG.users}.
      </Typography>

      <Button disabled={!SETTINGS.can_delete} variant="outlined" color="primary" onClick={handleClickOpen} className={classes.delete_btn}>
        {LANG.delete_all_muted}
      </Button>

      <DeleteModal
        type={LANG.muted_modal}
        open={open}
        onClose={handleClose}
        onValidate={handleValidate}
        onCancel={handleClose}
      />
    </div>
  );
}
