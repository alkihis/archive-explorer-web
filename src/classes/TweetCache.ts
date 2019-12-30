import { Status } from 'twitter-d';
import Cache from './Cache';
import { PartialTweet } from 'twitter-archive-reader';

class TCache extends Cache<Status> {
  async bulkRts(tweets: PartialTweet[]) {
    const new_tweets: PartialTweet[] = [...tweets];
    const indexes: {[id: string]: number} = {};

    let i = 0;
    for (const t of tweets) {
      if ('retweeted_status' in t) {
        // Is a retweet
        if (this.getFromCache(t.id_str)) {
          new_tweets[i] = this.getFromCache(t.id_str) as any;
        }
        else {
          indexes[t.id_str] = i;
        }
      }
     
      i++;
    }

    try {
      const all_tweets = await this.bulk(Object.keys(indexes));

      // Inject les tweets
      for (const [id, tweet] of Object.entries(all_tweets)) {
        const index = indexes[id];
        if (index !== undefined) {
          new_tweets[indexes[id]] = tweet as any;
        }
      }
    } catch (e) {
      // pass
    }

    return new_tweets;
  }
}

export const TweetCache = new TCache('batch/tweets');
window.DEBUG.TweetCache = TweetCache;

export default TweetCache;
