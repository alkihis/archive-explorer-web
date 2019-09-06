import classes from './Task.module.scss';
import React from 'react';
import { TaskInformation } from '../../../tools/Tasks';
import { ExpansionPanel, ExpansionPanelSummary, Typography, ExpansionPanelDetails, LinearProgress, ExpansionPanelActions, Button } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import RoundIcon from '@material-ui/icons/Lens';

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

  render() {
    const base_panel = this.is_over ? classes.panel_over : (this.props.is_subscribed ? classes.panel_sub : classes.panel_unsub);
    const color_icon = this.is_over ? classes.icon_green : (this.props.is_subscribed ? classes.icon_orange : classes.icon_purple);

    const completed = this.props.data.done + this.props.data.failed;
    const total = this.props.data.total;

    return (
      <ExpansionPanel className={base_panel}>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className={classes.heading}>
            <RoundIcon className={classes.icon + " " + color_icon} /> 
            Task #<span className="bold">{this.id}</span> 
            <span className={classes.header_info}> (
              <span className="bold">{completed}/{total}</span>, <span className="bold">{this.props.data.percentage.toFixed(0)}</span>% completed)
              </span>
          </Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.details}>
          <Typography className={classes.counts}>
            <span className="bold">{this.props.data.done}</span> deleted,
            <span className="bold"> {this.props.data.failed}</span> failed,
            <span className="bold"> {this.props.data.remaining}</span> remaining.
          </Typography>

          <LinearProgress variant="determinate" className={this.is_over ? classes.bar_over : classes.bar} value={this.props.data.percentage} />
        </ExpansionPanelDetails>

        <ExpansionPanelActions>
          {!this.is_over && <Button size="small" onClick={() => this.props.onCancel(this.id)}>
            Cancel
          </Button>}
          
          {!this.props.is_subscribed && <Button size="small" color="primary" onClick={() => this.props.onSubChange(true, this.id)}>
            Subscribe
          </Button>}

          {this.props.is_subscribed && <Button size="small" color="primary" onClick={() => this.props.onSubChange(false, this.id)}>
            Unsubscribe
          </Button>}
          
        </ExpansionPanelActions>
      </ExpansionPanel>
    );
  }
}
