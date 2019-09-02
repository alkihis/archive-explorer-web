import React from 'react';
import classes from './Tweet.module.scss';
import { Status } from 'twitter-d';
import { PartialTweet, PartialTweetUser } from 'twitter-archive-reader';
import { Card, CardHeader, Avatar, CardContent, CardActions, Typography, Checkbox } from '@material-ui/core';
import RetweetIcon from '@material-ui/icons/Repeat';
import { dateFormatter } from '../../../helpers';
import TweetImage from './TweetMedia';
import TweetText from './TweetText';
import { withStyles } from '@material-ui/styles';
import { CheckboxProps } from '@material-ui/core/Checkbox';

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
    return (
      <Card className={classes.card}>
        <CardHeader
          avatar={
            <Avatar className={classes.avatar}>
              {(this.props.data.user as PartialTweetUser).screen_name.slice(0, 1)}
            </Avatar>
          }
          action={(this.props.data as Status).retweeted_status ? 
            <RetweetIcon className={classes.retweeted} style={{padding: '12px'}} /> : 
            undefined
          }
          title={`@${(this.props.data.user as PartialTweetUser).screen_name}`}
          subheader={dateFormatter("Y-m-d H:i:s", new Date(this.props.data.created_at))}
        />

        {this.renderMedia()}
        
        <CardContent>
          <Typography variant="body2" color="textSecondary" component="p">
            <TweetText data={this.props.data} />
          </Typography>
        </CardContent>

        <CardActions disableSpacing>
          <TweetCheckbox 
            onChange={(_, checked) => { 
              this.setState({ checked });
              const oc = this.props.onCheckChange;

              if (oc)
                oc(checked, this.props.data.id_str); 
            }} 
            checked={this.state.checked}
          />
        </CardActions>
      </Card>
    )
  }
}

