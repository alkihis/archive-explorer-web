import { Status } from 'twitter-d';
import Cache from './Cache';

export const TweetCache = new Cache<Status>('batch/tweets');
export default TweetCache;
