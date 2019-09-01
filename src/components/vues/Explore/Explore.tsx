import React from 'react';
import classes from './Explore.module.scss';
import { setPageTitle, isArchiveLoaded, getMonthText } from '../../../helpers';
import SETTINGS from '../../../tools/Settings';
import NoArchive from '../../shared/NoArchive/NoArchive';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { CssBaseline, AppBar, Toolbar, Typography, Drawer, Divider, List, ListItem, ListItemText, ExpansionPanelSummary, ExpansionPanel as MuiExpansionPanel, ExpansionPanelDetails, withStyles } from '@material-ui/core';
import TweetViewer from '../../shared/TweetViewer/TweetViewer';
import { PartialTweet } from 'twitter-archive-reader';

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
}

export default class Explore extends React.Component<{}, ExploreState> {
  state: ExploreState = {
    loaded: null
  };

  componentDidMount() {
    setPageTitle("Explore");
  }

  listOfYears() {
    const a = SETTINGS.archive.index.years;

    const years_sorted = Object.keys(a).sort((a, b) => Number(b) - Number(a));

    return years_sorted.map(y => this.year(y));
  }

  year(year: string) {
    return (
      <ExpansionPanel>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
        >
          <Typography className="bold">{year}</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails style={{padding: '0'}}>
          {this.listOfMonths(year)}
        </ExpansionPanelDetails>
      </ExpansionPanel>
    )
  }

  monthClicker(year: string, month: string) {
    console.log("Getting tweets");
    this.setState({
      loaded: SETTINGS.archive.month(month, year)
    });
  }

  listOfMonths(year: string) {
    const current_year = SETTINGS.archive.index.years[year];

    return (
      <List className={classes.list_month}>
        {Object.entries(current_year).map(([month, tweets]) => (
          <ListItem button key={year + "-" + month} onClick={() => this.monthClicker(year, month)}>
            <ListItemText className={classes.drawer_month}>
              {getMonthText(month)} ({Object.keys(tweets).length})
            </ListItemText>
          </ListItem>
        ))}
      </List>
    )
  }

  emptyLoad() {
    return <div>No month selected</div>;
  }

  render() {
    if (!isArchiveLoaded()) {
      return <NoArchive />;
    }

    return (
      <div style={{display: 'flex'}}>
        <AppBar position="fixed" className={classes.appBar}>
          <Toolbar>
            <Typography variant="h6" noWrap>
              Explore
            </Typography>
          </Toolbar>
        </AppBar>

        <div style={{width: '100%'}}>
          <Drawer 
            className={classes.drawer}
            variant="permanent"
            classes={{
              paper: classes.drawerPaper,
              root: classes.test,
            }}
            PaperProps={{
              style: { height: 'calc(100% - 64px - 56px)', bottom: '56px', top: 'unset', zIndex: 'unset' }
            }}
            anchor="left"
          >
            <div className={classes.toolbar} />
            <Divider />
            {this.listOfYears()}
          </Drawer>
        
          <main className={classes.content}>
            {this.state.loaded ? 
              <TweetViewer tweets={this.state.loaded} /> :
              this.emptyLoad()
            }
          </main>
        </div>
      </div>
    );
  }
}
