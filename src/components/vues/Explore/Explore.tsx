import React from 'react';
import classes from './Explore.module.scss';
import { setPageTitle, isArchiveLoaded, getMonthText, uppercaseFirst, escapeRegExp, scoreOfTweet } from '../../../helpers';
import SETTINGS from '../../../tools/Settings';
import NoArchive from '../../shared/NoArchive/NoArchive';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Typography, Divider, List, ListItem, ListItemText, ExpansionPanelSummary, ExpansionPanel as MuiExpansionPanel, ExpansionPanelDetails, withStyles, TextField, Menu, MenuItem, makeStyles, createStyles, Theme, Dialog, DialogContent, DialogActions, DialogTitle, Button, Hidden } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import TweetViewer from '../../shared/TweetViewer/TweetViewer';
import { PartialTweet, TweetSearcher, TwitterHelpers } from 'twitter-archive-reader';
import { CenterComponent } from '../../../tools/PlacingComponents';
import LeftArrowIcon from '@material-ui/icons/KeyboardArrowLeft';
import ResponsiveDrawer from '../../shared/RespDrawer/RespDrawer';
import LANG from '../../../classes/Lang/Language';
import { TweetSearchHistory, DMSearchHistory } from '../../../tools/SearchHistory';

import Autocomplete from '@material-ui/lab/Autocomplete';
import SpeedDial from '@material-ui/lab/SpeedDial';
import SpeedDialAction from '@material-ui/lab/SpeedDialAction';
import InsertChartIcon from '@material-ui/icons/InsertChart';
import TweetCountChartIcon from '@material-ui/icons/ShowChart';
import MostMentionnedIcon from '@material-ui/icons/Forum';
import AdvancedSearchIcon from '@material-ui/icons/Create';
import TweetNumberChart from '../../charts/TweetNumberChart/TweetNumberChart';
import MostMentionned from '../../charts/MostMentionned/MostMentionned';
import CustomTooltip from '../../shared/CustomTooltip/CustomTooltip';
import { toast } from '../../shared/Toaster/Toaster';
import ComposeSearchModal from './SearchComposer';


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
  
  get can_show_speeddial() {
    return !!this.state.month && (!this.is_special_month || this.is_all) && !this.state.found;
  }

  get is_special_month() {
    return this.state.month.split('-').length === 1;
  }

  get can_use_current_in_search() {
    return !this.is_special_month || this.state.month === "day";
  } 

  get is_all() {
    return this.state.month === "*";
  }

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
    let tweets: PartialTweet[];
    try {
      if (content.startsWith(':current ') && this.state.loaded) {
        content = content.replace(/^:current /, '').trim();
        tweets = TweetSearcher.search(this.state.loaded, content, flags, undefined, search_in);
        selected_month = this.state.month;
        selected_loaded = this.state.loaded;
      }
      else {
        tweets = TweetSearcher.search(SETTINGS.archive.tweets, content.trim(), flags, undefined, search_in);
      }
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.match(/\S+: Invalid query/)) {
        const keyword = msg.split(':')[0];
        toast(LANG.format("invalid_query", keyword), "error");
      }
      else {
        console.error("Unexpected error during search:", e);
        toast(LANG.search_cannot_be_made, "error");
      }

      return;
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
    const a = SETTINGS.archive.tweets.index;

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
            {LANG.all} ({SETTINGS.archive.tweets.length})
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
          explorerInstance={this}
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
    const months = SETTINGS.archive.tweets.index[year];
    for (const m in months) {
      i += Object.keys(months[m]).length;
    }

    return (
      <ExpansionPanel key={"year" + year} TransitionProps={{ unmountOnExit: true }}>
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
        loaded: SETTINGS.archive.tweets.all,
        month: year,
        mobileOpen: false,
        found: null
      });
    }
    else if (year === "day") {
      // Find tweets of the day
      this.setState({
        loaded: SETTINGS.archive.tweets.fromThatDay(),
        month: year,
        mobileOpen: false,
        found: null
      });
    }
    else {
      this.setState({
        loaded: SETTINGS.archive.tweets.month(month, year),
        month: year + "-" + month,
        mobileOpen: false,
        found: null
      });
    }
  }

  listOfMonths(year: string) {
    const current_year = SETTINGS.archive.tweets.index[year];

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
    const tweets_percentage = (tweets_number / SETTINGS.archive.tweets.length) * 100;

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
        <>
          {this.showActiveSearch()}
          <TweetViewer tweets={this.state.found} withMoments={this.state.month === "moments"} />
        </>
      );
    }
    else {
      return this.state.loaded ? 
      (<>
        {this.showActiveMonth()}
        <TweetViewer tweets={this.state.loaded} withMoments={this.state.month === "moments"} />
      </>) :
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
        content={<div>
          {this.content()}
          <StatisticsSpeedDial month={this.state.month} hidden={!this.can_show_speeddial} loaded={this.state.loaded} />
        </div>}
      />
    );
  }
}

export function SearchOptions<T>(props: { 
  onClick?: (modes: (keyof T)[], text: string) => void;
  options: T,
  default?: (keyof T)[],
  fieldLabel?: string,
  isDM?: boolean,
  explorerInstance?: Explore,
}) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [position, setPosition] = React.useState({ left: 0, top: 0 });
  const [options, setOptions] = React.useState(props.default ? props.default as string[] : []);
  const [searchInput, setSearchInput] = React.useState("");
  const [modalAdvanced, setModalAdvanced] = React.useState(false);

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

  function handleClick(_?: any, data = searchInput) {
    if (props.isDM)
      DMSearchHistory.push(data);
    else
      TweetSearchHistory.push(data);
    
    if (props.onClick)
      props.onClick(options as (keyof T)[], data);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    handleClick();
  }

  function handleAutocompleteInputChange(value: string) {
    setSearchInput(value || "");
  }

  function clearHistory() {
    if (props.isDM)
      DMSearchHistory.clear();
    else
      TweetSearchHistory.clear();

    setAnchorEl(null);
    toast(LANG.history_cleared, "info")
  }

  function onAdvancedSearch(text: string) {
    setSearchInput(text);
    setModalAdvanced(false);
    handleClick(undefined, text);
  }

  const auto_complete_options = (props.isDM ? DMSearchHistory : TweetSearchHistory).get().reverse();

  return (
    <>
      {/* Modal composer + search input form */}
      <ListItem 
        className={classes.search_input}
      >
        {modalAdvanced && <ComposeSearchModal 
          onSearchMake={onAdvancedSearch} 
          onClose={() => setModalAdvanced(false)} 
          canSetCurrent={props.explorerInstance.can_use_current_in_search}
        />}

        {/* Search input */}
        <form onSubmit={handleSubmit} className={classes.full_w}>
          <Autocomplete
            freeSolo
            options={auto_complete_options}
            onInputChange={(_, v) => handleAutocompleteInputChange(v)}
            value={searchInput}
            closeText={LANG.close}
            clearText={LANG.clear_input}
            renderInput={params => (
              <TextField 
                {...params} 
                InputProps={{
                  style: { paddingRight: 24 },
                  ...(params.InputProps ? params.InputProps : {})
                }}
                label={props.fieldLabel} 
                className={classes.textField}
                margin="normal"
              />
            )}
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

      {!props.isDM && <Hidden xsDown>
        <ListItem 
          button 
          className={classes.advanced_search_btn} 
          onClick={() => setModalAdvanced(true)}
        >
          <ListItemText classes={{ primary: classes.get_back_paper + " " + classes.search_paper }}>
            <AdvancedSearchIcon className={classes.get_back_icon} /> <span>{LANG.advanced_search}</span>
          </ListItemText>
        </ListItem>
      </Hidden>}

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

        <MenuItem disabled dense>
          {LANG.search_history}
        </MenuItem>

        <MenuItem onClick={clearHistory}>
          {LANG.clear_history}
        </MenuItem>
      </Menu>
    </>
  );
}

//// -----
//// STATS
//// -----
const useStylesStats = makeStyles((theme: Theme) =>
  createStyles({
    speedDial: {
      position: 'fixed',
      bottom: 56 + theme.spacing(2),
      right: theme.spacing(2),
    },
  }),
);

interface SDAction {
  icon: JSX.Element;
  name: React.ReactNode;
  action: string;
  validate?: (month: string, loaded: PartialTweet[]) => boolean;
}

function StatsModal(props: React.PropsWithChildren<{ 
  onClose?: () => void, 
  title: React.ReactNode, 
  fullWidth?: boolean,
}>) {
  return (
    <Dialog open fullWidth={props.fullWidth} onClose={props.onClose} maxWidth="xl">
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        {props.children}
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} color="primary" autoFocus>
          {LANG.close}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function StatisticsSpeedDial(props: { hidden?: boolean, month: string, loaded: PartialTweet[] }) {
  const classes = useStylesStats(props);
  const [open, setOpen] = React.useState(false);
  const [action, setAction] = React.useState("");

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAction = (action: SDAction) => {
    handleClose();
    setAction(action.action);
  };

  const handleModalClose = () => {
    setAction("");
  };

  function renderModal() {
    if (!action) {
      return "";
    }
    if (!props.loaded || !props.month) {
      return "";
    }

    // if (action === 'wordcloud') {
    //   return (
    //     <StatsModal 
    //       onClose={handleModalClose}
    //       title={LANG.wordcloud_modal_title}
    //     >
    //       <WordCloud tweets={props.loaded} /> 
    //     </StatsModal>
    //   );
    // }
    if (action === 'tweet') {
      const month_year = props.month.split('-', 2);
      const dayView = month_year.length > 1 ? { year: month_year[0], month: month_year[1] } : undefined;

      return (
        <StatsModal
          onClose={handleModalClose}
          title={LANG.tweet_count_modal_title}
          fullWidth
        >
          <TweetNumberChart dayView={dayView} trimAt={dayView ? 0 : 5} />
        </StatsModal>
      );
    }
    else if (action === 'mention') {
      return (
        <StatsModal
          onClose={handleModalClose}
          title={LANG.most_mentionned_modal_title}
        >
          <MostMentionned tweets={props.loaded} month={props.month === "*" ? undefined : props.month} />
        </StatsModal>
      );
    }

    return "";
  }

  function wrapTitle(title: string) {
    return <Typography component="span" style={{ fontSize: 16 }}>
      {title}
    </Typography>;
  }

  const actions: SDAction[] = [{
    icon: <TweetCountChartIcon />,
    name: wrapTitle(LANG.tweet_count_chart),
    action: "tweet",
    validate: month => {
      return month && (month.split('-').length > 1 || month === "*");
    },
  }, {
    icon: <MostMentionnedIcon />,
    name: wrapTitle(LANG.most_mentionned),
    action: "mention",
  }];

  return (
    <Hidden smDown>
      {renderModal()}
      <CustomTooltip title={LANG.statistics}>
        <SpeedDial
          ariaLabel="SpeedDial openIcon example"
          className={classes.speedDial}
          hidden={props.hidden}
          icon={<InsertChartIcon />}
          onClose={handleClose}
          onOpen={handleOpen}
          open={open}
        >
          {actions
            .filter(a => a.validate ? a.validate(props.month, props.loaded) : true)
            .map((action, index) => (
              <SpeedDialAction
                key={index}
                icon={action.icon}
                tooltipTitle={action.name}
                onClick={() => handleAction(action)}
              />
            ))}
        </SpeedDial>
      </CustomTooltip>
    </Hidden>
  );
}

/**
 * Define new TweetSearcher keywords
 */

TweetSearcher.validators.push({
  keyword: 'year',
  separator: [":", ">=", "<=", ">", "<"],
  validator: (query, sep) => {
    const year = parseInt(query, 10);

    if (isNaN(year)) {
      return;
    }

    switch (sep) {
      case ">":
        return tweet => TwitterHelpers.dateFromTweet(tweet).getFullYear() > year;
      case ">=":
        return tweet => TwitterHelpers.dateFromTweet(tweet).getFullYear() >= year;
      case "<":
        return tweet => TwitterHelpers.dateFromTweet(tweet).getFullYear() < year;
      case "<=":
        return tweet => TwitterHelpers.dateFromTweet(tweet).getFullYear() <= year;
      case ":":
        return tweet => TwitterHelpers.dateFromTweet(tweet).getFullYear() === year;
    }
  }
}, {
  keyword: 'month',
  separator: [":", ">=", "<=", ">", "<"],
  validator: (query, sep) => {
    // in Date objects, month starts at 0
    const month = parseInt(query, 10) - 1;

    if (isNaN(month)) {
      return;
    }

    switch (sep) {
      case ">":
        return tweet => TwitterHelpers.dateFromTweet(tweet).getMonth() > month;
      case ">=":
        return tweet => TwitterHelpers.dateFromTweet(tweet).getMonth() >= month;
      case "<":
        return tweet => TwitterHelpers.dateFromTweet(tweet).getMonth() < month;
      case "<=":
        return tweet => TwitterHelpers.dateFromTweet(tweet).getMonth() <= month;
      case ":":
        return tweet => TwitterHelpers.dateFromTweet(tweet).getMonth() === month;
    }
  }
}, {
  keyword: 'day',
  separator: [":", ">=", "<=", ">", "<"],
  validator: (query, sep) => {
    const day = parseInt(query, 10);

    if (isNaN(day)) {
      return;
    }

    switch (sep) {
      case ">":
        return tweet => TwitterHelpers.dateFromTweet(tweet).getDate() > day;
      case ">=":
        return tweet => TwitterHelpers.dateFromTweet(tweet).getDate() >= day;
      case "<":
        return tweet => TwitterHelpers.dateFromTweet(tweet).getDate() < day;
      case "<=":
        return tweet => TwitterHelpers.dateFromTweet(tweet).getDate() <= day;
      case ":":
        return tweet => TwitterHelpers.dateFromTweet(tweet).getDate() === day;
    }
  }
}, {
  keyword: 'popularity',
  separator: [":", ">=", "<=", ">", "<"],
  validator: (query, sep) => {
    const pop = parseInt(query, 10);

    if (isNaN(pop)) {
      return;
    }

    switch (sep) {
      case ">":
        return tweet => scoreOfTweet(tweet) > pop;
      case ">=":
        return tweet => scoreOfTweet(tweet) >= pop;
      case "<":
        return tweet => scoreOfTweet(tweet) < pop;
      case "<=":
        return tweet => scoreOfTweet(tweet) <= pop;
      case ":":
        return tweet => scoreOfTweet(tweet) === pop;
    }
  }
}, {
  keyword: 'retweets',
  separator: [":", ">=", "<=", ">", "<"],
  validator: (query, sep) => {
    const rts = parseInt(query, 10);

    if (isNaN(rts)) {
      return;
    }

    switch (sep) {
      case ">":
        return tweet => tweet.retweet_count > rts;
      case ">=":
        return tweet => tweet.retweet_count >= rts;
      case "<":
        return tweet => tweet.retweet_count < rts;
      case "<=":
        return tweet => tweet.retweet_count <= rts;
      case ":":
        return tweet => tweet.retweet_count === rts;
    }
  }
}, {
  keyword: 'favorites',
  separator: [":", ">=", "<=", ">", "<"],
  validator: (query, sep) => {
    const rts = parseInt(query, 10);

    if (isNaN(rts)) {
      return;
    }

    switch (sep) {
      case ">":
        return tweet => tweet.favorite_count > rts;
      case ">=":
        return tweet => tweet.favorite_count >= rts;
      case "<":
        return tweet => tweet.favorite_count < rts;
      case "<=":
        return tweet => tweet.favorite_count <= rts;
      case ":":
        return tweet => tweet.favorite_count === rts;
    }
  }
});
