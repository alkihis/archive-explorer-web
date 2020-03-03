import React from 'react';
import classes from './Tweet.module.scss';
import { PartialTweet, PartialTweetUser, TwitterHelpers, PartialFavorite } from 'twitter-archive-reader';
import { Card, CardHeader, Avatar, CardContent, CardActions } from '@material-ui/core';
import RetweetIcon from '@material-ui/icons/Repeat';
import FavoriteIcon from '@material-ui/icons/Star';
import { dateFormatter, truncateInteractionCount } from '../../../helpers';
import TweetImage from './TweetMedia';
import TweetText from './TweetText';
import SETTINGS from '../../../tools/Settings';
import UserCache from '../../../classes/UserCache';
import { TweetContext } from './TweetContext';
import LANG from '../../../classes/Lang/Language';

type TweetProp = {
  data: PartialTweet | PartialFavorite,
  checked?: boolean,
  onCheckChange?: (is_checked: boolean, id_str: string) => void;
};

type TweetState = {
  checked: boolean;
};

export default class TweetOrFavorite extends React.Component<TweetProp, TweetState> {
  state: TweetState;
  checkbox: React.RefObject<HTMLButtonElement> = React.createRef();

  constructor(props: TweetProp) {
    super(props);

    this.state = { checked: this.props.checked };
  }

  get original() {
    return 'retweeted_status' in this.props.data ? this.props.data.retweeted_status : this.props.data;
  }

  get has_media() {
    if ('extended_entities' in this.props.data) {
      if (this.props.data.extended_entities.media && this.props.data.extended_entities.media.length) {
        return true;
      }
    }

    return !!('entities' in this.props.data && this.props.data.entities.media && this.props.data.entities.media.length);
  }

  get id_str() {
    const tweet = this.original;
    return 'user' in tweet ? tweet.id_str : tweet.tweetId;
  }

  get user_id() {
    const tweet = this.original;
    return 'user' in tweet ? tweet.user.id_str : "";
  }

  get screen_name() {
    const tweet = this.original;
    return 'user' in tweet ? tweet.user.screen_name : "";
  }

  get name() {
    const tweet = this.original;
    return 'user' in tweet ? tweet.user.name : "";
  }

  get profile_picture() {
    return 'user' in this.original ? this.original.user.profile_image_url_https : "";
  }

  check() {
    this.setState({ checked: true });
  }

  uncheck() {
    this.setState({ checked: false });
  }

  render() {
    let user_pp = this.profile_picture;
    
    // Si c'est un tweet d'une personne qui est en cache
    const usr_id = this.user_id;
    if (usr_id) {
      if (UserCache.getFromCache(usr_id)) {
        user_pp = UserCache.getFromCache(usr_id).profile_image_url_https;
      }
    }

    const avatar = user_pp.replace('_normal', '');
    const avatar_name = this.name.slice(0, 1) || "#";
    const has_media = this.has_media;

    return (
      <TweetContext.Provider value={this.props.data}>
        <Card className={classes.card} elevation={0}>
          <CardHeader
            classes={
              { title: classes.card_title }
            }

            avatar={
              <Avatar className={classes.avatar} src={SETTINGS.pp ? avatar : undefined}>
                {SETTINGS.pp ? "" : avatar_name}
              </Avatar>
            }
            title={<a 
              className={classes.link}
              rel="noopener noreferrer"
              target="_blank"
              href={"https://twitter.com/" + this.screen_name}
            >
              {this.name || LANG.favorited_tweet}
            </a>}
            subheader={this.screen_name && <a 
              className={classes.link}
              rel="noopener noreferrer"
              target="_blank"
              href={"https://twitter.com/" + this.screen_name}
            >
              @{this.screen_name}
            </a>}
          />

          <CardContent style={{ paddingTop: has_media ? '0' : undefined }}>
            <TweetText />
          </CardContent>

          {has_media && <TweetImage />}
          
          <CardActions className={classes.card_favorite_action + " tweet-font tweet-details"}>
            <TweetActions />
            <CustomTweetDate />

          </CardActions>
        </Card>
      </TweetContext.Provider>
    )
  }
}

function getOriginal(tweet: PartialTweet | PartialFavorite) {
  return 'retweeted_status' in tweet ? tweet.retweeted_status : tweet;
}

function TweetActions() {
  const context = getOriginal(React.useContext(TweetContext));

  const rt = 'retweet_count' in context && !isNaN(context.retweet_count) ? context.retweet_count : 0;
  const fav = 'favorite_count' in context && !isNaN(context.favorite_count) ? context.favorite_count : 0;
  return (
    <div className={classes.rt_container}>
      <div className={classes.rt_number}>
        {truncateInteractionCount(rt)} <RetweetIcon className={classes.rt_icon} />
      </div>
      <div className={classes.fav_number}>
        {truncateInteractionCount(fav)} <FavoriteIcon className={classes.fav_icon} />
      </div>
    </div>
  );
}

function CustomTweetDate() {
  const context = getOriginal(React.useContext(TweetContext)) as PartialTweet | PartialFavorite;

  if ('created_at' in context) {
    const date = TwitterHelpers.dateFromTweet(context as PartialTweet);
  
    return (
      <div className={classes.date}>
        <a 
          href={`https://twitter.com/${(context.user as PartialTweetUser).screen_name}/status/${context.id_str}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className={classes.link}
        >{SETTINGS.lang === "fr" ? dateFormatter("d/m/Y H:i:s", date) : dateFormatter("Y-m-d H:i:s", date)}</a>
      </div>
    );
  }
  else {
    return (
      <div className={classes.date}>
        <a 
          href={`https://twitter.com/i/web/status/${context.tweetId}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className={classes.link}
      >#{context.tweetId}</a>
      </div>
    );
  }
}

