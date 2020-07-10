import React from 'react';
import classes from './Tweet.module.scss';
import { Status } from 'twitter-d';
import { PartialTweet, PartialTweetUser, TwitterHelpers } from 'twitter-archive-reader';
import { Card, CardHeader, Avatar, CardContent, CardActions, Checkbox } from '@material-ui/core';
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

type TweetProp = {
  data: PartialTweet | Status,
  checked?: boolean,
  onCheckChange?: (is_checked: boolean, id_str: string) => void;
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
        id: this.props.data.id_str,
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
    return (this.props.data.retweeted_status ? this.props.data.retweeted_status : this.props.data) as Status;
  }

  get has_media() {
    if (this.props.data.extended_entities) {
      if (this.props.data.extended_entities.media && this.props.data.extended_entities.media.length) {
        return true;
      }
    }

    return !!(this.props.data.entities && this.props.data.entities.media && this.props.data.entities.media.length);
  }

  check() {
    this.setState({ checked: true });
  }

  uncheck() {
    this.setState({ checked: false });
  }

  render() {
    let user_pp = (this.original.user as PartialTweetUser).profile_image_url_https;
    
    // Si c'est un tweet d'une personne qui est en cache
    if (UserCache.getFromCache(this.original.user.id_str)) {
      user_pp = UserCache.getFromCache(this.original.user.id_str).profile_image_url_https;
    }

    const avatar = user_pp.replace('_normal', '');
    const avatar_name = (this.original.user as PartialTweetUser).name.slice(0, 1);
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
            action={(this.props.data as Status).retweeted_status ? 
              <RetweetIcon className={classes.retweeted} style={{padding: '12px'}} /> : 
              undefined
            }
            title={<a 
              className={classes.link}
              rel="noopener noreferrer"
              target="_blank"
              href={"https://twitter.com/" + (this.original.user as PartialTweetUser).screen_name}
            >
              {(this.original.user as PartialTweetUser).name}
            </a>}
            subheader={<a 
              className={classes.link}
              rel="noopener noreferrer"
              target="_blank"
              href={"https://twitter.com/" + (this.original.user as PartialTweetUser).screen_name}
            >
              @{(this.original.user as PartialTweetUser).screen_name}
            </a>}
          />

          <CardContent style={{ paddingTop: has_media ? '0' : undefined }}>
            <TweetText />
          </CardContent>

          {has_media && <TweetImage />}
          
          <CardActions disableSpacing className={classes.card_action + " tweet-font tweet-details"}>
            <TweetCheckbox 
              ref={this.checkbox}
              onChange={(_, checked) => { 
                this.setState({ checked });
                const oc = this.props.onCheckChange;

                if (oc)
                  oc(checked, this.props.data.id_str); 
              }} 
              checked={this.state.checked}
              disabled={!SETTINGS.can_delete}
              onContextMenu={this.handleTweetContextMenu}
            />

            <TweetActions />
            <TweetDate />

          </CardActions>
        </Card>
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

function TweetDate() {
  const context = getOriginal(React.useContext(TweetContext));
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

