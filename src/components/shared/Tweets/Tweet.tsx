import React from 'react';
import classes from './Tweet.module.scss';
import { Status, FullUser } from 'twitter-d';
import { PartialTweet, PartialTweetUser, dateFromTweet } from 'twitter-archive-reader';
import { Card, CardHeader, Avatar, CardContent, CardActions, Typography, Checkbox } from '@material-ui/core';
import RetweetIcon from '@material-ui/icons/Repeat';
import FavoriteIcon from '@material-ui/icons/Star';
import { dateFormatter } from '../../../helpers';
import TweetImage from './TweetMedia';
import TweetText from './TweetText';
import { withStyles } from '@material-ui/styles';
import { CheckboxProps } from '@material-ui/core/Checkbox';
import SETTINGS from '../../../tools/Settings';
import UserCache from '../../../classes/UserCache';

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
})((props: CheckboxProps) => <Checkbox color="default" {...props} />);

export default class Tweet extends React.Component<TweetProp, TweetState> {
  state: TweetState;

  constructor(props: TweetProp) {
    super(props);

    this.state = { checked: this.props.checked };
  }

  renderMedia() {
    if (this.props.data.extended_entities) {
      if (this.props.data.extended_entities.media && this.props.data.extended_entities.media.length) {
        // @ts-ignore
        return <TweetImage entities={this.props.data.extended_entities} />;
      }
    }

    if (this.props.data.entities && this.props.data.entities.media && this.props.data.entities.media.length) {
      // @ts-ignore
      return <TweetImage entities={this.props.data.entities} />; 
    }

    return "";
  }

  get original() {
    return (this.props.data.retweeted_status ? this.props.data.retweeted_status : this.props.data) as Status;
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

    return (
      <Card className={classes.card}>
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
            {`${(this.original.user as PartialTweetUser).name}`}
          </a>}
          subheader={<a 
            className={classes.link}
            rel="noopener noreferrer"
            target="_blank"
            href={"https://twitter.com/" + (this.original.user as PartialTweetUser).screen_name}
          >
            {`@${(this.original.user as PartialTweetUser).screen_name}`}
          </a>}
        />

        {this.renderMedia()}
        
        <CardContent>
          <Typography variant="body2" className="pre-line break-all" color="textSecondary" component="p">
            <TweetText data={this.props.data} />
          </Typography>
        </CardContent>

        <CardActions disableSpacing className={classes.card_action}>
          <TweetCheckbox 
            onChange={(_, checked) => { 
              this.setState({ checked });
              const oc = this.props.onCheckChange;

              if (oc)
                oc(checked, this.props.data.id_str); 
            }} 
            checked={this.state.checked}
            disabled={!SETTINGS.can_delete}
          />

          <TweetActions tweet={this.original} />

          <TweetDate 
            // @ts-ignore
            date={dateFromTweet(this.original)} 
            id_str={this.original.id_str} 
            screen_name={(this.original.user as FullUser).screen_name} 
          />
        </CardActions>
      </Card>
    )
  }
}

function TweetActions(props: { tweet: Status }) {
  const rt = props.tweet.retweet_count && !isNaN(props.tweet.retweet_count) ? props.tweet.retweet_count : 0;
  const fav = props.tweet.favorite_count && !isNaN(props.tweet.favorite_count) ? props.tweet.favorite_count : 0;
  return (
    <div className={classes.rt_container}>
      <div className={classes.rt_number}>
        {rt} <RetweetIcon className={classes.rt_icon} />
      </div>
      <div className={classes.fav_number}>
        {fav} <FavoriteIcon className={classes.fav_icon} />
      </div>
    </div>
  );
}

function TweetDate(props: { date: Date, screen_name: string, id_str: string }) {
  return (
    <div className={classes.date}>
      <a 
        href={`https://twitter.com/${props.screen_name}/status/${props.id_str}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className={classes.link}
      >{SETTINGS.lang === "fr" ? dateFormatter("d/m/Y H:i:s", props.date) : dateFormatter("Y-m-d H:i:s", props.date)}</a>
    </div>
  );
}

