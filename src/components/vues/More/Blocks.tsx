import React from 'react';
import classes from './More.module.scss';
import LANG from '../../../classes/Lang/Language';
import { Typography, Button } from '@material-ui/core';
import SETTINGS from '../../../tools/Settings';
import { DeleteModal } from './More';
import Tasks from '../../../tools/Tasks';
import { toast } from '../../shared/Toaster/Toaster';
import { DEBUG_MODE } from '../../../const';

export default function Blocks() {
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
    const blocks: string[] = DEBUG_MODE ? Array(10000).fill("1") : [...SETTINGS.archive.blocks];

    Tasks.start(blocks, "block")
      .catch(() => {
        toast(LANG.task_start_error, "error");
      });
  }

  return (
    <div>
      <Typography variant="h4" className={classes.main_title}>
        {LANG.blocks}
      </Typography>

      <Typography>
        {LANG.you_have_blocked} <span className={classes.number}>{SETTINGS.archive.blocks.size}</span> {LANG.users}.
      </Typography>

      <Button disabled={!SETTINGS.can_delete} variant="outlined" color="primary" onClick={handleClickOpen} className={classes.delete_btn}>
        {LANG.delete_all_blocked}
      </Button>

      <DeleteModal 
        type={LANG.blocked_modal}
        open={open}
        onClose={handleClose}
        onValidate={handleValidate}
        onCancel={handleClose}
      />
    </div>
  );
}
