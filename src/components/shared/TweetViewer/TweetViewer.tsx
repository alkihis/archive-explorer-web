import React from 'react';
import { PartialTweet } from 'twitter-archive-reader';
import InfiniteScroll from 'react-infinite-scroller';
import SETTINGS from '../../../tools/Settings';
import Tweet from '../Tweets/Tweet';
import classes from './TweetViewer.module.scss';
import { filterTweets } from '../../../helpers';
import NoTweetsIcon from '@material-ui/icons/FormatClear';
import { CenterComponent } from '../../../tools/PlacingComponents';
import { Typography, Button, CircularProgress, Icon, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@material-ui/core';
import { Link } from 'react-router-dom';
import TweetCache from '../../../classes/TweetCache';
import Tasks from '../../../tools/Tasks';
import { toast } from '../Toaster/Toaster';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import SortIcon from '@material-ui/icons/Sort';
import Hot from '@material-ui/icons/Whatshot';
import Favorite from '@material-ui/icons/Star';
import Retweet from '@material-ui/icons/Repeat';
import Time from '@material-ui/icons/Schedule';
import TweetUser from '@material-ui/icons/Person';
import All from '@material-ui/icons/AllInclusive';
import Videos from '@material-ui/icons/Videocam';
import Pictures from '@material-ui/icons/Collections';

 
type ViewerProps = {
  tweets: PartialTweet[];
  chunk_len?: number;
};

type ViewerState = {
  chunk_len: number;
  has_more: boolean;
  tweets: PartialTweet[];
  current_page: PartialTweet[];
  scroller_key: string;
  delete_modal: boolean;
  readonly selectible: Set<string>;
  selected: Set<string>;
  modal_confirm: boolean;
  key: string;

  /** Filters */
  show_type: string;
  sort_type: string;
  sort_way: string;
  media_filter: string;
};

const DEFAULT_CHUNK_LEN = 26;

export default class TweetViewer extends React.Component<ViewerProps, ViewerState> {
  state: ViewerState;
  references: {
    [id: string]: React.RefObject<any>
  } = {};
  cache: {
    [id: string]: any;
  } = {};

  constructor(props: ViewerProps) {
    super(props);

    const tweets = filterTweets(this.props.tweets);

    this.state = {
      chunk_len: this.props.chunk_len ? this.props.chunk_len : DEFAULT_CHUNK_LEN,
      has_more: true,
      tweets,
      current_page: [],
      scroller_key: String(Math.random()),
      delete_modal: false,
      selectible: new Set(tweets.map(t => t.id_str)),
      selected: new Set(),
      modal_confirm: false,
      key: String(Math.random()),
      sort_type: SETTINGS.sort_type,
      show_type: SETTINGS.show_type,
      sort_way: SETTINGS.sort_way,
      media_filter: SETTINGS.media_filter,
    };

    // Needed because REACT is shit
    this.onTweetCheckChange = this.onTweetCheckChange.bind(this);
    this.renderTweet = this.renderTweet.bind(this);
  }

  /** FILTERS */
  handleShowModeChange = (_: React.MouseEvent<HTMLElement, MouseEvent>, value: string[]) => {
    if (value.length === 0) {
      return;
    }

    SETTINGS.show_type = value.length > 1 ? 'all' : value[0];
    this.setState({
      show_type: value.length > 1 ? 'all' : value[0],
      key: String(Math.random())
    });
  };

  handleSortTypeChange = (_: React.MouseEvent<HTMLElement, MouseEvent>, value: string) => {
    if (!value) {
      return;
    }
    
    SETTINGS.sort_type = value;
    this.setState({
      sort_type: value,
      key: String(Math.random())
    });
  };

  handleSortWayChange = (_: React.MouseEvent<HTMLElement, MouseEvent>, value: string) => {
    if (!value) {
      return;
    }

    SETTINGS.sort_way = value;
    this.setState({
      sort_way: value,
      key: String(Math.random())
    });
  };

  handleMediaChange = (_: React.MouseEvent<HTMLElement, MouseEvent>, value: string) => {
    if (!value) {
      return;
    }

    SETTINGS.media_filter = value;
    this.setState({
      media_filter: value,
      key: String(Math.random())
    });
  };

  renderFilters() {
    return (
      <div className={classes.toggleContainer}>
        {/* Show mode (all, retweets only, tweets only) */}
        <ToggleButtonGroup
          value={this.state.show_type === "all" ? ['retweets', 'tweets'] : [this.state.show_type]}
          onChange={this.handleShowModeChange}
          className={classes.inlineToggleButton}
        >
          <ToggleButton value="tweets">
            <TweetUser />
          </ToggleButton>
          <ToggleButton value="retweets">
            <Retweet />
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Sort mode (time, popular, retweets, favorites) */}
        <ToggleButtonGroup
          value={this.state.sort_type}
          exclusive
          onChange={this.handleSortTypeChange}
          className={classes.inlineToggleButton}
        >
          <ToggleButton value="time">
            <Time />
          </ToggleButton>
          <ToggleButton value="popular">
            <Hot />
          </ToggleButton>
          <ToggleButton value="retweets">
            <Retweet />
          </ToggleButton>
          <ToggleButton value="favorites">
            <Favorite />
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Sort mode (asc desc) */}
        <ToggleButtonGroup
          value={this.state.sort_way}
          exclusive
          onChange={this.handleSortWayChange}
          className={classes.inlineToggleButton}
        >
          <ToggleButton value="asc">
            <SortIcon style={{transform: 'rotate(180deg)'}} />
          </ToggleButton>
          <ToggleButton value="desc">
            <SortIcon />
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Media mode (with pic, with video...) */}
        <ToggleButtonGroup
          value={this.state.media_filter}
          exclusive
          onChange={this.handleMediaChange}
          className={classes.inlineToggleButton}
        >
          <ToggleButton value="none">
            <All />
          </ToggleButton>
          <ToggleButton value="pic">
            <Pictures />
          </ToggleButton>
          <ToggleButton 
            value="video" 
            disabled={!SETTINGS.archive.is_gdpr}
          >
            <Videos />
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
    );
  }

  /** MODAL */
  openConfirmModal() {
    this.setState({ modal_confirm: true });
  }

  closeConfirmModal() {
    this.setState({ modal_confirm: false });
  }

  warningMessageFilter() {
    const filters = [SETTINGS.only_medias, SETTINGS.only_videos, SETTINGS.only_rts];

    if (filters.some(e => e)) {
      const [medias, videos, rts] = filters;

      if (videos) {
        return (rts ? "re" : "") + "tweets with videos/GIFs";
      }
      if (medias) {
        return (rts ? "re" : "") + "tweets with medias";
      }
    }
    return "";
  }

  /** GET TWEETS */
  loadTweets(page: number) {
    page -= 1;

    const start = this.state.chunk_len * page;

    const tweets = this.state.tweets.slice(start, start + this.state.chunk_len);

    if (!tweets.length) {
      const current_page = this.state.current_page;
      this.setState({
        current_page,
        has_more: false
      });
    }

    if (SETTINGS.tweet_dl && !SETTINGS.expired) {
      // do dl
      TweetCache.bulk(tweets.map(t => t.id_str))
        .then(data => {
          const t = Object.values(data);
          console.log(t, "excepted", tweets.length);
    
          // @ts-ignore
          this.state.current_page.push(...t);
        })
        .catch(e => {
          // show error
          console.error(e);
          // Classic load instead
          this.state.current_page.push(...tweets);
        })
        .finally(() => {
          const current_page = this.state.current_page;
          this.setState({
            current_page,
            has_more: tweets.length > 0
          });
        })
    }
    else {
      this.state.current_page.push(...tweets);

      const current_page = this.state.current_page;
      this.setState({
        current_page,
        has_more: tweets.length > 0
      });
    }
  }

  /** REFRESH COMPONENT */
  componentDidUpdate(prev_props: ViewerProps, prev_state: ViewerState) {
    if (prev_props.tweets !== this.props.tweets || prev_state.key !== this.state.key) {
      // Tweets change, component reset
      this.references = {};
      this.cache = {};
      const tweets = filterTweets(this.props.tweets);
      this.setState({
        current_page: [],
        tweets,
        has_more: true,
        delete_modal: false,
        scroller_key: String(Math.random()),
        selected: new Set(),
        selectible: new Set(tweets.map(i => i.id_str))
      });
    }
  }

  /** METHODS FOR TWEETS */
  checkAll() {
    this.setState({
      selected: new Set(this.state.selectible),
      delete_modal: true
    });
    Object.values(this.references).map(t => t.current.check());
  }

  uncheckAll() {
    this.setState({
      selected: new Set([]),
      delete_modal: false
    });
    Object.values(this.references).map(t => t.current.uncheck());
  }

  renderTweet(t: PartialTweet, i: number) {
    this.references[t.id_str] = t.id_str in this.references ? this.references[t.id_str] : React.createRef();
    
    if (t.id_str in this.cache) {
      return this.cache[t.id_str];
    }

    return this.cache[t.id_str] = <Tweet 
      data={t} 
      key={i} 
      ref={this.references[t.id_str]} 
      checked={this.state.selected.has(t.id_str)} 
      onCheckChange={this.onTweetCheckChange} 
    />;
  }

  onTweetCheckChange(checked: boolean, id_str: string) {
    // console.log(this, checked, id_str);
    
    const s = this.state.selected;
    if (checked) {
      s.add(id_str);
    }
    else {
      s.delete(id_str);
    }

    this.setState({ delete_modal: !!s.size, selected: s });
  }

  loader() {
    return (
      <div className={classes.loader} key={0}>
        <CenterComponent>
          <CircularProgress thickness={3} className={classes.loader_real} />
        </CenterComponent>
      </div>
    );
  }

  noTweetsProp() {
    return (
      <>
        {this.renderFilters()}
        <CenterComponent className={classes.no_tweets}>
          <NoTweetsIcon className={classes.icon} />
          <Typography variant="h5" style={{marginTop: "1rem", marginBottom: ".7rem"}}>
            This element does not contain any tweets. :(
          </Typography>
        </CenterComponent>
      </>
    );
  }

  noTweetsState() {
    return (
      <>
        {this.renderFilters()}
        <CenterComponent className={classes.no_tweets}>
          <NoTweetsIcon className={classes.icon} />
          <Typography variant="h5" style={{marginTop: "1rem", marginBottom: ".7rem"}}>
            This element does not contain any tweets. :(
          </Typography>
          <Typography variant="h6">
            It seems you have applied filters 
            that hide all the tweets that can be displayed.
          </Typography>

          <Button component={Link} to="/settings/" color="primary" style={{marginTop: '1.5rem'}}>
            Manage filters
          </Button>
        </CenterComponent>
      </>
    );
  }

  noTweetsLeft() {
    return (
      <>
        {this.renderFilters()}
        <CenterComponent className={classes.no_tweets}>
          {this.renderFilters()}

          <NoTweetsIcon className={classes.icon} />
          <Typography variant="h5" style={{marginTop: "1rem", marginBottom: ".7rem"}}>
            No tweets to display here
          </Typography>

          <Typography>
            All tweets are deleted, or you don't have the permission to read them.
          </Typography>

          <Typography>
            Try disabling the "Download tweets" function into settings.
          </Typography>

          <Typography>
            You could also try to log in with another Twitter account.
          </Typography>

          <Button component={Link} to="/settings/" color="primary" style={{marginTop: '1.5rem'}}>
            Settings
          </Button>
        </CenterComponent>
      </>
    );
  }

  confirmDeletionModal() {
    return (
      <Dialog
        open={true}
        onClose={() => this.closeConfirmModal()}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle>Delete selected tweets ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The tweets will be deleted from <span className="bold">Twitter</span>.
          </DialogContentText>
          <DialogContentText>
            A deletion task will be started. 
            You can't restore tweets after they're been removed from Twitter.
            Are you sure you want to do this ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => this.closeConfirmModal()} color="primary" autoFocus>
            No
          </Button>
          <Button onClick={() => { 
            this.closeConfirmModal();  
            Tasks.start([...this.state.selected], "tweet")
              .catch(() => {
                toast("Unable to start task. Check your network.", "error");
              });
            this.uncheckAll();
          }} color="secondary">
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  askDeletionModal() {
    return (
      <div className={classes.modal_root + 
          (this.state.delete_modal ? " " + classes.open : "") + " "
        }>
        <div className={classes.modal_grid_root}>
          <div className={classes.modal_selected}>
            {this.state.selected.size} selected
          </div> 

          <div className={classes.modal_grid_container}>
            <Button color="primary" onClick={() => this.checkAll()}>
              Select all
            </Button>
          </div> 

          <div className={classes.modal_grid_container}>
            <Button className={classes.modal_unselect_all_color} onClick={() => this.uncheckAll()}>
              Unselect all
            </Button>
          </div> 
          
          <div className={classes.modal_grid_container}>
            <Button color="secondary" onClick={() => this.openConfirmModal()}>
              <Icon>delete_sweep</Icon>
            </Button>
          </div> 
        </div>
      </div>
    );
  }

  render() {
    // Pas de tweets donnés
    if (this.props.tweets.length === 0) {
      return this.noTweetsProp();
    }

    // Pas de tweets après filtrage
    if (this.state.tweets.length === 0) {
      return this.noTweetsState();
    }

    const warning = this.warningMessageFilter();

    const t = this.state.current_page.map(this.renderTweet);

    // no tweets available (all deleted)
    if (t.length === 0 && !this.state.has_more) {
      return this.noTweetsLeft();
    }

    return (
      <div>
        {this.renderFilters()}

        {this.state.modal_confirm && this.confirmDeletionModal()}

        {this.askDeletionModal()}

        {warning && <div className={classes.warning_filters}>Showing only {warning}</div>}
        
        <InfiniteScroll
          className={classes.card_container}
          pageStart={0}
          loadMore={p => this.loadTweets(p)}
          hasMore={this.state.has_more}
          loader={this.loader()}
          key={this.state.scroller_key}
        >
          {t}
        </InfiniteScroll>
      </div>
    );
  }
}
