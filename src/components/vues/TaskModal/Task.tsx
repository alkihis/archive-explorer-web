import classes from './Task.module.scss';
import React from 'react';
import { TaskInformation } from '../../../tools/Tasks';
import { ExpansionPanel, ExpansionPanelSummary, Typography, ExpansionPanelDetails, LinearProgress, ExpansionPanelActions, Button } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import RoundIcon from '@material-ui/icons/Lens';

import TweetIcon from '@material-ui/icons/Message';
import BlockIcon from '@material-ui/icons/Block';
import MuteIcon from '@material-ui/icons/VolumeOff';
import UnknownIcon from '@material-ui/icons/HighlightOff';
import LANG from '../../../classes/Lang/Language';

type TaskP = {
  data: TaskInformation;
  is_subscribed?: boolean;
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
    const base_panel = this.is_over ? classes.panel_over : (this.props.is_subscribed ? classes.panel_sub : classes.panel_unsub);
    const color_icon = this.is_over ? classes.icon_green : (this.props.is_subscribed ? classes.icon_orange : classes.icon_purple);

    const completed = this.props.data.done + this.props.data.failed;
    const total = this.props.data.total;

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
          
          {!this.props.is_subscribed && <Button size="small" color="primary" onClick={() => this.props.onSubChange(true, this.id)}>
            {LANG.subscribe}
          </Button>}

          {this.props.is_subscribed && <Button size="small" color="primary" onClick={() => this.props.onSubChange(false, this.id)}>
            {LANG.unsubscribe}
          </Button>}
          
        </ExpansionPanelActions>
      </ExpansionPanel>
    );
  }
}
