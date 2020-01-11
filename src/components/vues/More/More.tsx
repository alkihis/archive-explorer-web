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
import { TweetArchive } from 'twitter-archive-reader';
import LANG from '../../../classes/Lang/Language';

export default class More extends React.Component {
  renderGDPR() {
    return <div>
      <Typography variant="h4" className={classes.main_title}>
        {LANG.extended_archive_data}
      </Typography>

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
          {LANG.help}
        </Typography>

        {/* DOWNLOAD */}
        <Typography variant="h5" className={classes.second_title}>
          {LANG.download_twitter_archive}
        </Typography>

        <Typography className={classes.help_p}>
          {LANG.learn_how_to_download}
        </Typography>
        <HelpDL />

        {/* SEARCH */}
        <Typography variant="h5" className={classes.second_title}>
          {LANG.search}
        </Typography>

        <Typography className={classes.help_p}>
          {LANG.search_p1}
        </Typography>

        <Marger size={8} />

        <Typography variant="h6" className={classes.third_title}>
          Tweets
        </Typography>

        <Typography className={classes.help_p}>
          {LANG.tweets_p1}
          <br />
        </Typography>
      
        <Marger size={8} />

        <Typography variant="h6" className={classes.third_title}>
          {LANG.direct_messages}
        </Typography>

        <Typography className={classes.help_p}>
          {LANG.direct_messages_p1}
          <br />
        </Typography>

        <Marger size={8} />

        <Typography variant="h6" className={classes.third_title}>
          {LANG.keywords_upper}
        </Typography>

        <Typography className={classes.help_p}>
          {LANG.keywords_p1} <span className="bold">{LANG.keywords}</span>.
          <br />
        </Typography>
        <Keywords />

        <Marger size={8} />

        {/* DELETION */}
        <Typography variant="h5" className={classes.second_title}>
          {LANG.delete_tweets_more}
        </Typography>

        <Typography className={classes.help_p}>
          {LANG.delete_tweets_more_p1}
          <br />
          {LANG.delete_tweets_more_p2} <span className="bold">
            {LANG.delete_tweets_more_p3}
          </span> {LANG.delete_tweets_more_p4}.  
        </Typography>

        <Typography variant="h6" className={classes.third_title}>
          Tweets
        </Typography>

        <Typography className={classes.help_p}>
          {LANG.tweets_more_p1}
        </Typography>

        <Typography variant="h6" className={classes.third_title}>
          {LANG.favs_mutes_blocks}
        </Typography>

        <Typography className={classes.help_p}>
          {LANG.favs_mutes_blocks_p1}
        </Typography>

        <Marger size={8} />

        {/* ARCHIVE SAVE */}
        <Typography variant="h5" className={classes.second_title}>
          {LANG.archive_saving}
        </Typography>

        <Typography className={classes.help_p}>
          {LANG.archive_saving_p1}

          <br />

          <strong>{LANG.archive_saving_p2}</strong>
        </Typography>

        <Marger size={8} />

        {/* LIMITATIONS */}
        <Typography variant="h5" className={classes.second_title}>
          {LANG.limitations}
        </Typography>

        <Typography variant="h6" className={classes.third_title}>
          {LANG.retweet_data}
        </Typography>

        <Typography className={classes.help_p}>
          {LANG.retweet_data_p1}
          <br />
          {LANG.retweet_data_p2}
        </Typography>

        <Typography variant="h6" className={classes.third_title}>
          {LANG.truncated_tweets}
        </Typography>

        <Typography className={classes.help_p}>
          {LANG.truncated_tweets_p1} <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/Alkihis/status/1173857093880864768">{LANG.this_tweet}</a>){" "}
          {LANG.truncated_tweets_p2}

          <br />

          {LANG.truncated_tweets_p3}
        </Typography>

        <Typography variant="h6" className={classes.third_title}>
          {LANG.tasks_limit}
        </Typography>

        <Typography className={classes.help_p}>
          {LANG.tasks_limit_p1} <span className="bold">{LANG.tasks_limit_p2}</span> {LANG.tasks_limit_p3} 
          <br />
          {LANG.tasks_limit_p4}
        </Typography>

        <Typography variant="h6" className={classes.third_title}>
          {LANG.archive_size}
        </Typography>

        <Typography className={classes.help_p}>
          {LANG.archive_size_p1}
          <br />

          {LANG.archive_size_p2}
          <span className="bold"> direct_message_media</span> {LANG.archive_size_p3}
        </Typography>

        <Marger size="3rem" />
      </div>
    );
  }

  renderClassic() {
    return <div>
      <Typography variant="h4" className={classes.main_title}>
        {LANG.extended_archive_data}
      </Typography>

      <Typography>
        {LANG.classic_not_supported}
      </Typography>

      <Divider className="divider-big-margin" />
    </div>;
  }

  renderNoArchive() {
    return <div>
      <Typography variant="h4" className={classes.main_title}>
        {LANG.archive_not_loaded}
      </Typography>

      <Typography>
        {LANG.archive_not_loaded_p1}
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
            {LANG.more}
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
        {LANG.how_to_download}
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
      <DialogTitle>{LANG.delete_all_your} {props.type} ?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {LANG.permanently_remove_your} {props.type} {LANG.from_twitter_account}.{" "}
          {LANG.are_you_sure_you_want} ?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel} color="primary" autoFocus>
          {LANG.cancel}
        </Button>
        <Button onClick={props.onValidate} color="secondary">
          {LANG.start_task}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

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
        toast(LANG.task_start_error, "error");
      });
  }

  return (
    <div>
      <Typography variant="h5" className={classes.second_title}>
        {LANG.blocks}
      </Typography>

      <Typography>
        {LANG.you_have_blocked} <span className={classes.number}>{SETTINGS.archive.extended_gdpr.blocks.size}</span> {LANG.users}.
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
        toast(LANG.task_start_error, "error");
      });
  }

  return (
    <div>
      <Typography variant="h5" className={classes.second_title}>
        {LANG.mutes}
      </Typography>

      <Typography>
        {LANG.you_have_muted} <span className={classes.number}>{SETTINGS.archive.extended_gdpr.mutes.size}</span> {LANG.users}.
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

function ScreenNameHistory() {
  const rows = SETTINGS.archive.extended_gdpr.screen_name_history.map(e => {
    return {
      date: TweetArchive.parseTwitterDate(e.screenNameChange.changedAt),
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
        {LANG.screen_name_history}
      </Typography>

      <Paper className={classes.sn_root}>
        <div className={classes.t_wrapper}>
          <Table stickyHeader className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell className={classes.th}>{LANG.twitter_at}</TableCell>
                <TableCell className={classes.th} align="right">{LANG.until}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.date ? row.date.toISOString() : '-'}>
                  <TableCell className="bold">@{row.sn}</TableCell>
                  <TableCell style={{minWidth: 120}} align="right" component="th" scope="row">
                    {row.date ? dateFormatter(SETTINGS.lang === "fr" ? "d/m/Y H:i" : "Y-m-d H:i", row.date) : '-'}
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
              <TableCell className={classes.th}>{LANG.keyword}</TableCell>
              <TableCell className={classes.th}>{LANG.content}</TableCell>
              <TableCell align="right" className={classes.th}>{LANG.description}</TableCell>
              <TableCell align="right" className={classes.th}>{LANG.example}</TableCell>
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
                {LANG.limit_search_to_month}{" "}
                {LANG.the_search} <span className="bold">{LANG.must}</span> {LANG.begin_by} <span className="italic">:current</span>.
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
                {LANG.find_tweets_since}
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
                {LANG.find_tweets_until}
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
                {LANG.find_tweets_from}
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
