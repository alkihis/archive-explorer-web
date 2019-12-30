import React from 'react';
import { Status } from 'twitter-d';
import { PartialTweet } from 'twitter-archive-reader';
import { unescapeTwi } from '../../../helpers';
import Graphene from 'grapheme-splitter';
import LANG from '../../../classes/Lang/Language';
import { TweetContext } from './TweetContext';
import { Typography } from '@material-ui/core';

const splitter = new Graphene();
const TWITTER_BASE = "https://twitter.com/";
const TWITTER_HASH_BASE = "https://twitter.com/search?q=";

export default class TweetText extends React.Component {
  static contextType = TweetContext;
  context!: PartialTweet | Status;

  calculateFragments() {
    const frags: [number, number, JSX.Element][] = [];

    const t = this.tweet.retweeted_status ? this.tweet.retweeted_status : this.tweet;

    if (t.entities) {
      if (t.entities.user_mentions && t.entities.user_mentions.length) {
        for (const m of t.entities.user_mentions) {
          frags.push([Number(m.indices[0]), Number(m.indices[1]), 
            <a 
              target="_blank" 
              rel="noopener noreferrer" 
              title={'@' + m.screen_name} 
              href={TWITTER_BASE + m.screen_name}
              key={String(frags.length)}
            >@{m.screen_name}</a>
          ]);
        }
      }

      if (t.entities.urls && t.entities.urls.length) {
        for (const u of t.entities.urls) {
          frags.push([Number(u.indices[0]), Number(u.indices[1]), 
            <a 
              target="_blank" 
              rel="noopener noreferrer" 
              title={LANG.link_to + ' ' + u.display_url} 
              href={u.expanded_url}
              key={String(frags.length)}
            >{u.display_url}</a>
          ]);
        }
      }

      if (t.entities.hashtags && t.entities.hashtags.length) {
        for (const h of t.entities.hashtags) {
          frags.push([Number(h.indices[0]), Number(h.indices[1]), 
            <a 
              target="_blank" 
              rel="noopener noreferrer" 
              title={'#' + h.text} 
              href={TWITTER_HASH_BASE + encodeURIComponent('#' + h.text)}
              key={String(frags.length)}
            >#{h.text}</a>
          ]);
        }
      }

      if (t.entities.media && t.entities.media.length) {
        // First link is always the good one
        const m = t.entities.media[0];
        frags.push([Number(m.indices[0]), Number(m.indices[1]), 
          <a 
            target="_blank" 
            rel="noopener noreferrer" 
            title={LANG.link_to + ' ' + LANG.picture + ' ' + m.display_url} 
            href={m.expanded_url}
            key={String(frags.length)}
          >{m.display_url}</a>
        ]);
      }
    }

    // Tri par ordre d'apparition croissant
    return frags.sort((a, b) => a[0] - b[0]);
  }

  renderText(frags: [number, number, JSX.Element][]) {
    const parts: JSX.Element[] = [];
    const original_t = this.tweet.retweeted_status ? this.tweet.retweeted_status : this.tweet;

    // @ts-ignore Ralentit énormément le code. A utiliser avec parcimonie
    const original_string = splitter.splitGraphemes(original_t.full_text ? original_t.full_text : original_t.text);

    let last_end = 0;
    let i = 1;

    // Assemble les fragments et les lie avec les parties 
    // de la chaîne originale entre eux
    for (const [begin, end, element] of frags) {
      if (begin !== last_end) {
        parts.push(<span key={String(frags.length + i)}>{
          unescapeTwi(original_string.slice(last_end, begin).join(""))
        }</span>);
      }
      parts.push(element);
      last_end = end;
      i++;
    }

    // Rend le reste de la chaîne originale si besoin
    if (original_string.length !== last_end) {
      parts.push(<span key={String(frags.length + i)}>{
        unescapeTwi(original_string.slice(last_end).join(""))
      }</span>);
    }

    return parts;
  }

  get tweet() {
    return this.context;
  }

  render() {
    return (
      <Typography variant="body2" className="pre-line break-word" color="textSecondary" component="p">
        {this.renderText(this.calculateFragments())}
      </Typography>
    );
  }
}
