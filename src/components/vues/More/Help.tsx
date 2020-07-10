import React from 'react';
import classes from './More.module.scss';
import LANG from '../../../classes/Lang/Language';
import { Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Divider } from '@material-ui/core';
import { Marger } from '../../../tools/PlacingComponents';
import { DownloadGDPRModal } from '../../shared/NoGDPR/NoGDPR';
import SETTINGS from '../../../tools/Settings';
import { isArchiveLoaded } from '../../../helpers';

export default function Help() {
  function renderClassic() {
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

  function renderNoArchive() {
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

  function renderArchiveStatus() {
    if (!isArchiveLoaded()) {
      return renderNoArchive();
    }
    else if (!SETTINGS.archive.is_gdpr) {
      return renderClassic();
    }
  }

  return (
    <div>
      {renderArchiveStatus()}

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

      <Typography className={classes.help_p}>
        {LANG.search_p2}
      </Typography>

      <Marger size={8} />

      <Typography variant="h6" className={classes.third_title}>
        {LANG.about_direct_messages}
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

      <Marger size={4} />

      <Typography className={classes.help_p}>
        {LANG.keywords_p2}
      </Typography>

      <Marger size={8} />

      {/* DELETION */}
      <Typography variant="h5" className={classes.second_title}>
        {LANG.delete_tweets_more}
      </Typography>

      <Typography className={classes.help_p}>
        {/* TODO */}
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

      <Marger size="3rem" />
    </div>
  );
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
