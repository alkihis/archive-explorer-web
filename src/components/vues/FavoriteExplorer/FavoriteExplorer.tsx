import React from 'react';
import classes from '../Explore/Explore.module.scss';
import { setPageTitle, isArchiveLoaded, getMonthText, uppercaseFirst, escapeRegExp } from '../../../helpers';
import SETTINGS from '../../../tools/Settings';
import NoArchive from '../../shared/NoArchive/NoArchive';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Typography, Divider, List, ListItem, ListItemText, ExpansionPanelSummary, ExpansionPanelDetails, Container, Hidden } from '@material-ui/core';
import { PartialFavorite } from 'twitter-archive-reader';
import { CenterComponent } from '../../../tools/PlacingComponents';
import LeftArrowIcon from '@material-ui/icons/KeyboardArrowLeft';
import ResponsiveDrawer from '../../shared/RespDrawer/RespDrawer';
import LANG from '../../../classes/Lang/Language';
import { toast } from '../../shared/Toaster/Toaster';
import { SearchOptions, ExplorerExpansionPanel } from '../Explore/Explore';
import Favorites from './Favorites';
import NoGDPR from '../../shared/NoGDPR/NoGDPR';
import FavoriteIcon from '@material-ui/icons/Star';

type FavoriteExplorerState = {
  loaded: PartialFavorite[] | null;
  month: string;
  mobileOpen: boolean;
  found: PartialFavorite[] | null;
}

export default class FavoriteExplorer extends React.Component<{}, FavoriteExplorerState> {
  state: FavoriteExplorerState = {
    loaded: null,
    month: "",
    mobileOpen: false,
    found: null,
  };

  componentDidMount() {
    setPageTitle(LANG.explore_favorites);
  }

  handleDrawerToggle = () => {
    this.setState({
      mobileOpen: !this.state.mobileOpen
    });
  };

  get is_special_month() {
    return this.state.month.split('-').length === 1;
  }

  get is_all() {
    return this.state.month === "*";
  }

  findFavorites = (content: string, settings?: string[]) => {
    // Reset scroll position
    window.scrollTo(0, 0);

    let selected_month = "*";
    let selected_loaded: any = null;
    let tester: RegExp;

    // Test si regex valide 
    let flags = "i";

    if (settings.includes("case-sensitive")) {
      flags = "";
    }
    if (settings.includes("single-line")) {
      flags += "s";
    }

    try {
      new RegExp(content);
    } catch (e) {
      // escape
      content = escapeRegExp(content);
    }

    // Test si on doit chercher dans le mois en cours ou pas
    let favorites: PartialFavorite[];
    try {
      if (content.startsWith(':current ') && this.state.loaded) {
        content = content.replace(/^:current /, '').trim();

        tester = new RegExp(content, flags);

        favorites = this.state.loaded.filter(f => tester.test(f.fullText!));
        selected_month = this.state.month;
        selected_loaded = this.state.loaded;
      }
      else {
        tester = new RegExp(content, flags);
        favorites = SETTINGS.archive.favorites.all.filter(f => tester.test(f.fullText!));
      }
    } catch (e) {
      console.error("Unexpected error during search:", e);
      toast(LANG.search_cannot_be_made, "error");

      return;
    }

    // Change selected
    this.setState({
      found: favorites,
      month: selected_month,
      mobileOpen: false,
      loaded: selected_loaded,
    });
  };

  listOfYears() {
    const a = SETTINGS.archive.favorites.index;

    const years_sorted = Object.keys(a).sort((a, b) => Number(b) - Number(a));
    const ALLOWED_SEARCH_TYPES = {
      "case-sensitive": LANG.search_with_case_sensitive,
      "single-line": LANG.multiline_regex_dot,
    };

    // Find if years contain "before" snowflake tweets
    const year_2010 = years_sorted.find(e => e === "2010");
    let before_snowflake_element: React.ReactNode = "";
    if (year_2010) {
      const tweets_of_2010 = SETTINGS.archive.favorites.index[2010];
      const oct_month = Object.entries(tweets_of_2010).find(e => e[0] === "10");

      // BEFORE snowflake (all tweets to 2010-10-31)
      if (oct_month) {
        before_snowflake_element = (
          <ListItem 
            button 
            className={"2010-10" === this.state.month ? classes.selected_month : ""} 
            onClick={() => this.monthClicker("2010", "10")}
            style={{ border: '1px solid rgba(0, 0, 0, .125)', borderBottom: 0 }}
          >
            <ListItemText className={classes.drawer_old_fav}>
              <strong>
                {LANG.older_favorited_tweets_short}
              </strong>
              {" "}
              <span className={classes.year_count}>
                ({Object.keys(oct_month[1]).length})
              </span>
            </ListItemText>
          </ListItem>
        );
      }
    }

    return (
      <div>
        <ExplorerExpansionPanel expanded={false}>
          <ExpansionPanelSummary>
            <Typography className="bold">{LANG.full_archive}</Typography>
          </ExpansionPanelSummary>
        </ExplorerExpansionPanel>
        <ListItem 
          button 
          className={"*" === this.state.month ? classes.selected_month : ""} 
          onClick={() => this.monthClicker("*", "")}
        >
          <ListItemText className={classes.drawer_month}>
            {LANG.all} ({SETTINGS.archive.favorites.length})
          </ListItemText>
        </ListItem>

        <ListItem 
          button 
          className={"day" === this.state.month ? classes.selected_month : ""} 
          onClick={() => this.monthClicker("day", "")}
        >
          <ListItemText className={classes.drawer_month}>
            {LANG.favorites_of_the_day}
          </ListItemText>
        </ListItem>

        {years_sorted.map(y => this.year(y))}
        {before_snowflake_element}

        <SearchOptions
          onClick={(settings, text) => this.findFavorites(text, settings)}
          options={ALLOWED_SEARCH_TYPES}
          fieldLabel={LANG.find_favorites}
          isFavoriteExplorer
        />
      </div>
    );
  }

  noMonthSelected() {
    return (
      <Container>
        <CenterComponent className={classes.no_tweets}>
          <LeftArrowIcon className={classes.icon} />
          <Typography variant="h5" style={{marginTop: "1rem", marginBottom: ".7rem"}}>
            {LANG.select_a_month}
          </Typography>

          <Typography variant="h6" align="center">
            {LANG.choose_month_favorites}

            <br />

            {LANG.choose_month_favorites_p2}.
          </Typography>
        </CenterComponent>
      </Container>
    );
  }

  year(year: string) {
    let i = 0;
    const months = SETTINGS.archive.favorites.index[year];
    for (const m in months) {
      // Edge case: before snowflake tweets
      if (year === "2010" && Number(m) <= 10) {
        continue;
      }
      i += Object.keys(months[m]).length;
    }

    return (
      <ExplorerExpansionPanel key={"year" + year} TransitionProps={{ unmountOnExit: true }}>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
        >
          <Typography><span className="bold">{year}</span> <span className={classes.year_count}>({i})</span></Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails style={{padding: '0'}}>
          {this.listOfMonths(year)}
        </ExpansionPanelDetails>
      </ExplorerExpansionPanel>
    )
  }

  monthClicker(year: string, month: string) {
    if (year === "*") {
      this.setState({
        loaded: SETTINGS.archive.favorites.all,
        month: year,
        mobileOpen: false,
        found: null
      });
    }
    else if (year === "day") {
      // Find tweets of the day
      this.setState({
        loaded: SETTINGS.archive.favorites.fromThatDay(),
        month: year,
        mobileOpen: false,
        found: null
      });
    }
    else {
      this.setState({
        loaded: Object.values(SETTINGS.archive.favorites.index[year]?.[month] ?? []),
        month: year + "-" + month,
        mobileOpen: false,
        found: null
      });
    }
  }

  listOfMonths(year: string) {
    const current_year = SETTINGS.archive.favorites.index[year];
    let months = Object.entries(current_year);

    // CASE: 2010: (it can contains tweets before november 2010)
    if (year === "2010") {
      months = Object.entries(current_year).filter(e => Number(e[0]) > 10);
    }

    return (
      <List className={classes.list_month}>
        {months.map(([month, favorites]) => (
          <ListItem 
            button 
            key={year + "-" + month} 
            className={year + "-" + month === this.state.month ? classes.selected_month : ""} 
            onClick={() => this.monthClicker(year, month)}
          >
            <ListItemText className={classes.drawer_month}>
              {getMonthText(month)} ({Object.keys(favorites).length})
            </ListItemText>
          </ListItem>
        ))}
      </List>
    );
  }

  showActiveMonth() {
    let year = "", month_text = LANG.full_archive;
    let insert_br = false;
    
    if (this.state.month === "day") {
      month_text = LANG.favorites_of_the_day;
    }
    else if (this.state.month === "2010-10") {
      month_text = LANG.older_favorited_tweets;
      insert_br = true;
    }
    else if (this.state.month !== "*") {
      const [_year, month] = this.state.month.split('-');
      year = _year;
      month_text = uppercaseFirst(getMonthText(month));
    }

    const tweets_number = this.state.loaded.length;

    return (
      <div className={classes.month_header}>
        {month_text} {year} {" "}

        {insert_br && <Hidden mdUp>
          <br />
        </Hidden>}

        <span className={classes.month_tweet_number}>
          <span className="bold">{tweets_number}</span> {LANG.format("favorited_tweets", tweets_number > 1 ? "s" : "")}
        </span>
      </div>
    );
  }

  showActiveSearch() {
    const tweets_number = this.state.found.length;

    return (
      <div className={classes.month_header}>
        {LANG.search_results}{" "}
        <span className={classes.month_tweet_number}>
          <span className="bold">{tweets_number}</span> {LANG.format("favorited_tweets", tweets_number > 1 ? "s" : "")}
        </span>
      </div>
    );
  }

  content() {
    if (this.state.found) {
      return (
        <>
          {this.showActiveSearch()}
          <Favorites favorites={this.state.found} />
        </>
      );
    }
    else {
      return this.state.loaded ? 
      (<>
        {this.showActiveMonth()}
        <Favorites favorites={this.state.loaded} />
      </>) :
      this.noMonthSelected();
    }
  }

  render() {
    if (!isArchiveLoaded()) {
      return <NoArchive />;
    }

    if (!SETTINGS.archive.is_gdpr || !SETTINGS.archive.favorites.has_extended_favorites) {
      return <NoGDPR
        icon={FavoriteIcon} 
        message={LANG.archive_no_favorites} 
      />;
    }

    return (
      <ResponsiveDrawer 
        handleDrawerToggle={this.handleDrawerToggle}
        mobileOpen={this.state.mobileOpen}
        title={LANG.favorites}
        drawer={<div>
          <div className={classes.toolbar} />
          <Divider />
          {this.listOfYears()}
        </div>}
        content={<div>
          {this.content()}
        </div>}
      />
    );
  }
}

