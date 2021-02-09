import React from 'react';
import classes from './Tweet.module.scss';
import { FullUser, Status } from 'twitter-d';
import { PartialFavorite, PartialTweet, PartialTweetUser, TwitterHelpers } from 'twitter-archive-reader';
import { Card, CardHeader, Avatar, CardContent, CardActions, Checkbox, ListItem, ListItemText } from '@material-ui/core';
import RetweetIcon from '@material-ui/icons/Repeat';
import FavoriteIcon from '@material-ui/icons/Star';
import { dateFormatter, truncateInteractionCount } from '../../../helpers';
import TweetImage from './TweetMedia';
import TweetText from './TweetText';
import { withStyles } from '@material-ui/styles';
import { CheckboxProps } from '@material-ui/core/Checkbox';
import SETTINGS from '../../../tools/Settings';
import UserCache from '../../../classes/UserCache';
import { TweetContext } from './TweetContext';
import { SelectedCheckboxDetails } from '../TweetViewer/TweetViewer';
import clsx from 'clsx';
import LANG from '../../../classes/Lang/Language';
import twitterSnowflakeToDate from 'twitter-snowflake-to-date';

type TweetProp = {
  data: PartialFavorite | PartialTweet | Status,
  checked?: boolean,
  onCheckChange?: (is_checked: boolean, id_str: string) => void;
  asListBlock: boolean;
  favoriteMode?: boolean;
};

type TweetState = {
  checked: boolean;
};

const TweetCheckbox = withStyles({
  root: {
    '&$checked': {
      color: '#ff8c34',
    },
  },
  checked: {},
})(
  React.forwardRef<HTMLButtonElement, CheckboxProps>((props, ref) => (
    <Checkbox color="default" ref={ref} {...props} />
  ))
);

export default class Tweet extends React.Component<TweetProp, TweetState> {
  state: TweetState;
  checkbox: React.RefObject<HTMLButtonElement> = React.createRef();

  constructor(props: TweetProp) {
    super(props);

    this.state = { checked: this.props.checked };
  }

  handleTweetContextMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const ev = new CustomEvent<SelectedCheckboxDetails>('tweet.check-one', {
      detail: {
        id: (this.props.data as PartialTweet).id_str,
        element: this.checkbox.current,
        position: {
          left: e.clientX + 1,
          top: e.clientY
        }
      }
    });

    window.dispatchEvent(ev);
  };

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
    return 'user' in tweet ? (tweet.user as FullUser).screen_name : "";
  }

  get name() {
    const tweet = this.original;
    return 'user' in tweet ? (tweet.user as FullUser).name : "";
  }

  get profile_picture() {
    return 'user' in this.original ? (this.original.user as FullUser).profile_image_url_https : "";
  }

  check() {
    this.setState({ checked: true });
  }

  uncheck() {
    this.setState({ checked: false });
  }

  /**
   * Render the tweet as a Card instance
   */
  renderCard() {
    let user_pp = this.profile_picture;
    const user_id = this.user_id;

    // Si c'est un tweet d'une personne qui est en cache
    if (UserCache.getFromCache(user_id)) {
      user_pp = UserCache.getFromCache(user_id).profile_image_url_https;
    }

    const avatar = user_pp.replace('_normal', '');
    const avatar_name = this.name.slice(0, 1) || '#';

    return (
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
          action={(this.props.data as Status).retweeted_status ?
            <RetweetIcon className={classes.retweeted} style={{padding: '12px'}} /> :
            undefined
          }
          title={<a
            className={classes.link}
            rel="noopener noreferrer"
            target="_blank"
            href={"https://twitter.com/" + this.screen_name}
          >
            {this.name || LANG.favorited_tweet}
          </a>}
          subheader={<a
            className={classes.link}
            rel="noopener noreferrer"
            target="_blank"
            href={"https://twitter.com/" + this.screen_name}
          >
            @{this.screen_name}
          </a>}
        />

        <CardContent style={{ paddingTop: this.has_media ? '0' : undefined }}>
          <TweetText />
        </CardContent>

        {this.has_media && <TweetImage />}

        {!this.props.favoriteMode ?
          <CardActions disableSpacing className={classes.card_action + " tweet-font tweet-details"}>
            <TweetCheckbox
              ref={this.checkbox}
              onChange={(_, checked) => {
                this.setState({ checked });
                const oc = this.props.onCheckChange;

                if (oc)
                  oc(checked, (this.props.data as PartialTweet).id_str);
              }}
              checked={this.state.checked}
              disabled={!SETTINGS.can_delete}
              onContextMenu={this.handleTweetContextMenu}
            />

            <TweetActions />
            <TweetDate />
          </CardActions> :
          <CardActions className={classes.card_favorite_action + " tweet-font tweet-details"}>
            <TweetActions />
            <TweetDate />
          </CardActions>
        }
      </Card>
    );
  }

  /**
   * Render the tweet as a ListItem instance
   */
  renderListItem() {
    return (
      <ListItem className={classes.list_item}>
        {!this.props.favoriteMode && <TweetCheckbox
          ref={this.checkbox}
          onChange={(_, checked) => {
            this.setState({ checked });
            const oc = this.props.onCheckChange;

            if (oc)
              oc(checked, (this.props.data as PartialTweet).id_str);
          }}
          checked={this.state.checked}
          disabled={!SETTINGS.can_delete}
          onContextMenu={this.handleTweetContextMenu}
        />}

        <ListItemText
          className={classes.list_item_text}
          primary={<TweetText inline />}
          secondary={<div className={classes.list_actions}>
            <ListTweetDetails />
            <span className={classes.inline_icon}>
              {'retweeted_status' in this.props.data ?
                <RetweetIcon className={clsx(classes.rt_icon, classes.retweeted)} /> :
                undefined
              }
              <TweetDateLink />
            </span>
          </div>}
        />
      </ListItem>
    );
  }

  render() {
    return (
      <TweetContext.Provider value={this.props.data as PartialTweet}>
        {!this.props.asListBlock && this.renderCard()}
        {this.props.asListBlock && this.renderListItem()}
      </TweetContext.Provider>
    )
  }
}

function getOriginal(tweet: PartialTweet | Status) {
  return tweet.retweeted_status ? tweet.retweeted_status : tweet;
}

function TweetActions() {
  const context = getOriginal(React.useContext(TweetContext));

  const rt = context.retweet_count && !isNaN(context.retweet_count) ? context.retweet_count : 0;
  const fav = context.favorite_count && !isNaN(context.favorite_count) ? context.favorite_count : 0;
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

function ListTweetDetails() {
  const raw_tweet = React.useContext(TweetContext);
  const context = getOriginal(raw_tweet);

  const rt = context.retweet_count && !isNaN(context.retweet_count) ? context.retweet_count : 0;
  const fav = context.favorite_count && !isNaN(context.favorite_count) ? context.favorite_count : 0;
  return (
    <span className={classes.list_details} data-inline="data-inline">
      <span>
        <a
          className={classes.link}
          rel="noopener noreferrer"
          target="_blank"
          href={"https://twitter.com/" + (context.user as PartialTweetUser).screen_name}
        >
          @{(context.user as PartialTweetUser).screen_name}
        </a>
      </span>

      <span className={classes.rt_number}>
        {truncateInteractionCount(rt)} <RetweetIcon className={classes.rt_icon} />
      </span>
      <span className={classes.fav_number}>
        {truncateInteractionCount(fav)} <FavoriteIcon className={classes.fav_icon} />
      </span>
    </span>
  );
}

function TweetDate() {
  return (
    <div className={classes.date}>
      <TweetDateLink />
    </div>
  );
}

function TweetDateLink() {
  // @ts-ignore
  const context = getOriginal(React.useContext(TweetContext)) as PartialTweet | PartialFavorite;
  const date = 'created_at' in context ?
    TwitterHelpers.dateFromTweet(context as PartialTweet) :
    twitterSnowflakeToDate(context.tweetId);
  const link = 'created_at' in context ?
    `https://twitter.com/${(context.user as PartialTweetUser).screen_name}/status/${context.id_str}` :
    `https://twitter.com/i/web/status/${context.tweetId}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={classes.link}
    >{SETTINGS.lang === "fr" ? dateFormatter("d/m/Y H:i:s", date) : dateFormatter("Y-m-d H:i:s", date)}</a>
  );
}

