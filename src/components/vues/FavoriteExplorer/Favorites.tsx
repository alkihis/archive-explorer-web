import React from 'react';
import classes from '../More/More.module.scss';
import { CircularProgress, Typography } from '@material-ui/core';
import { PartialFavorite, PartialTweet } from 'twitter-archive-reader';
import SETTINGS, { TweetSortWay, FavoriteTweetSortType } from '../../../tools/Settings';
import InfiniteScroll from 'react-infinite-scroller';
import TweetOrFavorite from '../../shared/Tweets/TweetOrFavorite';
import { CenterComponent } from '../../../tools/PlacingComponents';
import TweetCache from '../../../classes/TweetCache';
import { API_URLS } from '../../../tools/ApiHelper';
import LANG from '../../../classes/Lang/Language';
import NoFavsIcon from '@material-ui/icons/FormatClear';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import ToggleButton from '@material-ui/lab/ToggleButton';
import CustomTooltip from '../../shared/CustomTooltip/CustomTooltip';
import { arrayShuffle } from '../../../helpers';

/** ICONS Filters */
import Shuffle from '@material-ui/icons/Shuffle';
import MentionIcon from '@material-ui/icons/Reply';
import Time from '@material-ui/icons/Schedule';
import SortIcon from '@material-ui/icons/Sort';
import TweetUser from '@material-ui/icons/Person';

const FAV_CHUNK_LEN = 20;
type PartialTweetOrFavorite = PartialTweet | PartialFavorite;

type FavoritesProps = {
  favorites: PartialFavorite[],
};

type FavoritesState = {
  has_more: boolean,
  position: number,
  loaded: PartialTweetOrFavorite[],
  /** Contain sorted and filtered favorites */
  favorites: PartialFavorite[],

  /** Filters */
  sort_type: FavoriteTweetSortType;
  sort_way: TweetSortWay;
  allow_mentions: boolean;
  allow_self: boolean;
};

export default class Favorites extends React.Component<FavoritesProps, FavoritesState> {
  key = Math.random();
  state: FavoritesState;

  constructor(props: FavoritesProps) {
    super(props);

    this.state = {
      has_more: true,
      position: 0,
      loaded: [],
      sort_type: SETTINGS.favorite_sort_type,
      sort_way: SETTINGS.sort_way,
      allow_self: SETTINGS.allow_self,
      allow_mentions: SETTINGS.allow_mentions,
      favorites: filterFavorites(props.favorites),
    };
  }

  componentDidUpdate(old_props: FavoritesProps, old_state: FavoritesState) {
    if (
      this.props.favorites !== old_props.favorites || 
      this.state.allow_mentions !== old_state.allow_mentions ||
      this.state.sort_way !== old_state.sort_way ||
      this.state.sort_type !== old_state.sort_type ||
      this.state.allow_self !== old_state.allow_self
    ) {
      this.key = Math.random();
      
      this.setState({
        has_more: true,
        position: 0,
        loaded: [],
        favorites: filterFavorites(this.props.favorites),
      });
    }
  }

  /** FILTERS */
  handleShowModeChange = (_: React.MouseEvent<HTMLElement, MouseEvent>, value: string[]) => {
    SETTINGS.allow_mentions = value.includes('mentions');
    SETTINGS.allow_self = value.includes('self');

    this.setState({
      allow_mentions: SETTINGS.allow_mentions,
      allow_self: SETTINGS.allow_self,
    });
  };

  handleSortTypeChange = (_: React.MouseEvent<HTMLElement, MouseEvent>, value: FavoriteTweetSortType) => {
    if (!value) {
      return;
    }
    
    SETTINGS.favorite_sort_type = value;
    this.setState({
      sort_type: value,
    });
  };

  handleSortWayChange = (_: React.MouseEvent<HTMLElement, MouseEvent>, value: TweetSortWay) => {
    if (!value) {
      return;
    }

    SETTINGS.sort_way = value;
    this.setState({
      sort_way: value,
    });
  };

  renderFilters() {
    const show_types = [];

    if (SETTINGS.allow_mentions) {
      show_types.push("mentions");
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
      </div>
    );
  }

  loadItems = async (page: number) => {
    page -= 1;

    const start = FAV_CHUNK_LEN * page;
    const next = start + FAV_CHUNK_LEN;
    const tweets_for_current_page = this.state.favorites.slice(start, next);

    let final_array: PartialTweetOrFavorite[];
    if (!SETTINGS.expired) {
      const downloaded = await TweetCache.bulk(tweets_for_current_page.map(t => t.tweetId), undefined, undefined, API_URLS.batch_tiny_tweets);

      const final_tweets = tweets_for_current_page.map(t => t.tweetId in downloaded ? downloaded[t.tweetId] : t);
      final_array = [...this.state.loaded, ...(final_tweets as any)];
    }
    else {
      final_array = [...this.state.loaded, ...tweets_for_current_page];
    }

    this.setState({
      position: next,
      has_more: tweets_for_current_page.length > 0,
      loaded: final_array,
    });
  };

  render() {
    if (this.state.favorites.length === 0) {
      return (
        <>
          {this.renderFilters()}

          <CenterComponent className={classes.no_tweets}>
            <NoFavsIcon className={classes.icon} />
            <Typography variant="h5" style={{marginTop: "1rem", marginBottom: ".7rem"}}>
              {LANG.contains_any_favorites}. :(
            </Typography>
          </CenterComponent>
        </>
      );
    }

    return (
      <div>
        {this.renderFilters()}

        <InfiniteScroll
          className={classes.card_container}
          pageStart={0}
          key={this.key}
          loadMore={this.loadItems}
          hasMore={this.state.has_more}
          loader={<div className={classes.loader} key={0}>
            <CenterComponent>
              <CircularProgress thickness={3} className={classes.loader_real} />
            </CenterComponent>
          </div>}
        >
          {this.state.loaded.slice(0, this.state.position).map((e, index) => <TweetOrFavorite data={e} key={index} />)}
        </InfiniteScroll>
      </div>
    );
  }
}

function filterFavorites(favorites: PartialFavorite[]) {
  const settings = SETTINGS;
  let sort_fn: (a: PartialFavorite, b: PartialFavorite) => number; 
  const current_user_id = settings.archive.user.id;
  
  // Every thing is asc by default !
  if (settings.favorite_sort_type === "time") {
    if (typeof BigInt !== 'undefined') {
      sort_fn = (a: PartialFavorite, b: PartialFavorite) => Number(BigInt(a.tweetId) - BigInt(b.tweetId));
    }
    else {
      // Does not support BigInt, fallback to Collator
      const coll = new Intl.Collator(undefined, { numeric: true });
      sort_fn = (a: PartialFavorite, b: PartialFavorite) => coll.compare(a.tweetId, b.tweetId);
    }
  }

  let res = favorites.filter(t => {
    if (!settings.allow_mentions && t.fullText!.startsWith('@')) {
      return false;
    }
    // If self-favorited tweets are not showed
    if (!settings.allow_self && settings.archive.tweets.has(t.tweetId)) {
      // If the archive contain this tweet, 
      // and if the tweet is posted by current user,
      // don't show it.
      const tweet = settings.archive.tweets.single(t.tweetId);

      if (tweet.user.id_str === current_user_id) {
        return false;
      }
    }

    return true;
  });

  if (sort_fn) {
    res = res.sort(sort_fn);
  }
  else if (settings.favorite_sort_type === "random") {
    res = arrayShuffle(res);
  }

  if (settings.sort_way === "desc") {
    res.reverse();
  }

  return res;
}
