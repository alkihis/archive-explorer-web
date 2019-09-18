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
      selected: new Set,
      modal_confirm: false
    };

    // Needed because REACT is shit
    this.onTweetCheckChange = this.onTweetCheckChange.bind(this);
    this.renderTweet = this.renderTweet.bind(this);
  }

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

      /* 
      const texts: string[] = [];
      if (medias) {
        texts.push("tweets with medias");
      }
      if (videos) {
        texts.push("tweets with videos/GIFs");
      }
      if (rts) {
        texts.push("retweets");
      }

      if (texts.length > 1) {
        return texts.slice(0, texts.length - 1).join(', ') + " and " + texts[texts.length - 1];
      }
      else {
        return texts[0];
      } 
      */
    }
    return "";
  }

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

  componentDidUpdate(prev_props: ViewerProps) {
    if (prev_props.tweets !== this.props.tweets) {
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
        selected: new Set,
        selectible: new Set(tweets.map(i => i.id_str))
      });
    }
  }

  checkAll() {
    this.setState({
      selected: new Set(this.state.selectible),
      delete_modal: true
    });
    Object.values(this.references).map(t => {
      t.current.check();
    });
  }

  uncheckAll() {
    this.setState({
      selected: new Set([]),
      delete_modal: false
    });
    Object.values(this.references).map(t => {
      t.current.uncheck();
    });
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
    console.log(this, checked, id_str);
    
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
      <CenterComponent className={classes.no_tweets}>
        <NoTweetsIcon className={classes.icon} />
        <Typography variant="h5" style={{marginTop: "1rem", marginBottom: ".7rem"}}>
          This element does not contain any tweets. :(
        </Typography>
      </CenterComponent>
    );
  }

  noTweetsState() {
    return (
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
    );
  }

  noTweetsLeft() {
    return (
      <CenterComponent className={classes.no_tweets}>
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
          {/* <Sentinel triggerMore={true} onVisible={() => console.log("Visible bottom !!")} /> */}
      </div>
    );
  }
}
