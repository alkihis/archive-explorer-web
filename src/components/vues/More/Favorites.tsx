import React from 'react';
import classes from './More.module.scss';
import { CircularProgress } from '@material-ui/core';
import { PartialFavorite, PartialTweet } from 'twitter-archive-reader';
import SETTINGS from '../../../tools/Settings';
import InfiniteScroll from 'react-infinite-scroller';
import TweetOrFavorite from '../../shared/Tweets/TweetOrFavorite';
import { CenterComponent } from '../../../tools/PlacingComponents';
import TweetCache from '../../../classes/TweetCache';
import { API_URLS } from '../../../tools/ApiHelper';

const FAV_CHUNK_LEN = 20;
type PartialTweetOrFavorite = PartialTweet | PartialFavorite;

type FavoritesProps = {
  favorites: PartialFavorite[],
};

type FavoritesState = {
  has_more: boolean,
  position: number,
  loaded: PartialTweetOrFavorite[],
};

export default class Favorites extends React.Component<FavoritesProps, FavoritesState> {
  key = Math.random();

  state: FavoritesState = {
    has_more: true,
    position: 0,
    loaded: [],
  };

  componentDidUpdate(old_props: FavoritesProps) {
    if (this.props.favorites !== old_props.favorites) {
      this.key = Math.random();
      this.setState({
        has_more: true,
        position: 0,
        loaded: []
      });
    }
  }

  loadItems = async (page: number) => {
    page -= 1;

    const start = FAV_CHUNK_LEN * page;
    const next = start + FAV_CHUNK_LEN;
    const tweets_for_current_page = this.props.favorites.slice(start, next);

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
    return (
      <div>
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

