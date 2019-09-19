import React, { ChangeEvent, FormEvent } from 'react';
import classes from './DMConversation.module.scss';
import { Conversation, LinkedDirectMessage } from 'twitter-archive-reader';
import { Divider, ExpansionPanel as MuiExpansionPanel, ExpansionPanelSummary, Typography, ExpansionPanelDetails, List, ListItem, ListItemText, TextField, Fab } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { CenterComponent } from '../../../tools/PlacingComponents';
import LeftArrowIcon from '@material-ui/icons/KeyboardArrowLeft';
import SearchIcon from '@material-ui/icons/Search';
import { uppercaseFirst, getMonthText, specialJoin, escapeRegExp } from '../../../helpers';
import DMContainer from './DMContainer';
import { withStyles } from '@material-ui/styles';
import UserCache from '../../../classes/UserCache';
import ResponsiveDrawer from '../../shared/RespDrawer/RespDrawer';

const ExpansionPanel = withStyles({
  root: {
    borderTop: '1px solid rgba(0, 0, 0, .125)',
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

type DMProps = {
  conversation: Conversation;
  getBack: () => void;
};

type DMState = {
  selected: LinkedDirectMessage[] | null;
  month: string;
  key: string;
  mobileOpen: boolean;
  found: LinkedDirectMessage[] | null;
  from: string | null;
};

export default class DMConversation extends React.Component<DMProps, DMState> {
  state: DMState = {
    selected: null,
    month: "",
    key: "",
    mobileOpen: false,
    found: null,
    from: null
  };

  protected searchContent: string;

  protected index = this.props.conversation.index;

  get conv() {
    return this.props.conversation;
  }

  handleDrawerToggle = () => {
    this.setState({
      mobileOpen: !this.state.mobileOpen
    });
  }

  handleSearchChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    this.searchContent = event.target.value;
  };

  handleDmClick = (id: string) => {
    const msg = this.conv.single(id);

    if (msg) {
      this.monthClicker("*", "", id);
    }
  };

  findMsgs = (event?: FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    let content = this.searchContent;

    try {
      new RegExp(content);
    } catch (e) {
      content = escapeRegExp(content);
    }

    // Reset scroll position
    window.scrollTo(0, 0);

    const msgs = this.conv.find(new RegExp(content, "i"));

    // Change selected
    this.setState({
      found: msgs.all,
      key: String(Math.random()),
      from: null,
      month: "",
      mobileOpen: false,
      selected: null,
    });

    return false;
  };

  listOfYears() {
    const a = this.conv.raw_index;

    const years_sorted = Object.keys(a).sort((a, b) => Number(b) - Number(a));

    return (
      <div>
        <ListItem 
          button 
          className={classes.back_btn} 
          onClick={this.props.getBack}
        >
          <ListItemText classes={{ primary: classes.get_back_paper }}>
            <LeftArrowIcon className={classes.get_back_icon} /> <span>Back to conversations</span>
          </ListItemText>
        </ListItem>

        <ExpansionPanel expanded={false}>
          <ExpansionPanelSummary>
            <Typography className="bold">Full conversation</Typography>
          </ExpansionPanelSummary>
        </ExpansionPanel>
        <ListItem 
          button 
          className={"*" === this.state.month ? classes.selected_month : ""} 
          onClick={() => this.monthClicker("*", "")}
        >
          <ListItemText className={classes.drawer_month}>
            All ({this.conv.length})
          </ListItemText>
        </ListItem>

        {years_sorted.map(y => this.year(y))}

        <ListItem 
          className={classes.search_input}
        >
          <form onSubmit={this.findMsgs} className={classes.full_w}>
            <TextField
              label="Find DMs"
              className={classes.textField}
              onChange={this.handleSearchChange}
              margin="normal"
            />
          </form>
        </ListItem>

        <ListItem 
          button 
          className={classes.search_btn} 
          onClick={() => this.findMsgs()}
        >
          <ListItemText classes={{ primary: classes.get_back_paper + " " + classes.search_paper }}>
            <SearchIcon className={classes.get_back_icon} /> <span>Find messages</span>
          </ListItemText>
        </ListItem>
      </div>
    );
  }

  noMonthSelected() {
    return (
      <CenterComponent className={classes.no_msg}>
        <LeftArrowIcon className={classes.icon} />
        <Typography variant="h5" style={{marginTop: "1rem", marginBottom: ".7rem"}}>
          Select a month
        </Typography>

        <Typography variant="h6">
          Choose a month to see your direct messages.
        </Typography>
      </CenterComponent>
    );
  }

  noSearchResults() {
    return (
      <CenterComponent className={classes.no_msg}>
        <SearchIcon className={classes.icon} />
        <Typography variant="h5" style={{marginTop: "1rem", marginBottom: ".7rem"}}>
          Not found
        </Typography>

        <Typography variant="h6">
          Your search hasn't returned any result.
        </Typography>
      </CenterComponent>
    );
  }

  year(year: string) {
    return (
      <ExpansionPanel key={"year" + year}>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
        >
          <Typography>
            <span className="bold">{year}</span> <span className={classes.year_count}>({this.index.years[year].count})</span>
          </Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails style={{padding: '0'}}>
          {this.listOfMonths(year)}
        </ExpansionPanelDetails>
      </ExpansionPanel>
    )
  }

  monthClicker(year: string, month: string, from: string | null = null) {
    // Reset scroll position
    window.scrollTo(0, 0);

    this.setState({
      selected: year === "*" ? this.conv.all : this.conv.month(month, year).all,
      month: year === "*" ? "*" : year + "-" + month,
      key: String(Math.random()),
      mobileOpen: false,
      found: null,
      from
    });
  }

  listOfMonths(year: string) {
    const current_year = this.index.years[year];

    return (
      <List className={classes.list_month}>
        {Object.entries(current_year.months).map(([month, dms]) => (
          <ListItem 
            button 
            key={year + "-" + month} 
            className={year + "-" + month === this.state.month ? classes.selected_month : ""} 
            onClick={() => this.monthClicker(year, month)}
          >
            <ListItemText className={classes.drawer_month}>
              {getMonthText(month)} ({dms.count})
            </ListItemText>
          </ListItem>
        ))}
      </List>
    )
  }

  showHeaderConv() {
    // Existe uniquement si c'est une conversation simple
    // et que l'utilisateur est en cache
    const p = [...this.conv.real_participants][0];
    const user = UserCache.getFromCache(p);

    if (user && !this.conv.is_group_conversation) {
      return (
        <img className={classes.conv_header_img} src={user.profile_banner_url} />
      );
    }
  }

  showActiveMonth() {
    let month_text = "All messages";
    let year = "";

    if (this.state.month !== "*") {
      const [_year, month] = this.state.month.split('-');
      year = _year;
      month_text = uppercaseFirst(getMonthText(month));
    }
    const msg_number = this.state.selected.length;

    return (
      <div className={classes.month_header}>
        {month_text} {year} <span className={classes.month_msg_number}>
          <span className="bold">{msg_number}</span> message{msg_number > 1 ? "s" : ""}
        </span>
      </div>
    );
  }

  showActiveSearch() {
    let month_text = "Search results";
    const msg_number = this.state.found.length;

    return (
      <div className={classes.month_header}>
        {month_text} <span className={classes.month_msg_number}>
          <span className="bold">{msg_number}</span> message{msg_number > 1 ? "s" : ""}
        </span>
      </div>
    );
  }

  drawer() {
    return (
      <div>
        <div className={classes.toolbar} />
        <Divider />
        {this.listOfYears()}
      </div>
    );
  }

  content() {
    if (this.state.found) {
      return (
        <div>
          {this.showHeaderConv()}

          <div className={classes.inner_content}>
            {this.state.found && this.state.found.length ? 
              (<div>
                {this.showActiveSearch()}
                <DMContainer key={this.state.key} messages={this.state.found} onDmClick={this.handleDmClick} />
              </div>) :
              this.noSearchResults()
            }
          </div>
        </div>
      );
    }
    else {
      return (
        <div>
          {this.showHeaderConv()}

          <div className={classes.inner_content}>
            {this.state.selected ? 
              (<div>
                {this.showActiveMonth()}
                <DMContainer key={this.state.key} messages={this.state.selected} from={this.state.from} />
              </div>) :
              this.noMonthSelected()
            }
          </div>
        </div>
      );
    }
  }

  render() {
    return (
      <ResponsiveDrawer
        handleDrawerToggle={this.handleDrawerToggle}
        mobileOpen={this.state.mobileOpen}
        title={"Conversation with " + this.participants}
        noPadding
        drawer={this.drawer()}
        content={this.content()}
      />
    );
  }

  get participants() {
    const names = [...this.conv.real_participants]
      .map(e => {
        const user = UserCache.getFromCache(e);
        return user ? user.name : '#' + e;
      });

    return specialJoin(names);
  }
}
