import React, { Fragment } from 'react';
import classes from './More.module.scss';
import LANG from '../../../classes/Lang/Language';
import { Typography, TextField, CircularProgress } from '@material-ui/core';
import { PartialFavorite, PartialTweet } from 'twitter-archive-reader';
import SETTINGS from '../../../tools/Settings';
import InfiniteScroll from 'react-infinite-scroller';
import TweetOrFavorite from '../../shared/Tweets/TweetOrFavorite';
import { CenterComponent, Marger } from '../../../tools/PlacingComponents';
import TweetCache from '../../../classes/TweetCache';
import { API_URLS } from '../../../tools/ApiHelper';
import { escapeRegExp, nFormat } from '../../../helpers';

const FAV_CHUNK_LEN = 50;
type PartialTweetOrFavorite = PartialTweet | PartialFavorite;

type FavoritesState = {
  has_more: boolean,
  position: number,
  loaded: PartialTweetOrFavorite[],
  favs: PartialFavorite[],
};

export default class Favorites extends React.Component<{}, FavoritesState> {
  timeout: number = 0;
  key = Math.random();
  favs_original = SETTINGS.archive.favorites.all;

  state: FavoritesState = {
    has_more: true,
    position: 0,
    loaded: [],
    favs: this.favs_original,
  };

  find(query: string) {
    let matcher: RegExp;
    let selected: PartialFavorite[];

    if (query) {
      try {
        matcher = new RegExp(query, "i");
      } catch (e) {
        matcher = new RegExp(escapeRegExp(query), "i");
      }
  
      selected = this.favs_original.filter(f => matcher.test(f.fullText));
    }
    else {
      selected = this.favs_original;
    }

    this.key = Math.random();
    
    this.setState({
      position: 0,
      has_more: true,
      loaded: [],
      favs: selected
    });
  } 

  loadItems = async (page: number) => {
    page -= 1;

    const start = FAV_CHUNK_LEN * page;
    const next = start + FAV_CHUNK_LEN;
    const tweets_for_current_page = this.state.favs.slice(start, next);

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

  makeSearch(content: string) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.find(content.trim());
    }, 500) as any;
  }

  shownIfQuery() {
    if (this.favs_original.length !== this.state.favs.length) {
      const shown = this.state.favs.length > 1 ? LANG.shown_s : LANG.shown;

      return <Fragment>
        {" "}{shown}{" "}
        <em style={{ fontSize: '1.1rem' }}>
          ({LANG.over} {nFormat(this.favs_original.length)} {LANG.favorited} tweet{this.favs_original.length > 1 && "s"})
        </em>
      </Fragment>;
    }
    return "";
  }

  render() {
    return (
      <div>
        <Typography variant="h4" className={classes.main_title}>
          {LANG.favorites}
        </Typography>
  
        <Typography variant="h5" gutterBottom style={{ marginBottom: '2.1rem' }}>
          {nFormat(this.state.favs.length)} tweet{this.state.favs.length > 1 && "s"} {LANG.favorited}{this.shownIfQuery()}.
        </Typography>
  
        <TextField
          label={LANG.search_inside_favorites}
          classes={{
            root: classes.inputInput,
          }}
          onChange={e => this.makeSearch(e.target.value)}
          variant="outlined"
        />
  
        <Marger size="1.2rem" />
  
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

