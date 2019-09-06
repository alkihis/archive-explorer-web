import React, { KeyboardEvent } from 'react';
import ReactDOM from 'react-dom';
import classes from './Search.module.scss';
import { setPageTitle, isArchiveLoaded, escapeRegExp } from '../../../helpers';
import NoArchive from '../../shared/NoArchive/NoArchive';
import { AppBar, Toolbar, Typography, Card, CardContent, TextField, FormControl, FormGroup, FormControlLabel, Checkbox, Divider, FormLabel, RadioGroup, Radio, IconButton } from '@material-ui/core';
import { PartialTweet, TweetSearcher } from 'twitter-archive-reader';
import SETTINGS from '../../../tools/Settings';
import SearchIcon from '@material-ui/icons/Search';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TweetViewer from '../../shared/TweetViewer/TweetViewer';
import { toast } from '../../shared/Toaster/Toaster';

type SearchState = {
  searched: PartialTweet[];
  search_modal: boolean;
  c_i: boolean;
  regex: boolean;
  sort_reverse_chrono: boolean;
};

export default class Search extends React.Component<{}, SearchState> {
  state: SearchState;

  constructor(props: {}) {
    super(props);

    this.state = {
      searched: null,
      search_modal: true,
      c_i: true,
      regex: false,
      sort_reverse_chrono: SETTINGS.sort_reverse_chrono,
    };

    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  handleKeyPress(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' && this.state.search_modal){
      this.startSearch(this.getTextSearch());
    }
  }

  handleButtonClick() {
    this.startSearch(this.getTextSearch());
  }

  componentDidMount() {
    setPageTitle("Search");
  }

  startSearch(query: string) {
    if (this.state.c_i && !this.state.regex) {
      query = escapeRegExp(query);
    }

    if (query) {
      try {
        const found = TweetSearcher.search(SETTINGS.archive.all, query, this.state.c_i ? "i" : this.state.regex);
  
        this.setState({
          searched: found,
          search_modal: false
        });
      } catch (e) {
        console.log(typeof e, e instanceof Error, e.message)
        const msg = (e as Error).message;
        const operator = msg.split('Invalid query')[0].trim();

        toast(`Error: Invalid query for operator "${operator}"`, "error");
      }
    }
  }

  onRegexChange(v: boolean) {
    this.setState({
      regex: v
    });
  }

  onCIChange(v: boolean) {
    this.setState({
      c_i: v
    });
  }

  onSortChange(v: string) {
    if (v === "reverse") {
      this.setState({
        sort_reverse_chrono: true
      });
      SETTINGS.sort_reverse_chrono = true;
    }
    else {
      this.setState({
        sort_reverse_chrono: false
      });
      SETTINGS.sort_reverse_chrono = false;
    }
  }

  parameters() {
    return (
      <div className={classes.checkboxes}>
        <FormControl component="fieldset" className={classes.form_control}>
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={this.state.regex} onChange={(_, c) => this.onRegexChange(c)} value="gilad" />}
              label="Use a regular expression"
            />
          </FormGroup>
        </FormControl>

        <FormControl component="fieldset" className={classes.form_control}>
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={this.state.c_i} onChange={(_, c) => this.onCIChange(c)} value="gilad" />}
              label="Case insensitive"
            />
          </FormGroup>
        </FormControl>
      </div>
    );
  }

  searchModal() {
    return (
      <div className={classes.search_modal + " " + (this.state.search_modal ? classes.open : "")}>
        <Card className={classes.card}>
          <CardContent>
            <div className={classes.search_field_wrapper}>
              <TextField
                label="Search"
                className={classes.text_field}
                margin="normal"
                variant="outlined"
                id="search-text-field"
                onKeyPress={this.handleKeyPress}
                autoComplete={"off"}
              />
              <IconButton onClick={() => this.handleButtonClick()} aria-label="search" className={classes.search_btn}>
                <SearchIcon fontSize="large" />
              </IconButton>
            </div>

            {this.parameters()}

            <Divider className="divider-big-margin" />

            <FormControl className={classes.form_control} style={{width: '100%'}}>
              <FormLabel component="legend">Sort mode</FormLabel>
              <RadioGroup
                className={classes.radio_group}
                value={this.state.sort_reverse_chrono ? "reverse" : "normal"}
                onChange={(_, v) => this.onSortChange(v)}
              >
                <FormControlLabel value="reverse" control={<Radio />} label="More recent" />
                <FormControlLabel value="normal" control={<Radio />} label="Older" />
              </RadioGroup>
            </FormControl>

            <Divider className="divider-big-margin" />

            <Typography variant="h6" className={classes.title_p}>
              Search constraints
            </Typography>
            <div className={classes.presentation}>
              <div>
                <div className="bold">from:</div>
                <div className="bold">since:</div>
                <div className="bold">until:</div>
              </div>

              <div>
                <div>[twitter @]</div>
                <div>[YYYY-MM-DD]</div>
                <div>[YYYY-MM-DD]</div>
              </div>

              <div>
                <div className="italic">Find tweets made by specified user.</div>
                <div className="italic">Find tweets made since a specified date.</div>
                <div className="italic">Find tweets made before a specified date.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  arrowGetModal() {
    return (
      <div 
        className={classes.arrow_wrapper + " " + (this.state.search_modal ? classes.open : "")} 
        onClick={() => { this.setState({ search_modal: true }) }}
      >
        <ChevronRightIcon />
      </div>
    );
  }

  getTextSearch() {
    const el = ReactDOM.findDOMNode(this) as Element;
    return (el.querySelector('#search-text-field') as HTMLInputElement).value;
  }

  render() {
    if (!isArchiveLoaded()) {
      return <NoArchive />;
    }

    return (
      <div>
        <AppBar position="static" className={classes.appBar}>
          <Toolbar>
            <Typography variant="h6" noWrap>
              Search
            </Typography>
          </Toolbar>
        </AppBar>

        {this.searchModal()}

        {this.arrowGetModal()}

        {this.state.searched !== null && !this.state.search_modal && <div className={classes.tweet_wrapper}>
          <div className={classes.tweet_number_results}>
            <span className={classes.tweet_number}>{this.state.searched.length}</span> results
          </div>

          <TweetViewer tweets={this.state.searched} />
        </div>}
      </div>
    );
  }
}
