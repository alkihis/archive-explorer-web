import React from 'react';
import { PartialTweet } from 'twitter-archive-reader';
import InfiniteScroll from 'react-infinite-scroller';
import SETTINGS from '../../../tools/Settings';
import Tweet from '../Tweets/Tweets';
import classes from './TweetViewer.module.scss';
import { filterTweets } from '../../../helpers';

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
};

const DEFAULT_CHUNK_LEN = 26;

export default class TweetViewer extends React.Component<ViewerProps, ViewerState> {
  state: ViewerState;

  constructor(props: ViewerProps) {
    super(props);

    this.state = {
      chunk_len: this.props.chunk_len ? this.props.chunk_len : DEFAULT_CHUNK_LEN,
      has_more: true,
      tweets: filterTweets(this.props.tweets),
      current_page: [],
      scroller_key: String(Math.random())
    };
  }

  loadTweets(page: number) {
    page -= 1;

    const start = this.state.chunk_len * page;

    const tweets = this.state.tweets.slice(start, start + this.state.chunk_len);
    console.log(tweets);

    if (SETTINGS.tweet_dl) {
      // do dl
    }

    this.state.current_page.push(...tweets);
    const current_page = this.state.current_page;
    this.setState({
      current_page,
      has_more: tweets.length > 0
    });
  }

  componentDidUpdate(prev_props: ViewerProps) {
    if (prev_props.tweets !== this.props.tweets) {
      // Tweets change, component reset
      this.setState({
        current_page: [],
        tweets: filterTweets(this.props.tweets),
        has_more: true,
        scroller_key: String(Math.random())
      });
    }
  }

  renderTweet(t: PartialTweet, i: number) {
    return <Tweet data={t} key={i} />;
  }

  loader() {
    return (
      <div style={{flex: '0 100%'}} key={0}>Loading...</div>
    );
  }

  render() {
    const t = this.state.current_page.map(this.renderTweet);

    return (
      <div>
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
