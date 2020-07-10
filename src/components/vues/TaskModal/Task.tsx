import classes from './Task.module.scss';
import React from 'react';
import { TaskInformation } from '../../../tools/Tasks';
import { ExpansionPanel, ExpansionPanelSummary, Typography, ExpansionPanelDetails, LinearProgress, ExpansionPanelActions, Button, Paper, makeStyles, createStyles, Theme } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import RoundIcon from '@material-ui/icons/Lens';
import LANG from '../../../classes/Lang/Language';

import TweetIcon from '@material-ui/icons/Message';
import BlockIcon from '@material-ui/icons/Block';
import MuteIcon from '@material-ui/icons/VolumeOff';
import UnknownIcon from '@material-ui/icons/HighlightOff';
import ErrorIcon from '@material-ui/icons/ErrorOutline';

type TaskP = {
  data: TaskInformation;
  subscribed?: boolean;
  onSubChange?: Function;
  onCancel?: Function;
}

export default class Task extends React.Component<TaskP> {
  get id() {
    return this.props.data.id;
  }

  get is_over() {
    return this.props.data.percentage >= 100;
  }

  iconForTask() {
    switch (this.props.data.type) {
      case "tweet":
        return TweetIcon;
      case "block":
        return BlockIcon;
      case "mute":
        return MuteIcon;
      default:
        return UnknownIcon;
    }
  }

  textForTask() {
    switch (this.props.data.type) {
      case "tweet":
        return LANG.tweet_deletion;
      case "block":
        return LANG.block_deletion;
      case "mute":
        return LANG.mute_deletion;
      default:
        return LANG.unknown_deletion;
    }
  }

  render() {
    const base_panel = this.is_over ? classes.panel_over : (this.props.subscribed ? classes.panel_sub : classes.panel_unsub);
    const color_icon = this.is_over ? classes.icon_green : (this.props.subscribed ? classes.icon_orange : classes.icon_purple);

    const completed = this.props.data.done + this.props.data.failed;
    const total = this.props.data.total;
    const errors = this.props.data.twitter_errors;

    const IconType = this.iconForTask();

    return (
      <ExpansionPanel className={base_panel}>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className={classes.heading}>

            <RoundIcon className={classes.icon + " " + color_icon} /> 
            <IconType className={classes.icon + " " + classes.type_icon} /> 

            {this.textForTask()} <span className={classes.task_id}> #{this.id}</span>

            <span className={classes.header_info}> (
              <span className="bold">{completed}/{total}</span>, <span className="bold">{this.props.data.percentage.toFixed(0)}</span>% {LANG.completed})
            </span>
          </Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.details}>
          {errors && <TwitterErrors errors={errors} />}

          <Typography className={classes.counts}>
            <span className="bold">{this.props.data.done}</span> {LANG.deleted}{this.props.data.done > 1 ? LANG.past_s : ""},
            <span className="bold"> {this.props.data.failed}</span> {LANG.failed}{this.props.data.failed > 1 ? LANG.past_s : ""},
            <span className="bold"> {this.props.data.remaining}</span> {LANG.remaining}{this.props.data.remaining > 1 ? LANG.past_s : ""}.
          </Typography>

          <LinearProgress variant="determinate" className={this.is_over ? classes.bar_over : classes.bar} value={this.props.data.percentage} />
        </ExpansionPanelDetails>

        <ExpansionPanelActions>
          {!this.is_over && <Button size="small" onClick={() => this.props.onCancel(this.id)}>
            {LANG.cancel}
          </Button>}
          
          {!this.props.subscribed && <Button size="small" color="primary" onClick={() => this.props.onSubChange(true, this.id)}>
            {LANG.subscribe}
          </Button>}

          {this.props.subscribed && <Button size="small" color="primary" onClick={() => this.props.onSubChange(false, this.id)}>
            {LANG.unsubscribe}
          </Button>}
          
        </ExpansionPanelActions>
      </ExpansionPanel>
    );
  }
}

const withTwitterErrorsStyles = makeStyles((theme: Theme) => 
  createStyles({
    paper: {
      backgroundColor: theme.palette.type === "dark" ? '#654a4d' : '#f8d7da',
      color: theme.palette.type === "dark" ? 'white' : '#721c24',
      padding: 14,
      marginBottom: '1.7rem',
    },
    header: {
      marginTop: '-.2rem',
      marginBottom: '.3rem',
    },
    icon: {
      marginRight: '.2rem',
      marginBottom: '-.4rem',
    },
    times: {
      fontSize: 'small',
    }
  })  
);

function TwitterErrors({ errors }: { errors: { [code: string]: [number, string] } }) {
  const classes = withTwitterErrorsStyles({ errors });
  const es = Object.entries(errors);

  return (
    <Paper variant="outlined" className={classes.paper}>
      <Typography variant="h6" className={classes.header}>
        {LANG.errors_encountered}
      </Typography>

      {es.map(e => <Typography key={e[0]}>
        <ErrorIcon className={classes.icon} /> #<strong>{e[0]}</strong> 
        <span className={classes.times}> ({e[1][0]} {LANG.times})</span> : {" "} 

        {getTwitterErrorMessageFromCode(e[0])}  
      </Typography>)}
    </Paper>
  );
}

function getTwitterErrorMessageFromCode(code: number | string) {
  switch (Number(code)) {
    case 34:
      return LANG.twitter_error__inexistant_user;
    case 63:
      return LANG.twitter_error__suspended_user;
    case 89:
      return LANG.twitter_error__user_disconnected;
    case 144:
      return LANG.twitter_error__inexistant_tweet;
    case 179:
      return LANG.twitter_error__protected_user;
  }
  return LANG.format("twitter_error__unknown_error", code);
}
