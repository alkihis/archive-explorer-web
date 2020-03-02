import React from 'react';
import classes from './More.module.scss';
import LANG from '../../../classes/Lang/Language';
import { Typography, Link, List, ListItem, ListSubheader } from '@material-ui/core';
import { Marger } from '../../../tools/PlacingComponents';

export default function LegalMentions() {

  return (
    <div>
      <Typography variant="h4" className={classes.main_title}>
        {LANG.legal_mentions_and_limitations}
      </Typography>

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
        {LANG.favorites}
      </Typography>

      <Typography className={classes.help_p}>
        {LANG.favorites_p1} <strong>{LANG.favorites_p2}</strong>.
        <br />
        {LANG.favorites_p3}
      </Typography>

      <Marger size=".5rem" />

      {/* LEGAL NOTICE */}
      <Typography variant="h5" className={classes.second_title}>
        {LANG.legal_mentions}
      </Typography>

       {/* About */}
       <Typography variant="h6" className={classes.third_title}>
        {LANG.about_archive_explorer}
      </Typography>

      <Typography className={classes.help_p}>
        {LANG.about_archive_explorer_p1} <Link rel="noopener noreferrer" target="_blank" href="https://github.com/alkihis/">
          GitHub
        </Link>.
        <br />
        {LANG.about_archive_explorer_p2}
      </Typography>

      <Typography className={classes.help_p}>
        <strong>{LANG.about_archive_explorer_p3}</strong>
      </Typography>

      {/* About tweet deletion */}
      <Typography variant="h6" className={classes.third_title}>
        {LANG.tweet_deletion}
      </Typography>

      <Typography className={classes.help_p}>
        {LANG.tweet_deletion_p1}
      </Typography>

    
      {/* Personal data */}
      <Typography variant="h6" className={classes.third_title}>
        {LANG.personal_data}
      </Typography>

      <Typography className={classes.help_p}>
        {LANG.personal_data_p1}
      </Typography>

      {/* Used software */}
      <Typography variant="h6" className={classes.third_title}>
        {LANG.used_software}
      </Typography>

      <Typography className={classes.help_p}>
        {LANG.used_software_p1}
      </Typography>
      <List dense> 
        <ListSubheader>{LANG.web_service}</ListSubheader>
        <Reference url="https://www.typescriptlang.org/">TypeScript</Reference>
        <Reference url="https://reactjs.org/">React</Reference>
        <Reference url="https://material-ui.com/">Material UI</Reference>
        <Reference url="https://socket.io/">Socket.io</Reference>
        <Reference url="https://localforage.github.io/localForage/">LocalForage</Reference>
        <Reference url="https://www.npmjs.com/package/node-sass">node-sass</Reference>
        <Reference url="https://www.npmjs.com/package/grapheme-splitter">grapheme-splitter</Reference>
        <Reference url="http://recharts.org/en-US/">recharts</Reference>
        <Reference url="https://www.npmjs.com/package/notistack">notistack</Reference>


        <ListSubheader>{LANG.server}</ListSubheader>
        <Reference url="https://expressjs.com/fr/">Express</Reference>
        <Reference url="https://mongoosejs.com/">mongoose</Reference>
        <Reference url="https://www.npmjs.com/package/winston">winston</Reference>
        <Reference url="https://www.npmjs.com/package/commander">commander</Reference>
        <Reference url="https://www.npmjs.com/package/jsonwebtoken">jsonwebtoken</Reference>


        <ListSubheader>{LANG.archive_reader}</ListSubheader>
        <Reference url="https://stuk.github.io/jszip/">JSZip</Reference>
        <Reference url="https://www.npmjs.com/package/big-integer">big-integer</Reference>
        <Reference url="https://www.npmjs.com/package/js-md5">js-md5</Reference>
        <Reference url="https://www.npmjs.com/package/twitter-d">twitter-d</Reference>
        <Reference url="https://www.npmjs.com/package/node-stream-zip">node-stream-zip (forked)</Reference>
      </List>

      <Marger size="3rem" />
    </div>
  );
}

function Reference(props: React.PropsWithChildren<{ url?: string }>) {
  if (!props.url) {
    return <ListItem>{props.children}</ListItem>;
  }
  return <ListItem>
    <Link href={props.url} target="_blank" rel="noopener noreferrer">
      {props.children}
    </Link>
  </ListItem>;
}

