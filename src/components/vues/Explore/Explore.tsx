import React from 'react';
import classes from './Explore.module.scss';
import { setPageTitle, isArchiveLoaded, getMonthText, uppercaseFirst } from '../../../helpers';
import SETTINGS from '../../../tools/Settings';
import NoArchive from '../../shared/NoArchive/NoArchive';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { AppBar, Toolbar, Typography, Drawer, Divider, List, ListItem, ListItemText, ExpansionPanelSummary, ExpansionPanel as MuiExpansionPanel, ExpansionPanelDetails, withStyles } from '@material-ui/core';
import TweetViewer from '../../shared/TweetViewer/TweetViewer';
import { PartialTweet } from 'twitter-archive-reader';
import { CenterComponent } from '../../../tools/PlacingComponents';
import LeftArrowIcon from '@material-ui/icons/KeyboardArrowLeft';
import ResponsiveDrawer from '../../shared/RespDrawer/RespDrawer';

const ExpansionPanel = withStyles({
  root: {
    border: '1px solid rgba(0, 0, 0, .125)',
    borderBottomLeftRadius: '0 !important',
    borderBottomRightRadius: '0 !important',
    boxShadow: 'none',
    '&:not(:last-child)': {
      borderBottom: 0,
    },
    '&:before': {
      display: 'none',
    },
    '&$expanded': {
      margin: '0 !important',
    },
  },
  expanded: {},
})(MuiExpansionPanel);

type ExploreState = {
  loaded: PartialTweet[] | null;
  month: string;
  mobileOpen: boolean;
}

export default class Explore extends React.Component<{}, ExploreState> {
  state: ExploreState = {
    loaded: null,
    month: "",
    mobileOpen: false
  };

  componentDidMount() {
    setPageTitle("Explore");
  }

  handleDrawerToggle = () => {
    this.setState({
      mobileOpen: !this.state.mobileOpen
    });
  }

  listOfYears() {
    const a = SETTINGS.archive.index.years;

    const years_sorted = Object.keys(a).sort((a, b) => Number(b) - Number(a));

    return years_sorted.map(y => this.year(y));
  }

  noMonthSelected() {
    return (
      <CenterComponent className={classes.no_tweets}>
        <LeftArrowIcon className={classes.icon} />
        <Typography variant="h5" style={{marginTop: "1rem", marginBottom: ".7rem"}}>
          Select a month
        </Typography>

        <Typography variant="h6">
          Choose a month to see your tweets.
        </Typography>
      </CenterComponent>
    );
  }

  year(year: string) {
    let i = 0;
    const months = SETTINGS.archive.index.years[year];
    for (const m in months) {
      i += Object.keys(months[m]).length;
    }

    return (
      <ExpansionPanel key={"year" + year}>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
        >
          <Typography><span className="bold">{year}</span> <span className={classes.year_count}>({i})</span></Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails style={{padding: '0'}}>
          {this.listOfMonths(year)}
        </ExpansionPanelDetails>
      </ExpansionPanel>
    )
  }

  monthClicker(year: string, month: string) {
    this.setState({
      loaded: SETTINGS.archive.month(month, year),
      month: year + "-" + month,
      mobileOpen: false
    });
  }

  listOfMonths(year: string) {
    const current_year = SETTINGS.archive.index.years[year];

    return (
      <List className={classes.list_month}>
        {Object.entries(current_year).map(([month, tweets]) => (
          <ListItem 
            button 
            key={year + "-" + month} 
            className={year + "-" + month === this.state.month ? classes.selected_month : ""} 
            onClick={() => this.monthClicker(year, month)}
          >
            <ListItemText className={classes.drawer_month}>
              {getMonthText(month)} ({Object.keys(tweets).length})
            </ListItemText>
          </ListItem>
        ))}
      </List>
    )
  }

  showActiveMonth() {
    const [year, month] = this.state.month.split('-');
    const month_text = uppercaseFirst(getMonthText(month));
    const tweets_number = this.state.loaded.length;

    return (
      <div className={classes.month_header}>
        {month_text} {year} <span className={classes.month_tweet_number}>
            <span className="bold">{tweets_number}</span> tweets
          </span>
      </div>
    );
  }

  render() {
    if (!isArchiveLoaded()) {
      return <NoArchive />;
    }

    return (
      <ResponsiveDrawer 
        handleDrawerToggle={this.handleDrawerToggle}
        mobileOpen={this.state.mobileOpen}
        title="Explore"
        drawer={<div>
          <div className={classes.toolbar} />
          <Divider />
          {this.listOfYears()}
        </div>}
        content={this.state.loaded ? 
          (<div>
            {this.showActiveMonth()}
            <TweetViewer tweets={this.state.loaded} />
          </div>) :
          this.noMonthSelected()
        }
      />
    );
  }
}
