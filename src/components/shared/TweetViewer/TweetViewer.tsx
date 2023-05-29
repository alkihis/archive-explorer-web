import React from 'react';
import { PartialTweet, TwitterHelpers } from 'twitter-archive-reader';
import InfiniteScroll from 'react-infinite-scroller';
import SETTINGS, { TweetSortType, TweetSortWay, TweetMediaFilters } from '../../../tools/Settings';
import Tweet, { AcceptedTweetSources } from '../Tweets/Tweet';
import classes from './TweetViewer.module.scss';
import { filterTweets } from '../../../helpers';
import NoTweetsIcon from '@material-ui/icons/FormatClear';
import { CenterComponent } from '../../../tools/PlacingComponents';
import {
  Typography,
  Button,
  CircularProgress,
} from '@material-ui/core';
import { Link } from 'react-router-dom';
import TweetCache from '../../../classes/TweetCache';
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
import Shuffle from '@material-ui/icons/Shuffle';
import MentionIcon from '@material-ui/icons/Reply';
import Pictures from '@material-ui/icons/Collections';
import CustomTooltip from '../CustomTooltip/CustomTooltip';
import LANG from '../../../classes/Lang/Language';
import { SHOULD_DOWNLOAD_TWEETS_AND_USERS } from '../../../const';

export type MenuNeededDetails = { element: HTMLElement, position: { left: number, top: number } };
export type SelectedCheckboxDetails = { id: string } & MenuNeededDetails;

type ViewerProps = {
  tweets: PartialTweet[];
  withMoments?: boolean;
  chunkLen?: number;
  asList?: boolean;
};

type ViewerState = {
  chunk_len: number;
  has_more: boolean;
  tweets: PartialTweet[];
  current_page: PartialTweet[];
  scroller_key: string;
  key: string;

  /** Filters */
  sort_type: TweetSortType;
  sort_way: TweetSortWay;
  media_filter: TweetMediaFilters;
  allow_rts: boolean;
  allow_self: boolean;
  allow_mentions: boolean;

  /** Select tweets */
  selected_checkbox?: SelectedCheckboxDetails;

  /** Menu bulk delete */
  menu_bulk_delete?: MenuNeededDetails;

  /** Selected tweet */
  selected_tweet?: PartialTweet;
};

const DEFAULT_CHUNK_LEN = 26;

export default class TweetViewer extends React.Component<ViewerProps, ViewerState> {
  state: ViewerState;
  references: {
    [id: string]: React.RefObject<Tweet>
  } = {};
  cache: {
    [id: string]: any;
  } = {};

  constructor(props: ViewerProps) {
    super(props);

    // Actualise les filtres en fonction du type de l'archive
    if (!SETTINGS.archive.is_gdpr) {
      // Désactive les filters inaccessibles
      // Si jamais on est en tri vidéo seulement, réinitialise
      if (SETTINGS.media_filter === "video") {
        SETTINGS.media_filter = "none";
      }
      // Pareil pour le temps
      if (SETTINGS.sort_type !== "time") {
        SETTINGS.sort_type = "time";
      }
    }

    const tweets = filterTweets(this.props.tweets, this.props.withMoments);

    this.state = {
      chunk_len: this.props.chunkLen ? this.props.chunkLen : DEFAULT_CHUNK_LEN,
      has_more: true,
      tweets,
      current_page: [],
      scroller_key: String(Math.random()),
      key: String(Math.random()),
      sort_type: SETTINGS.sort_type,
      sort_way: SETTINGS.sort_way,
      media_filter: SETTINGS.media_filter,
      allow_mentions: SETTINGS.allow_mentions,
      allow_rts: SETTINGS.allow_rts,
      allow_self: SETTINGS.allow_self
    };

    this.onDetailClick = this.onDetailClick.bind(this);
    this.renderTweet = this.renderTweet.bind(this);
  }

  componentDidMount() {
    // @ts-ignore
    window.addEventListener('tweet.check-one', this.onTweetSelect);
  }

  componentWillUnmount() {
    // @ts-ignore
    window.removeEventListener('tweet.check-one', this.onTweetSelect);
  }

  onTweetSelect = (e: CustomEvent<SelectedCheckboxDetails>) => {
    this.setState({
      selected_checkbox: e.detail
    });
  };

  onOpenDeleteMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    this.setState({
      menu_bulk_delete: {
        position: {
          left: e.clientX + 2,
          top: e.clientY
        },
        element: e.currentTarget
      }
    });
  };

  /** FILTERS */
  handleShowModeChange = (_: React.MouseEvent<HTMLElement, MouseEvent>, value: string[]) => {
    if (value.length === 0) {
      return;
    }

    SETTINGS.allow_mentions = value.includes('mentions');
    SETTINGS.allow_rts = value.includes('retweets');
    SETTINGS.allow_self = value.includes('self');

    this.setState({
      allow_mentions: SETTINGS.allow_mentions,
      allow_rts: SETTINGS.allow_rts,
      allow_self: SETTINGS.allow_self,
      key: String(Math.random())
    });
  };

  handleSortTypeChange = (_: React.MouseEvent<HTMLElement, MouseEvent>, value: TweetSortType) => {
    if (!value) {
      return;
    }

    SETTINGS.sort_type = value;
    this.setState({
      sort_type: value,
      key: String(Math.random())
    });
  };

  handleSortWayChange = (_: React.MouseEvent<HTMLElement, MouseEvent>, value: TweetSortWay) => {
    if (!value) {
      return;
    }

    SETTINGS.sort_way = value;
    this.setState({
      sort_way: value,
      key: String(Math.random())
    });
  };

  handleMediaChange = (_: React.MouseEvent<HTMLElement, MouseEvent>, value: TweetMediaFilters) => {
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
    const show_types = [];

    if (SETTINGS.allow_mentions) {
      show_types.push("mentions");
    }
    if (SETTINGS.allow_rts) {
      show_types.push("retweets");
    }
    if (SETTINGS.allow_self) {
      show_types.push("self");
    }

    return (
      <div className={classes.toggleContainer}>
        {/* Show mode (all, retweets only, tweets only, mentions) */}
        <ToggleButtonGroup
          value={show_types}
          onChange={this.handleShowModeChange}
          className={classes.inlineToggleButton}
        >
          <ToggleButton value="self">
            <CustomTooltip title={LANG.show_your_tweets}>
              <TweetUser />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton value="retweets">
            <CustomTooltip title={LANG.show_retweets}>
              <Retweet />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton value="mentions">
            <CustomTooltip title={LANG.show_replies}>
              <MentionIcon />
            </CustomTooltip>
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
            <CustomTooltip title={LANG.sort_by_date}>
              <Time />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton
            value="popular"
            disabled={!SETTINGS.archive.is_gdpr}
          >
            <CustomTooltip title={LANG.sort_by_popular}>
              <Hot />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton
            value="retweets"
            disabled={!SETTINGS.archive.is_gdpr}
          >
            <CustomTooltip title={LANG.sort_by_rt_count}>
              <Retweet />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton
            value="favorites"
            disabled={!SETTINGS.archive.is_gdpr}
          >
            <CustomTooltip title={LANG.sort_by_fav_count}>
              <Favorite />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton value="random">
            <CustomTooltip title={LANG.sort_by_random}>
              <Shuffle />
            </CustomTooltip>
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
            <CustomTooltip title={LANG.sort_asc}>
              <SortIcon style={{transform: 'rotate(180deg)'}} />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton value="desc">
            <CustomTooltip title={LANG.sort_desc}>
              <SortIcon />
            </CustomTooltip>
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
            <CustomTooltip title={LANG.show_all_tweets}>
              <All />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton value="pic">
            <CustomTooltip title={LANG.show_with_medias}>
              <Pictures />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton
            value="video"
            disabled={!SETTINGS.archive.is_gdpr}
          >
            <CustomTooltip title={LANG.show_with_videos}>
              <Videos />
            </CustomTooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
    );
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
      return;
    }

    if (SHOULD_DOWNLOAD_TWEETS_AND_USERS) {
      // do dl
      TweetCache.bulk(tweets.map(t => t.id_str))
        .then(data => {
          const t = tweets.map(t => data[t.id_str]).filter(t => t);
          // console.log(t, "excepted", tweets.length);

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
    else if (SETTINGS.archive.is_gdpr && SHOULD_DOWNLOAD_TWEETS_AND_USERS ) { // RT DOWNLOAD, this cannot work yet
      TweetCache.bulkRts(tweets)
        .then(tweets => {
          this.state.current_page.push(...tweets);
          const current_page = this.state.current_page;

          this.setState({
            current_page,
            has_more: tweets.length > 0
          });
        });
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
    if (
      prev_props.tweets !== this.props.tweets ||
      prev_state.key !== this.state.key ||
      this.props.withMoments !== prev_props.withMoments
    ) {
      // Tweets change, component reset
      this.references = {};
      this.cache = {};
      const tweets = filterTweets(this.props.tweets, this.props.withMoments);
      this.setState({
        current_page: [],
        tweets,
        has_more: true,
        scroller_key: String(Math.random()),
      });
    }
  }

  /** METHODS FOR TWEETS */

  renderTweet(t: PartialTweet) {
    this.references[t.id_str] = t.id_str in this.references ? this.references[t.id_str] : React.createRef();

    if (t.id_str in this.cache) {
      return this.cache[t.id_str];
    }

    return this.cache[t.id_str] = <Tweet
      data={t}
      key={t.id_str}
      ref={this.references[t.id_str]}
      onDetailClick={this.onDetailClick}
      asListBlock={this.props.asList}
    />;
  }

  onDetailClick(tweet: AcceptedTweetSources) {
    this.setState({ selected_tweet: tweet as PartialTweet });
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
            {LANG.contains_any_tweets}. :(
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
            {LANG.contains_any_tweets}. :(
          </Typography>
          <Typography variant="h6">
            {LANG.filters_that_hide}
          </Typography>
        </CenterComponent>
      </>
    );
  }

  noTweetsLeft() {
    return (
      <>
        {this.renderFilters()}
        <CenterComponent className={classes.no_tweets}>
          <NoTweetsIcon className={classes.icon} />
          <Typography variant="h5" style={{marginTop: "1rem", marginBottom: ".7rem"}}>
            {LANG.no_tweets_to_display}
          </Typography>

          <Typography>
            {LANG.deleted_or_no_permission_to_show}
          </Typography>

          <Typography>
            {LANG.try_disable_download}
          </Typography>

          <Typography>
            {LANG.try_another_login_info}
          </Typography>

          <Button component={Link} to="/settings/" color="primary" style={{marginTop: '1.5rem'}}>
            {LANG.settings}
          </Button>
        </CenterComponent>
      </>
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

    // no tweets available (all deleted)
    if (this.state.current_page.length === 0 && !this.state.has_more) {
      return this.noTweetsLeft();
    }

    let tweet_rendered_data: any;
    if (this.props.withMoments) {
      let current_year: number = null;
      let current_year_tweet_count = 0;

      // Render tweets with "year headers" when year changes
      tweet_rendered_data = this.state.current_page.map((tweet, i) => {
        const current_tweet_date = TwitterHelpers.dateFromTweet(tweet).getFullYear();
        const t = this.renderTweet(tweet);

        if (current_tweet_date !== current_year) {
          // must show year
          current_year = current_tweet_date;
          const previous_count = current_year_tweet_count;
          // Reset the tweet count: we change current year
          current_year_tweet_count = 1;

          return (
            <React.Fragment key={i}>
              {/*
                If the previous year has a odd tweet count,
                we must inject a empty container to go to next line (max 2 tweets per line).
              */}
              {previous_count % 2 !== 0 && <div className={classes.card_container} />}

              <div className={classes.card_container_year}>
                <Typography className={classes.year_header}>
                  {LANG.year} {current_tweet_date}
                </Typography>
              </div>
              <div className={classes.card_container} />

              {t}
            </React.Fragment>
          );
        }
        else {
          current_year_tweet_count++;

          return t;
        }
      });
    }
    else {
      tweet_rendered_data = this.state.current_page.map(this.renderTweet);
    }

    return (
      <>
        {this.renderFilters()}

        <InfiniteScroll
          className={this.props.asList ? classes.list_container : classes.card_container}
          pageStart={0}
          loadMore={p => this.loadTweets(p)}
          hasMore={this.state.has_more}
          loader={this.loader()}
          key={this.state.scroller_key}
        >
          {tweet_rendered_data}
        </InfiniteScroll>
      </>
    );
  }
}
