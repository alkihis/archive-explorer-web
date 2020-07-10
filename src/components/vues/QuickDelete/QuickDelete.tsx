import React, { MouseEvent as RMouseEvent, ChangeEvent } from 'react';
import classes from './QuickDelete.module.scss';
import { Stepper, Step, StepLabel, Typography, Button, DialogTitle, DialogContent, DialogActions, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails, FormGroup, FormControlLabel, Checkbox } from '@material-ui/core';
import SETTINGS from '../../../tools/Settings';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { getMonthText } from '../../../helpers';
import RoundIcon from '@material-ui/icons/Lens';
import Tasks from '../../../tools/Tasks';
import LANG from '../../../classes/Lang/Language';

type QuickDeleteProp = {
  onClose?: (event?: RMouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

type QuickDeleteState = {
  step: number;
  selected: Set<string>;
}

export default class QuickDelete extends React.Component<QuickDeleteProp, QuickDeleteState> {
  state: QuickDeleteState = {
    step: 0,
    selected: new Set()
  };

  index: { [year: string]: { [month: string]: string[] } } = {};

  constructor(props: QuickDeleteProp) {
    super(props);

    // Build index from archive
    for (const [year, months] of Object.entries(SETTINGS.archive.tweets.index)) {
      if (!(year in this.index)) {
        this.index[year] = {};
      }

      for (const [month, tweets] of Object.entries(months)) {
        // tweets are indexed by ID
        this.index[year][month] = Object.keys(tweets);
      }
    }
  }

  stepName(index: number) {
    if (index) {
      return LANG.start_task;
    }
    return LANG.select_months;
  }

  isYearSelected(year: string) {
    for (const month of this.state.selected) {
      const [_year, ] = month.split('-', 2);

      if (year === _year) {
        return true;
      }
    }

    return false;
  }

  selectAYear(year: string) {
    const months = Object.keys(this.index[year]).map(m => year + "-" + m);

    for (const m of months) {
      this.state.selected.add(m);
    }

    this.setState({
      selected: this.state.selected
    });
  }

  unselectAYear(year: string) {
    const months = [...this.state.selected].filter(m => m.startsWith(year));

    for (const m of months) {
      this.state.selected.delete(m);
    }

    this.setState({
      selected: this.state.selected
    });
  }

  selectAll() {
    const years = Object.keys(this.index);
    years.forEach(y => this.selectAYear(y));
  }

  unselectAll() {
    this.setState({
      selected: new Set()
    });
  }

  /** Get the number of selected tweets */
  get selected_count() {
    return this.selected.length;
  }

  /** Get the selected tweets */
  get selected() : string[] {
    return [].concat(...[...this.state.selected].map(m => {
      const [year, month] = m.split('-', 2);
      return this.index[year][month];
    }));
  }

  /** Get the total count of selectible tweets */
  get total() {
    return Object.values(this.index).reduce((acc, current_year) => {
      return acc + Object.values(current_year)
        .reduce(
          (second_acc, current_month) => second_acc + current_month.length, 
        0);
    }, 0);
  }

  isPartOfYearSelected(year: string) {
    return [...this.state.selected].some(e => e.startsWith(year + "-"));
  }

  isAllSelected() {
    return this.selected_count === this.total;
  }

  isAllYearSelected(year: string | number) {
    year = Number(year);
    const months = Object.keys(this.index[year]);

    const years_label = months.map(m => String(year) + "-" + m);

    return years_label.every(year => this.state.selected.has(year));
  }

  nextStep = () => {
    this.setState({
      step: this.state.step + 1
    });
  }

  previousStep = () => {
    this.setState({
      step: this.state.step - 1
    });
  }

  startErase = () => {
    const tweets = this.selected;

    Tasks.start(tweets, "tweet");

    if (this.props.onClose)
      this.props.onClose();
  };

  taskStarter() {
    const c = this.selected_count;

    return (
      <div className={classes.starter_container}>
        <Typography variant="h6">
          {LANG.delete_selected_tweets} ?
        </Typography>

        <Typography className={classes.starter_details}>
          <span className="bold">{c}</span> tweet{c > 1 ? "s" : ""} {LANG.will_be} <span className="bold">{LANG.permanently}</span> {LANG.deleted_from_twitter}. 
          {" "}{LANG.do_you_really_want_to_do} ?
        </Typography>
      </div>
    );
  }

  selectMonth = (e: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    const v = e.target.value;
    const selected = this.state.selected;

    if (checked) {
      selected.add(v);
    }
    else {
      selected.delete(v);
    }

    this.setState({
      selected
    });
  };

  selectYear = (e: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    const v = e.target.value;

    if (checked) {
      this.selectAYear(v);
    }
    else {
      this.unselectAYear(v);
    }
  };

  checkboxSelectAll = (_: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    if (checked) {
      this.selectAll();
    }
    else {
      this.unselectAll();
    }
  };

  generateMonthsOfYear(year: string) {
    const part_selected = this.isPartOfYearSelected(year);
    const all_checked = this.isAllYearSelected(year);

    return (
      <div>
        <div className={classes.buttons_month}>
          <FormControlLabel
            control={<Checkbox 
              checked={all_checked} 
              indeterminate={!all_checked && part_selected}
              onChange={this.selectYear} 
              value={year}
            />}
            label={LANG.select_all}
          />
        </div>

        <FormGroup>
          {Object.keys(this.index[year])
            .sort((a, b) => Number(a) - Number(b))
            .map(m => <FormControlLabel key={year + "-" + m}
              control={<Checkbox 
                checked={this.state.selected.has(year + "-" + m)} 
                onChange={this.selectMonth} 
                value={year + "-" + m} 
              />}
              label={getMonthText(m) + ` (${this.index[year][m].length})`}
            />)}
        </FormGroup>
      </div>
    );
  }

  generateYears() {
    return Object.keys(this.index)
      .sort((a, b) => Number(b) - Number(a))
      .map(y => {
        const is_selected = this.isYearSelected(y);

        return (
          <ExpansionPanel key={y}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>

              <div className={classes.header_container}>
                <Typography className={classes.heading}>{y}</Typography>
                {is_selected ? <RoundIcon className={classes.icon + " " + classes.icon_lens} />  : ""}
              </div>
              
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              {this.generateMonthsOfYear(y)}
            </ExpansionPanelDetails>
          </ExpansionPanel>
        )
      });
  }

  monthSelector() {
    const c = this.selected_count;
    const all_checked = this.isAllSelected();

    return (
      <div className={classes.month_selector_root}>
        <Typography className={classes.count}>
          <span className="bold">{c}</span> tweet{c > 1 ? "s" : ""} {LANG.selected_without_s}{c > 1 ? LANG.past_s : ""}.
        </Typography>

        <div className={classes.select_all_holder}>
          <FormControlLabel
            control={<Checkbox 
              checked={all_checked} 
              indeterminate={!all_checked && !!this.state.selected.size}
              onChange={this.checkboxSelectAll} 
              value="all"
            />}
            label={LANG.select_all}
          />
        </div>

        {this.generateYears()}
      </div>
    );
  }

  renderStepper() {
    return (
      <div className={classes.content}>
        <Stepper activeStep={this.state.step} className={classes.stepper}>
          <Step>
            <StepLabel>{this.stepName(0)}</StepLabel>
          </Step>
          <Step>
            <StepLabel>{this.stepName(1)}</StepLabel>
          </Step>
        </Stepper>
        <div>
          {this.state.step ? this.taskStarter() : this.monthSelector()}
        </div>
      </div>
    )
  }

  render() {
    return (
      <div>
        <DialogTitle>{LANG.quick_delete}</DialogTitle>
        <DialogContent dividers>
          {this.renderStepper()}
        </DialogContent>
        <DialogActions className={classes.actions}>
          <Button onClick={this.props.onClose}>
            {LANG.close}
          </Button>

          {this.state.step > 0 ? <Button color="primary" onClick={this.previousStep}>
            {LANG.previous}
          </Button> : <div />}

          {this.state.step === 0 && <Button 
            color="primary" 
            disabled={this.state.selected.size === 0}
            onClick={this.nextStep}
            className={classes.to_end}
          >
            {LANG.next}
          </Button>}

          {this.state.step > 0 && <Button 
            color="secondary" 
            onClick={this.startErase} 
            className={classes.to_end}
          >
            {LANG.erase_tweets}
          </Button>}
        </DialogActions>
      </div>
    )
  }
}
