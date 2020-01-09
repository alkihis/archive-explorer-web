import React from 'react';
import { PartialTweet } from 'twitter-archive-reader';
import { Typography, ListItem, ListItemAvatar, Avatar, ListItemText, useTheme, List, Divider, Link } from '@material-ui/core';
import LANG from '../../../classes/Lang/Language';
import { FullUser } from 'twitter-d';
import UserCache from '../../../classes/UserCache';
import { getMonthText } from '../../../helpers';

type MentionsSorted = {
  count: {
    direct: number;
    participant: number;
  };
  original: string;
};

const DEFAULT_SHOWED_USERS = 8;
const MAX_SHOWED_USERS = DEFAULT_SHOWED_USERS * 4;
const TWITTER_LINK = "https://twitter.com/";

export default function MostMentionned(props: { tweets: PartialTweet[], month?: string }) {
  const [users, setUsers] = React.useState<{ [screenName: string]: FullUser }>({});
  const [showedUsers, setShowedUsers] = React.useState(DEFAULT_SHOWED_USERS); 
  const [mentions, setMentions] = React.useState<MentionsSorted[]>([]);
  const theme = useTheme();

  React.useEffect(() => {
    const mentions_obj: { [userName: string]: { 
      count: {
        direct: number,
        participant: number,
      }, 
      original: string, 
    } } = {};
  
    const regex_at = /@(\w+)/g;
    for (const tweet of props.tweets) {
      const reg = new RegExp(regex_at);
      const text = tweet.text;
      let matches: RegExpExecArray;
  
      // eslint-disable-next-line
      while (matches = reg.exec(text)) {
        const at = matches[1].toLowerCase();
  
        if (!(at in mentions_obj)) {
          mentions_obj[at] = { count: { direct: 0, participant: 0 }, original: matches[1] };
        }
  
        if (text.startsWith('@' + matches[1])) {
          mentions_obj[at].count.direct++;
        }
        else {
          mentions_obj[at].count.participant++;
        }
      }
    }
  
    const mentions_sorted = Object
      .values(mentions_obj)
      .sort((a, b) => 
        (b.count.direct + b.count.participant) - (a.count.direct + a.count.participant)
      );

    setMentions(mentions_sorted);

    // Download needed users
    UserCache.bulk(mentions_sorted.slice(0, MAX_SHOWED_USERS).map(m => m.original), undefined, "sns")
      .then(users => {
        const new_users = { ...users };
        for (const user of Object.values(users)) {
          new_users[user.screen_name.toLowerCase()] = user;
        }
        setUsers(new_users);
      })
      .catch(console.error);
  }, [props]);

  function loadMore() {
    const actual = showedUsers;
    const theorical_new = actual + DEFAULT_SHOWED_USERS;

    setShowedUsers(theorical_new > MAX_SHOWED_USERS ? MAX_SHOWED_USERS : theorical_new);
  }

  const canShowMore = showedUsers < MAX_SHOWED_USERS && showedUsers < mentions.length;

  let current_month = LANG.in_all_archive;
  if (props.month) {
    const [year, month] = props.month.split('-', 2);
    current_month = LANG.during + " " + getMonthText(month).toLowerCase() + " " + year;
  }

  return (
    <>
      {mentions.length === 0 && <Typography color="textSecondary" align="center">
        {LANG.no_mentionned_users}.
      </Typography>}

      {mentions.length > 0 && <div>
        <Typography variant="h6">
          {LANG.most_mentionned} {current_month}
        </Typography>

        <List>
          <TwitterMention mention={mentions[0]} users={users} />
          {mentions[1] && <TwitterMention mention={mentions[1]} users={users} />}
          {mentions[2] && <TwitterMention mention={mentions[2]} users={users} />}
        </List>

        {mentions.length > 3 && <>
          <Divider />

          <Typography color="textSecondary" style={{ marginTop: '1rem' }}>
            {LANG.other_mentionned_users}
          </Typography>

          <List dense>
            {mentions.slice(3, showedUsers).map((m, i) => <TwitterMention mention={m} key={i} users={users} />)}

            {canShowMore && <ListItem button style={{ 
              marginTop: 10,
              textAlign: 'center',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: theme.palette.primary.main,
              display: 'block'
            }} onClick={loadMore}>
              {LANG.load_more}
            </ListItem>}
          </List>
        </>}
      </div>}
    </>
  );
}


function TwitterMention({ mention, users }: {
  mention: MentionsSorted, 
  users: { [screenName: string]: FullUser },
}) {
  const lc_sn = mention.original.toLowerCase();
  const user = lc_sn in users ? users[lc_sn] : undefined;
  let avatar: React.ReactNode = "";
  let name = mention.original;
  let screen_name = mention.original;

  if (user) {
    avatar = <Avatar alt={user.screen_name} src={user.profile_image_url_https} />;
    name = user.name;
    screen_name = user.screen_name;
  }
  else {
    avatar = (
      <Avatar alt={mention.original}>
        {mention.original.slice(0, 1)}
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
              <Link href={TWITTER_LINK + screen_name} rel="noopener noreferrer" target="_blank">
                @{screen_name}
              </Link>
            </Typography>
            {" "}
            {LANG.mentionned_directly} <strong>{mention.count.direct}</strong> {LANG.times}, {" "}
            {LANG.inside_a_conversation} <strong>{mention.count.participant}</strong> {LANG.times}.
          </React.Fragment>
        }
      />
    </ListItem>
  );
}
