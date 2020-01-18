import React from 'react';
import classes from './More.module.scss';
import LANG from '../../../classes/Lang/Language';
import { FullUser } from 'twitter-d';
import { Avatar, ListItem, ListItemAvatar, Typography, Link, ListItemText, List, CircularProgress } from '@material-ui/core';
import SETTINGS from '../../../tools/Settings';
import InfiniteScroll from 'react-infinite-scroller';
import UserCache from '../../../classes/UserCache';
import { CenterComponent } from '../../../tools/PlacingComponents';

type FState = {
  cache: { [id: string]: FullUser };
  users: string[];
  position: number;
  has_more: boolean;
};

type FProps = {
  title: string,
  subtitle: string,
  users: string[],
};

class FollowBase extends React.Component<FProps, FState> {
  protected CHUNK_LEN = 25;
  state: FState;

  constructor(props: FProps) {
    super(props);
    this.state = {
      cache: {},
      users: this.props.users,
      position: 0,
      has_more: true,
    };
  }

  loader() {
    return (
      <div className={classes.loader} key={0}>
        <CenterComponent>
          <CircularProgress thickness={3} className={classes.loader_real} />
        </CenterComponent>
      </div>
    );
  }

  /** GET Items */
  loadItems(page: number) {
    page -= 1;

    const start = this.CHUNK_LEN * page;
    const next = start + this.CHUNK_LEN;
    const users = this.state.users.slice(start, next);

    if (!users.length) {
      this.setState({
        position: this.state.position,
        has_more: false
      });
      return;
    }

    if (!SETTINGS.expired) {
      // do dl
      let cache = { ...this.state.cache };

      UserCache.bulk(users)
        .then(data => {
          for (const u in data) {
            cache[u] = data[u]; 
          } 
        })
        .catch(e => {
          // show error
          console.error(e);
        })
        .finally(() => {
          this.setState({
            position: next,
            has_more: users.length > 0,
            cache: cache
          });
        })
    }
    else {
      this.setState({
        position: next,
        has_more: users.length > 0
      });
    }
  }

  render() {
    return (
      <>
        <Typography variant="h4" className={classes.main_title}>
          {this.props.title}
        </Typography>

        <Typography variant="h6" className={classes.second_title}>
          {LANG.you_have} <strong>{this.props.users.length} {this.props.subtitle.toLocaleLowerCase()}</strong>.
        </Typography>

        <InfiniteScroll
          pageStart={0}
          loadMore={p => this.loadItems(p)}
          hasMore={this.state.has_more}
          loader={this.loader()}
        >
          <List component="div" className={classes.followers_container}>
            {this.state.users
              .slice(0, this.state.position)
              .map((u, index) => <TwitterUser key={index+1} user={u} users={this.state.cache} />)
            }
          </List>
        </InfiniteScroll>
      </>
    );
  }
}

export default function Followers() {
  return <FollowBase title={LANG.followers} subtitle={LANG.followers} users={[...SETTINGS.archive.followers]} />;
}

export function Followings() {
  return <FollowBase title={LANG.followings} subtitle={LANG.followings} users={[...SETTINGS.archive.followings]} />;
}

function TwitterUser({ user, users }: {
  user: string, 
  users: { [id: string]: FullUser },
}) {
  const full_user = user in users ? users[user] : undefined;
  let avatar: React.ReactNode;
  let name = '#' + user;
  let screen_name = name;
  let link = full_user ? "https://twitter.com/" + full_user.screen_name : "";

  if (full_user) {
    avatar = <Avatar alt={full_user.screen_name} src={full_user.profile_image_url_https} />;
    name = full_user.name;
    screen_name = '@' + full_user.screen_name;
  }
  else {
    avatar = (
      <Avatar alt={name}>
        {name.slice(0, 1)}
      </Avatar>
    );
  }

  return (
    <ListItem alignItems="flex-start">
      <ListItemAvatar>
        {avatar}
      </ListItemAvatar>
      <ListItemText
        primary={name}
        secondary={
          <React.Fragment>
            <Typography
              component="span"
              variant="body2"
              style={{ display: "inline" }}
              color="textPrimary"
            >
              <Link href={link ? link : "#"} rel="noopener noreferrer" target="_blank">
                {screen_name}
              </Link>
            </Typography>
          </React.Fragment>
        }
      />
    </ListItem>
  );
}
