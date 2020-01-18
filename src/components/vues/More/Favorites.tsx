import React from 'react';
import classes from './More.module.scss';
import LANG from '../../../classes/Lang/Language';
import { Typography, TextField, Link } from '@material-ui/core';
import { PartialFavorite } from 'twitter-archive-reader';
import SETTINGS from '../../../tools/Settings';
import InfiniteScroll from 'react-infinite-scroller';
import clsx from 'clsx';

const FAV_CHUNK_LEN = 100;

export default function Favorites() {
  const favs = SETTINGS.archive.favorites;
  const [search, setSearch] = React.useState("");
  const [hasMore, setHasMore] = React.useState(true);
  const [position, setPosition] = React.useState(0);

  function loadItems(page: number) {
    page -= 1;

    const start = FAV_CHUNK_LEN * page;
    const next = start + FAV_CHUNK_LEN;
    const tweets = favs.all.slice(start, next);

    setPosition(next);
    setHasMore(tweets.length > 0);
  }

  return (
    <div>
      <Typography variant="h4" className={classes.main_title}>
        {LANG.favorites}
      </Typography>

      <Typography variant="h5" className={classes.second_title} gutterBottom>
        {favs.length} {LANG.tweets} {LANG.favorited}.
      </Typography>

      <TextField
        placeholder={LANG.search}
        classes={{
          root: classes.inputInput,
        }}
        value={search}
        onChange={e => setSearch(e.target.value)}
        variant="outlined"
      />

      <InfiniteScroll
        pageStart={0}
        loadMore={loadItems}
        hasMore={hasMore}
        loader={<div />}
      >
        {favs.all.slice(0, position).map((e, index) => <Favorite favorite={e} key={index} />)}
      </InfiniteScroll>
    </div>
  );
}

function Favorite(props: { favorite: PartialFavorite }) {
  return (
    <div className={clsx(classes.favorite, "break-word pre-wrap")}>
      <Link href={props.favorite.expandedUrl}>
        {props.favorite.fullText}
      </Link>
    </div>
  );
}
