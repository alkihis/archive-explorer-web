import React from 'react';
import classes from './Tweets.module.scss';
import { Status } from 'twitter-d';
import { PartialTweet, PartialTweetUser } from 'twitter-archive-reader';
import { Card, CardHeader, Avatar, CardContent, CardActions, Typography } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import FavoriteIcon from '@material-ui/icons/Star';
import NonFavoriteIcon from '@material-ui/icons/StarBorder';
import RetweetIcon from '@material-ui/icons/Repeat';
import { dateFormatter } from '../../../helpers';
import TweetImage from './TweetMedia';

type TweetProp = {
  data: PartialTweet | Status,
  onCheckChange?: (is_checked: boolean, id_str: string) => void;
};

type TweetState = {
  checked: boolean;
};

export default class Tweet extends React.Component<TweetProp, TweetState> {
  state: TweetState = { checked: false };

  renderMedia() {
    if (this.props.data.extended_entities) {
      if (this.props.data.extended_entities.media && this.props.data.extended_entities.media.length) {
        // @ts-ignore
        return <TweetImage entities={this.props.data.extended_entities} />;
      }
    }

    if (this.props.data.entities && this.props.data.entities.media.length) {
      // @ts-ignore
      return <TweetImage entities={this.props.data.entities} />; 
    }

    return "";
  }

  render() {
    return (
      <Card className={classes.card}>
        <CardHeader
          avatar={
            <Avatar className={classes.avatar}>
              {(this.props.data.user as PartialTweetUser).screen_name.slice(0, 1)}
            </Avatar>
          }
          action={
            <IconButton aria-label="settings">
              <MoreVertIcon />
            </IconButton>
          }
          title={`@${(this.props.data.user as PartialTweetUser).screen_name}`}
          subheader={dateFormatter("Y-m-d H:i:s", new Date(this.props.data.created_at))}
        />

        {this.renderMedia()}
        
        <CardContent>
          <Typography variant="body2" color="textSecondary" component="p">
            {(this.props.data as PartialTweet).text}
          </Typography>
        </CardContent>
        <CardActions disableSpacing>
          <IconButton aria-label="add to favorites">
            {(this.props.data as Status).favorited ? <FavoriteIcon /> : <NonFavoriteIcon />}
          </IconButton>
        </CardActions>
      </Card>
    )
  }
}
