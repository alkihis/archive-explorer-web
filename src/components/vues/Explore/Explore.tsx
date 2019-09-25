import React, { ChangeEvent, FormEvent } from 'react';
import classes from './Explore.module.scss';
import { setPageTitle, isArchiveLoaded, getMonthText, uppercaseFirst, escapeRegExp } from '../../../helpers';
import SETTINGS from '../../../tools/Settings';
import NoArchive from '../../shared/NoArchive/NoArchive';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Typography, Divider, List, ListItem, ListItemText, ExpansionPanelSummary, ExpansionPanel as MuiExpansionPanel, ExpansionPanelDetails, withStyles, TextField } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import TweetViewer from '../../shared/TweetViewer/TweetViewer';
import { PartialTweet, TweetSearcher } from 'twitter-archive-reader';
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
  found: PartialTweet[] | null;
}

export default class Explore extends React.Component<{}, ExploreState> {
  state: ExploreState = {
    loaded: null,
    month: "",
    mobileOpen: false,
    found: null
  };

  protected searchContent: string = "";

  componentDidMount() {
    setPageTitle("Explore");
  }

  handleDrawerToggle = () => {
    this.setState({
      mobileOpen: !this.state.mobileOpen
    });
  };

  handleSearchChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    this.searchContent = event.target.value;
  };

  findTweets = (event?: FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Reset scroll position
    window.scrollTo(0, 0);

    let content = this.searchContent;
    let selected_month = "*";
    let selected_loaded: any = null;

    // Test si regex valide 
    try {
      new RegExp(content);
    } catch (e) {
      // escape
      content = escapeRegExp(content);
    }

    // Test si on doit chercher dans le mois en cours ou pas
    let tweets: PartialTweet[] = [];
    if (content.startsWith(':current ') && this.state.loaded) {
      content = content.replace(/^:current /, '').trim();
      tweets = TweetSearcher.search(this.state.loaded, content, "i");
      selected_month = this.state.month;
      selected_loaded = this.state.loaded;
    }
    else {
      tweets = TweetSearcher.search(SETTINGS.archive.all, content.trim(), "i");
    }

    // Change selected
    this.setState({
      found: tweets,
      month: selected_month,
      mobileOpen: false,
      loaded: selected_loaded,
    });
  };

  listOfYears() {
    const a = SETTINGS.archive.index.years;

    const years_sorted = Object.keys(a).sort((a, b) => Number(b) - Number(a));

    return (
      <div>
        <ExpansionPanel expanded={false}>
          <ExpansionPanelSummary>
            <Typography className="bold">Full archive</Typography>
          </ExpansionPanelSummary>
        </ExpansionPanel>
        <ListItem 
          button 
          className={"*" === this.state.month ? classes.selected_month : ""} 
          onClick={() => this.monthClicker("*", "")}
        >
          <ListItemText className={classes.drawer_month}>
            All ({SETTINGS.archive.length})
          </ListItemText>
        </ListItem>
        <ListItem 
          button 
          className={"day" === this.state.month ? classes.selected_month : ""} 
          onClick={() => this.monthClicker("day", "")}
        >
          <ListItemText className={classes.drawer_month}>
            Tweets of the day
          </ListItemText>
        </ListItem>

        {years_sorted.map(y => this.year(y))}

        <ListItem 
          className={classes.search_input}
        >
          <form onSubmit={this.findTweets} className={classes.full_w}>
            <TextField
              label="Find tweets"
              className={classes.textField}
              onChange={this.handleSearchChange}
              margin="normal"
            />
          </form>
        </ListItem>

        <ListItem 
          button 
          className={classes.search_btn} 
          onClick={() => this.findTweets()}
        >
          <ListItemText classes={{ primary: classes.get_back_paper + " " + classes.search_paper }}>
            <SearchIcon className={classes.get_back_icon} /> <span>Search in tweets</span>
          </ListItemText>
        </ListItem>
      </div>
    );
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
    if (year === "*") {
      this.setState({
        loaded: SETTINGS.archive.all,
        month: year,
        mobileOpen: false,
        found: null
      });
    }
    else if (year === "day") {
      // Find tweets of the day
      this.setState({
        loaded: SETTINGS.archive.day(),
        month: year,
        mobileOpen: false,
        found: null
      });
    }
    else {
      this.setState({
        loaded: SETTINGS.archive.month(month, year),
        month: year + "-" + month,
        mobileOpen: false,
        found: null
      });
    }
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
    let year = "", month_text = "Full archive";

    if (this.state.month !== "*" && this.state.month !== "day") {
      const [_year, month] = this.state.month.split('-');
      year = _year;
      month_text = uppercaseFirst(getMonthText(month));
    }
    else if (this.state.month === "day") {
      month_text = "Tweets of the day";
    }

    const tweets_number = this.state.loaded.length;

    return (
      <div className={classes.month_header}>
        {month_text} {year} <span className={classes.month_tweet_number}>
            <span className="bold">{tweets_number}</span> tweets
          </span>
      </div>
    );
  }

  showActiveSearch() {
    const tweets_number = this.state.found.length;
    const tweets_percentage = (tweets_number / SETTINGS.archive.all.length) * 100;

    const percentage_str = tweets_percentage < 0.1 ? tweets_percentage.toFixed(3) : tweets_percentage.toFixed(1);

    return (
      <div className={classes.month_header}>
        Search results <span className={classes.month_tweet_number}>
            <span className="bold">{tweets_number}</span> tweets <span className={classes.percentage}>({percentage_str}%)</span>
          </span>
      </div>
    );
  }

  content() {
    if (this.state.found) {
      return (
        <div>
          {this.showActiveSearch()}
          <TweetViewer tweets={this.state.found} />
        </div>
      );
    }
    else {
      return this.state.loaded ? 
      (<div>
        {this.showActiveMonth()}
        <TweetViewer tweets={this.state.loaded} />
      </div>) :
      this.noMonthSelected();
    }
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
        content={this.content()}
      />
    );
  }
}
