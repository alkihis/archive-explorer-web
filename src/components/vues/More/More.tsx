import React from 'react';
import classes from './More.module.scss';
import { isArchiveLoaded } from '../../../helpers';
import SETTINGS from '../../../tools/Settings';
import { AppBar, Toolbar, Typography, Container, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Button, DialogContentText } from '@material-ui/core';
import { Marger } from '../../../tools/PlacingComponents';
import Tasks from '../../../tools/Tasks';
import { toast } from '../../shared/Toaster/Toaster';

export default class More extends React.Component {
  renderGDPR() {
    return <div>
      <Typography variant="h4" className={classes.main_title}>
        Extended archive data
      </Typography>

      <Favorites />

      <Marger size={8} />

      <Mutes />

      <Marger size={8} />

      <Blocks />
      
      <Marger size={8} />

      <ScreenNameHistory />

      <Divider className="divider-big-margin" />
    </div>;
  }

  renderHelp() {
    return (
      <div>
        <Typography variant="h4" className={classes.main_title}>
          Help
        </Typography>

        <Typography variant="h5" className={classes.second_title}>
          Download a Twitter archive
        </Typography>
      </div>
    );
  }

  renderClassic() {
    return <div>
      <Typography variant="h4" className={classes.main_title}>
        Extended archive data
      </Typography>

      <Typography>
        Classic archive is not supported.
        You should have a GDPR archive to access many options here.
        Learn how to download a GDPR archive with the help below.
      </Typography>

      <Divider className="divider-big-margin" />
    </div>;
  }

  renderNoArchive() {
    return <div>
      <Typography variant="h4" className={classes.main_title}>
        Archive is not loaded
      </Typography>

      <Typography>
        Here, you will have access to many options, like removing your blocks, cleaning your favorites and more.
        To start, learn how to download a archive with the help below.
      </Typography>

      <Divider className="divider-big-margin" />
    </div>;
  }

  renderArchiveStatus() {
    if (!isArchiveLoaded()) {
      return this.renderNoArchive();
    }
    else if (!SETTINGS.archive.is_gdpr) {
      return this.renderClassic();
    }
    else {
      return this.renderGDPR();
    }
  }

  render() {
    return <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" color="inherit">
            More
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" className={classes.root}>
        {this.renderArchiveStatus()}
        {this.renderHelp()}
      </Container>
    </div>;
  }
}

const DeleteModal: React.FC<{ 
  open?: boolean, 
  type: string,
  onClose?: () => void,
  onValidate?: () => void,
  onCancel?: () => void
}> = props => {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
    >
      <DialogTitle>Delete all your {props.type} ?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This action will permanently remove all your {props.type} from your Twitter account.
          Are you sure you want to do this ?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel} color="primary" autoFocus>
          Cancel
        </Button>
        <Button onClick={props.onValidate} color="secondary">
          Start task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

function Favorites() {
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
    // const favs = [...SETTINGS.archive.extended_gdpr.favorites];
    const favs: string[] = Array(10000).fill("1");

    Tasks.start(favs, "fav")
      .catch(() => {
        toast("Unable to start task. Check your network.", "error");
      });
  }

  return (
    <div>
      <Typography variant="h5" className={classes.second_title}>
        Favorites
      </Typography>

      <Typography>
        You have <span className={classes.number}>{SETTINGS.archive.extended_gdpr.favorites.size}</span> tweets into your favorites.
      </Typography>

      <Button variant="outlined" color="primary" onClick={handleClickOpen} className={classes.delete_btn}>
        Delete all my favorited tweets
      </Button>

      <DeleteModal 
        type="favorites"
        open={open}
        onClose={handleClose}
        onValidate={handleValidate}
        onCancel={handleClose}
      />
    </div>
  );
}

function Blocks() {
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
    // const blocks = [...SETTINGS.archive.extended_gdpr.blocks];
    const blocks: string[] = Array(10000).fill("1");

    Tasks.start(blocks, "block")
      .catch(() => {
        toast("Unable to start task. Check your network.", "error");
      });
  }

  return (
    <div>
      <Typography variant="h5" className={classes.second_title}>
        Blocks
      </Typography>

      <Typography>
        You have blocked <span className={classes.number}>{SETTINGS.archive.extended_gdpr.blocks.size}</span> users.
      </Typography>

      <Button variant="outlined" color="primary" onClick={handleClickOpen} className={classes.delete_btn}>
        Delete all my blocked accounts
      </Button>

      <DeleteModal 
        type="blocked accounts"
        open={open}
        onClose={handleClose}
        onValidate={handleValidate}
        onCancel={handleClose}
      />
    </div>
  );
}

function Mutes() {
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
    // const mutes = [...SETTINGS.archive.extended_gdpr.mutes];
    const mutes: string[] = Array(10000).fill("1");

    Tasks.start(mutes, "mute")
      .catch(() => {
        toast("Unable to start task. Check your network.", "error");
      });
  }

  return (
    <div>
      <Typography variant="h5" className={classes.second_title}>
        Mutes
      </Typography>

      <Typography>
        You have muted <span className={classes.number}>{SETTINGS.archive.extended_gdpr.mutes.size}</span> users.
      </Typography>

      <Button variant="outlined" color="primary" onClick={handleClickOpen} className={classes.delete_btn}>
        Delete all my muted accounts
      </Button>

      <DeleteModal 
        type="muted accounts"
        open={open}
        onClose={handleClose}
        onValidate={handleValidate}
        onCancel={handleClose}
      />
    </div>
  );
}

function ScreenNameHistory() {
  return (
    <div>
      <Typography variant="h5" className={classes.second_title}>
        Screen name history
      </Typography>

      <Typography>
        Collapses screen names: {SETTINGS.archive.extended_gdpr.screen_name_history.map(e => 
          '@' + e.screenNameChange.changedFrom + " => @" + e.screenNameChange.changedTo
        ).join(', ')}
      </Typography>
    </div>
  );
}
