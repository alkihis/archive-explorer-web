import React from 'react';
import classes from './More.module.scss';
import { isArchiveLoaded, dateFormatter } from '../../../helpers';
import SETTINGS from '../../../tools/Settings';
import { AppBar, Toolbar, Typography, Container, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Button, DialogContentText, Paper, Table, TableHead, TableBody, TableCell, TableRow } from '@material-ui/core';
import { Marger } from '../../../tools/PlacingComponents';
import Tasks from '../../../tools/Tasks';
import { toast } from '../../shared/Toaster/Toaster';
import { DownloadGDPRModal } from '../../shared/NoGDPR/NoGDPR';
import { DEBUG_MODE } from '../../../const';
import moment from 'moment';
import RefactorArchiveButton from '../../shared/RefactorArchive/RefactorArchive';

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

        {/* DOWNLOAD */}
        <Typography variant="h5" className={classes.second_title}>
          Download a Twitter archive
        </Typography>

        <Typography className={classes.help_p}>
          Learn how to download a Twitter archive with a simple tutorial.
          It will just take minutes.
        </Typography>
        <HelpDL />

        {/* SEARCH */}
        <Typography variant="h5" className={classes.second_title}>
          Search
        </Typography>

        <Typography className={classes.help_p}>
          For both tweets and direct messages, search is case-insensitive, and supports regular expressions.
        </Typography>

        <Marger size={8} />

        <Typography variant="h6" className={classes.third_title}>
          Tweets
        </Typography>

        <Typography className={classes.help_p}>
          Search for the tweets you want directly in your archive. Search is made instantly, in all your tweets.
          <br />
          You can enhance your queries made in tweet explorer by adding <span className="bold">keywords</span>.
          <br />
        </Typography>
        <Keywords />

        <Marger size={8} />

        <Typography variant="h6" className={classes.third_title}>
          Direct Messages
        </Typography>

        <Typography className={classes.help_p}>
          When a conversation is selected, you can find messages by their text. Once you've found the
          message you want, just click on it to see the following and preceding DMs of the conversation.
          <br />
        </Typography>

        <Marger size={8} />

        {/* DELETION */}
        <Typography variant="h5" className={classes.second_title}>
          Delete tweets, favorites and more
        </Typography>

        <Typography className={classes.help_p}>
          Archive Explorer let you delete a batch of tweets, or other informations linked to your account.
          <br />
          Please note that <span className="bold">
            every deletion is made on your Twitter account, and is irremediable
          </span>. You will not be able to get your tweets, favorites or anything else back. 
        </Typography>

        <Typography variant="h6" className={classes.third_title}>
          Tweets
        </Typography>

        <Typography className={classes.help_p}>
          For tweets, you can select tweets individually via Tweet Explorer (Explore tab), or choose from multiple months
          and years with Quick Delete, available in the Archive tab.
        </Typography>

        <Typography variant="h6" className={classes.third_title}>
          Favorites, mutes and blocks
        </Typography>

        <Typography className={classes.help_p}>
          Favorites, mutes and blocks can be deleted in this tab. This kind of removal is "all or nothing", you can't 
          individually select which favorite or block you will remove.
        </Typography>

        <Marger size={8} />

        {/* LIMITATIONS */}
        <Typography variant="h5" className={classes.second_title}>
          Limitations
        </Typography>

        <Typography variant="h6" className={classes.third_title}>
          Retweet data
        </Typography>

        <Typography className={classes.help_p}>
          When you browse your tweets, you may see strange retweet informations: 
          Profile picture may be yours, or Twitter name isn't good. 
          In fact, Twitter archives contains a bad retweet data. Retweets are stored in your name,
          and the original retweet isn't present. 
          <br />
          Archive Explorer tries to enhance at their maximum retweet data in order to make your experience
          as good as possible, but it can't do miracles.
        </Typography>

        <Typography variant="h6" className={classes.third_title}>
          Truncated tweets
        </Typography>

        <Typography className={classes.help_p}>
          Tweets that contains more than 140 characters are truncated in archives. It may be a bug
          (see <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/Alkihis/status/1173857093880864768">this tweet</a>)
          or not, Twitter hasn't given an answer yet.

          <br />

          You can choose to download tweets from Twitter instead from the archive in Settings to have full text,
          but the tweet display will be considerably slower (this feature is very resource-demanding, please not abuse of it !).
        </Typography>

        <Typography variant="h6" className={classes.third_title}>
          Tasks limit
        </Typography>

        <Typography className={classes.help_p}>
          Deletion tasks are very resource-demanding for server and are limited for each user.
          You are able to start <span className="bold">3 tasks</span> in parallel. 
          <br />
          If you want to start another task, please wait for
          other tasks to complete or cancel an existing task.
        </Typography>

        <Typography variant="h6" className={classes.third_title}>
          Archive size limit
        </Typography>

        <Typography className={classes.help_p}>
          Due to a technical limitation, archive are fully loaded into your navigator's memory.
          This could be very inefficient for mobiles devices or small computers.
          Moreover, archive size limit, due to another technical limitation, is fixed to 4 GB.

          <br />

          In order to smoothen your experience with Archive Explorer, you can use a Mac or a PC to make
          your archive lighter, by following this tutorial available by clicking the button below.

          <RefactorArchiveButton message="How to lighten my archive ?" className={classes.light_btn} />
        </Typography>

        <Marger size="3rem" />
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

function HelpDL() {
  const [open, setOpen] = React.useState(false);

  const closeModal = () => {
    setOpen(false);
  };

  const openModal = () => {
    setOpen(true);
  };

  return (
    <div>
      <Button variant="outlined" color="primary" onClick={openModal} className={classes.dl_btn}>
        How to download an archive
      </Button>

      <DownloadGDPRModal open={open} onClose={closeModal} />
    </div>
  );
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
    const favs: string[] = DEBUG_MODE ? Array(10000).fill("1") : [...SETTINGS.archive.extended_gdpr.favorites];

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
    const blocks: string[] = DEBUG_MODE ? Array(10000).fill("1") : [...SETTINGS.archive.extended_gdpr.blocks];

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
    const mutes: string[] = DEBUG_MODE ? Array(10000).fill("1") : [...SETTINGS.archive.extended_gdpr.mutes];

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
  const rows = SETTINGS.archive.extended_gdpr.screen_name_history.map(e => {
    return {
      date: moment(e.screenNameChange.changedAt).toDate(),
      sn: e.screenNameChange.changedFrom
    }
  });
  rows.push({
    date: undefined,
    sn: SETTINGS.archive.owner_screen_name
  });

  return (
    <div>
      <Typography variant="h5" className={classes.second_title}>
        Screen name history
      </Typography>

      <Paper className={classes.sn_root}>
        <div className={classes.t_wrapper}>
          <Table stickyHeader className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell>Twitter @</TableCell>
                <TableCell align="right">Until</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.date ? row.date.toISOString() : '-'}>
                  <TableCell className="bold">@{row.sn}</TableCell>
                  <TableCell style={{minWidth: 120}} align="right" component="th" scope="row">
                    {row.date ? dateFormatter("Y-m-d H:i", row.date) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Paper>
    </div>
  );
}

function Keywords() {
  return (
    <Paper className={classes.sn_root}>
      <div className={classes.t_wrapper}>
        <Table stickyHeader className={classes.table_large}>
          <TableHead>
            <TableRow>
              <TableCell>Keyword</TableCell>
              <TableCell>Content</TableCell>
              <TableCell align="right">Description</TableCell>
              <TableCell align="right">Example</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell component="th" scope="row" className="bold">
                :current
              </TableCell>
              <TableCell>
                -
              </TableCell>
              <TableCell style={{minWidth: 120}} align="right">
                Limit search to currently selected month. 
                Search <span className="bold">must</span> begin by <span className="italic">:current</span>.
              </TableCell>
              <TableCell style={{minWidth: 80}} align="right" className="italic">
                :current hello !
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell component="th" scope="row" className="bold">
                since:
              </TableCell>
              <TableCell>
                [YYYY-MM-DD]
              </TableCell>
              <TableCell style={{minWidth: 120}} align="right">
                Find tweets made since a specified date.
              </TableCell>
              <TableCell style={{minWidth: 80}} align="right" className="italic">
                since:2018-01-02
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell component="th" scope="row" className="bold">
                until:
              </TableCell>
              <TableCell>
                [YYYY-MM-DD]
              </TableCell>
              <TableCell style={{minWidth: 120}} align="right">
                Find tweets made before a specified date.
              </TableCell>
              <TableCell style={{minWidth: 80}} align="right" className="italic">
                until:2018-04-02
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell component="th" scope="row" className="bold">
                from:
              </TableCell>
              <TableCell>
                [twitter @]
              </TableCell>
              <TableCell style={{minWidth: 120}} align="right">
                Find tweets made by specified user.
              </TableCell>
              <TableCell style={{minWidth: 80}} align="right" className="italic">
                from:Alkihis
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Paper>
  );
}
