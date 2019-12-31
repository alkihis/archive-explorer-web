import React from 'react';
import classes from './Explore.module.scss';
import { setPageTitle, isArchiveLoaded, getMonthText, uppercaseFirst, escapeRegExp } from '../../../helpers';
import SETTINGS from '../../../tools/Settings';
import NoArchive from '../../shared/NoArchive/NoArchive';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Typography, Divider, List, ListItem, ListItemText, ExpansionPanelSummary, ExpansionPanel as MuiExpansionPanel, ExpansionPanelDetails, withStyles, TextField, Menu, MenuItem } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import TweetViewer from '../../shared/TweetViewer/TweetViewer';
import { PartialTweet, TweetSearcher } from 'twitter-archive-reader';
import { CenterComponent } from '../../../tools/PlacingComponents';
import LeftArrowIcon from '@material-ui/icons/KeyboardArrowLeft';
import ResponsiveDrawer from '../../shared/RespDrawer/RespDrawer';
import LANG from '../../../classes/Lang/Language';

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
  anchorSearch: HTMLElement | null;
}

export default class Explore extends React.Component<{}, ExploreState> {
  state: ExploreState = {
    loaded: null,
    month: "",
    mobileOpen: false,
    found: null,
    anchorSearch: null,
  };

  componentDidMount() {
    setPageTitle(LANG.explore);
  }

  handleDrawerToggle = () => {
    this.setState({
      mobileOpen: !this.state.mobileOpen
    });
  };

  findTweets = (content: string, settings?: string[]) => {
    // Reset scroll position
    window.scrollTo(0, 0);

    let selected_month = "*";
    let selected_loaded: any = null;

    // Test si regex valide 
    try {
      new RegExp(content);
    } catch (e) {
      // escape
      content = escapeRegExp(content);
    }

    let flags = "i";
    let search_in = ['text', 'user.screen_name', 'user.name'];
    if (settings) {
      if (settings.includes("case-sensitive")) {
        flags = "";
      }
      if (settings.includes("single-line")) {
        flags += "s";
      }
      if (!settings.includes("match-tn")) {
        search_in = ['text'];
      }
    }

    // Test si on doit chercher dans le mois en cours ou pas
    let tweets: PartialTweet[] = [];
    if (content.startsWith(':current ') && this.state.loaded) {
      content = content.replace(/^:current /, '').trim();
      tweets = TweetSearcher.search(this.state.loaded, content, flags, undefined, search_in);
      selected_month = this.state.month;
      selected_loaded = this.state.loaded;
    }
    else {
      tweets = TweetSearcher.search(SETTINGS.archive.all, content.trim(), flags, undefined, search_in);
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

    const ALLOWED_SEARCH_TYPES = {
      "case-sensitive": LANG.search_with_case_sensitive,
      "match-tn": LANG.search_match_tweet_name,
      "single-line": LANG.multiline_regex_dot,
    };

    const can_show_moments_decade = Date.now() < (new Date("2020-02-01")).getTime();

    return (
      <div>
        <ExpansionPanel expanded={false}>
          <ExpansionPanelSummary>
            <Typography className="bold">{LANG.full_archive}</Typography>
          </ExpansionPanelSummary>
        </ExpansionPanel>
        <ListItem 
          button 
          className={"*" === this.state.month ? classes.selected_month : ""} 
          onClick={() => this.monthClicker("*", "")}
        >
          <ListItemText className={classes.drawer_month}>
            {LANG.all} ({SETTINGS.archive.length})
          </ListItemText>
        </ListItem>

        <ListItem 
          button 
          className={"day" === this.state.month ? classes.selected_month : ""} 
          onClick={() => this.monthClicker("day", "")}
        >
          <ListItemText className={classes.drawer_month}>
            {LANG.tweets_of_the_day}
          </ListItemText>
        </ListItem>

        {SETTINGS.archive.is_gdpr && can_show_moments_decade && <ListItem 
          button 
          className={"moments" === this.state.month ? classes.selected_month : ""} 
          onClick={() => this.monthClicker("moments", "")}
        >
          <ListItemText className={classes.drawer_month}>
            {LANG.moments_of_decade}
          </ListItemText>
        </ListItem>}

        {years_sorted.map(y => this.year(y))}

        <SearchOptions
          onClick={(settings, text) => this.findTweets(text, settings)}
          options={ALLOWED_SEARCH_TYPES}
          default={["match-tn"]}
          fieldLabel={LANG.find_tweets}
        />
      </div>
    );
  }

  noMonthSelected() {
    return (
      <CenterComponent className={classes.no_tweets}>
        <LeftArrowIcon className={classes.icon} />
        <Typography variant="h5" style={{marginTop: "1rem", marginBottom: ".7rem"}}>
          {LANG.select_a_month}
        </Typography>

        <Typography variant="h6">
          {LANG.choose_month_tweets}.
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
    if (year === "*" || year === "moments") {
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
        loaded: SETTINGS.archive.fromThatDay(),
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
    let year = "", month_text = LANG.full_archive;
    
    if (this.state.month !== "*" && this.state.month !== "day" && this.state.month !== "moments") {
      const [_year, month] = this.state.month.split('-');
      year = _year;
      month_text = uppercaseFirst(getMonthText(month));
    }
    else if (this.state.month === "day") {
      month_text = LANG.tweets_of_the_day;
    }
    else if (this.state.month === "moments") {
      month_text = LANG.moments_of_decade;
    }

    const tweets_number = this.state.loaded.length;

    return (
      <div className={classes.month_header}>
        {month_text} {year} {" "}
        {this.state.month !== 'moments' && <span className={classes.month_tweet_number}>
          <span className="bold">{tweets_number}</span> tweets
        </span>}
      </div>
    );
  }

  showActiveSearch() {
    const tweets_number = this.state.found.length;
    const tweets_percentage = (tweets_number / SETTINGS.archive.all.length) * 100;

    const percentage_str = tweets_percentage < 0.1 ? tweets_percentage.toFixed(3) : tweets_percentage.toFixed(1);

    return (
      <div className={classes.month_header}>
        {LANG.search_results} <span className={classes.month_tweet_number}>
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
          <TweetViewer tweets={this.state.found} withMoments={this.state.month === "moments"} />
        </div>
      );
    }
    else {
      return this.state.loaded ? 
      (<div>
        {this.showActiveMonth()}
        <TweetViewer tweets={this.state.loaded} withMoments={this.state.month === "moments"} />
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
        title={LANG.explore}
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

export function SearchOptions<T>(props: { 
  onClick?: (modes: (keyof T)[], text: string) => void;
  options: T,
  default?: (keyof T)[],
  fieldLabel?: string
}) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [position, setPosition] = React.useState({ left: 0, top: 0 });
  const [options, setOptions] = React.useState(props.default ? props.default as string[] : []);
  const [searchInput, setSearchInput] = React.useState("");

  function handleClose() {
    setAnchorEl(null);
  }

  function onContextMenu(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    setAnchorEl(e.currentTarget);
    setPosition({ left: e.clientX + 1, top: e.clientY });
    e.preventDefault();
    e.stopPropagation();
  }

  function handleMenuClick(e: React.MouseEvent<HTMLLIElement, MouseEvent>) {
    const d = e.currentTarget;
    const elem = d.dataset.item;

    if (options.includes(elem)) {
      setOptions(options.filter(item => item !== elem));
    }
    else {
      setOptions([...options, elem]);
    }
  }

  function handleClick() {
    if (props.onClick)
      props.onClick(options as (keyof T)[], searchInput);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    handleClick();
  }

  function handleSearchInputChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setSearchInput(event.target.value);
  }

  return (
    <>
      <ListItem 
        className={classes.search_input}
      >
        <form onSubmit={handleSubmit} className={classes.full_w}>
          <TextField
            label={props.fieldLabel}
            className={classes.textField}
            onChange={handleSearchInputChange}
            margin="normal"
          />
        </form>
      </ListItem>

      <ListItem 
        button 
        className={classes.search_btn} 
        onClick={handleClick}
        onContextMenu={onContextMenu}
      >
        <ListItemText classes={{ primary: classes.get_back_paper + " " + classes.search_paper }}>
          <SearchIcon className={classes.get_back_icon} /> <span>{LANG.search_now}</span>
        </ListItemText>
      </ListItem>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorPosition={position}
        anchorReference="anchorPosition"
      >
        <MenuItem disabled dense>
          {LANG.search_options}
        </MenuItem>

        {Object.entries(props.options).map(([option, text]) => (
          <MenuItem
            data-item={option}
            key={option}
            onClick={handleMenuClick} 
            className={options.includes(option) ? classes.clicked : ""}
          >
            {text}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
