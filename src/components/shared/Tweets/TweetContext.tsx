import React from 'react';
import { PartialTweet } from 'twitter-archive-reader';
import { Status } from 'twitter-d';

// @ts-ignore
export const TweetContext = React.createContext<PartialTweet | Status>();
export type TweetContextType = React.ContextType<typeof TweetContext>;

export default TweetContext;
