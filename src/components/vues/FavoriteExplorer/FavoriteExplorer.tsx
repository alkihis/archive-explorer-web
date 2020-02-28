import React from 'react';
import classes from '../Explore/Explore.module.scss';
import { setPageTitle, isArchiveLoaded, getMonthText, uppercaseFirst, escapeRegExp } from '../../../helpers';
import SETTINGS from '../../../tools/Settings';
import NoArchive from '../../shared/NoArchive/NoArchive';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Typography, Divider, List, ListItem, ListItemText, ExpansionPanelSummary, ExpansionPanel as MuiExpansionPanel, ExpansionPanelDetails, withStyles, Container } from '@material-ui/core';
import { PartialFavorite } from 'twitter-archive-reader';
import { CenterComponent } from '../../../tools/PlacingComponents';
import LeftArrowIcon from '@material-ui/icons/KeyboardArrowLeft';
import ResponsiveDrawer from '../../shared/RespDrawer/RespDrawer';
import LANG from '../../../classes/Lang/Language';
import { toast } from '../../shared/Toaster/Toaster';
import { SearchOptions } from '../Explore/Explore';
import Favorites from '../More/Favorites';
import NoGDPR from '../../shared/NoGDPR/NoGDPR';
import FavoriteIcon from '@material-ui/icons/Star';

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

type FavoriteExplorerState = {
  loaded: PartialFavorite[] | null;
  month: string;
  mobileOpen: boolean;
  found: PartialFavorite[] | null;
  anchorSearch: HTMLElement | null;
}

export default class FavoriteExplorer extends React.Component<{}, FavoriteExplorerState> {
  state: FavoriteExplorerState = {
    loaded: null,
    month: "",
    mobileOpen: false,
    found: null,
    anchorSearch: null,
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
      tester = new RegExp(content, flags);
    } catch (e) {
      // escape
      tester = new RegExp(escapeRegExp(content), flags);
    }

    // Test si on doit chercher dans le mois en cours ou pas
    let favorites: PartialFavorite[];
    try {
      if (content.startsWith(':current ') && this.state.loaded) {
        content = content.replace(/^:current /, '').trim();
        favorites = this.state.loaded.filter(f => tester.test(f.fullText!));
        selected_month = this.state.month;
        selected_loaded = this.state.loaded;
      }
      else {
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
            {LANG.all} ({SETTINGS.archive.favorites.length})
          </ListItemText>
        </ListItem>

        {years_sorted.map(y => this.year(y))}

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

          <Typography variant="h6">
            {LANG.choose_month_favorites}.
          </Typography>
        </CenterComponent>
      </Container>
    );
  }

  year(year: string) {
    let i = 0;
    const months = SETTINGS.archive.favorites.index[year];
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
        loaded: SETTINGS.archive.favorites.all,
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

    return (
      <List className={classes.list_month}>
        {Object.entries(current_year).map(([month, favorites]) => (
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
    )
  }

  showActiveMonth() {
    let year = "", month_text = LANG.full_archive;
    
    if (this.state.month !== "*") {
      const [_year, month] = this.state.month.split('-');
      year = _year;
      month_text = uppercaseFirst(getMonthText(month));
    }

    const tweets_number = this.state.loaded.length;

    return (
      <div className={classes.month_header}>
        {month_text} {year} {" "}
        {this.state.month !== 'moments' && <span className={classes.month_tweet_number}>
          <span className="bold">{tweets_number}</span> {LANG.format("favorited_tweets", "s")}
        </span>}
      </div>
    );
  }

  showActiveSearch() {
    return (
      <div className={classes.month_header}>
        {LANG.search_results}
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
        title={LANG.explore}
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

