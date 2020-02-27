import React from 'react';
import { PartialTweet, PartialFavorite } from 'twitter-archive-reader';
import { unescapeTwi } from '../../../helpers';
import Graphene from 'grapheme-splitter';
import LANG from '../../../classes/Lang/Language';
import { TweetContext } from './TweetContext';
import { Typography } from '@material-ui/core';

const splitter = new Graphene();
const TWITTER_BASE = "https://twitter.com/";
const TWITTER_HASH_BASE = "https://twitter.com/search?q=";

function TweetText() {
  const tweet = React.useContext(TweetContext) as PartialTweet | PartialFavorite;

  function renderText() {
    const parts: JSX.Element[] = [];
    const original_t = 'retweeted_status' in tweet ? tweet.retweeted_status : tweet;
    const entities_fragments = calculateTextForEntities();
    const original_text = 'full_text' in original_t ? 
      original_t.full_text : 
      ('text' in original_t ?
        original_t.text :
        original_t.fullText
      );

    // @ts-ignore Ralentit énormément le code. A utiliser avec parcimonie
    const original_string = splitter.splitGraphemes(original_text);

    let last_end = 0;
    let i = 1;

    // Assemble les fragments et les lie avec les parties 
    // de la chaîne originale entre eux
    for (const [begin, end, element] of entities_fragments) {
      if (begin !== last_end) {
        parts.push(<span key={String(entities_fragments.length + i)}>{
          unescapeTwi(original_string.slice(last_end, begin).join(""))
        }</span>);
      }
      parts.push(element);
      last_end = end;
      i++;
    }

    // Rend le reste de la chaîne originale si besoin
    if (original_string.length !== last_end) {
      parts.push(<span key={String(entities_fragments.length + i)}>{
        unescapeTwi(original_string.slice(last_end).join(""))
      }</span>);
    }

    return parts;
  }

  function calculateTextForEntities() {
    const frags: [number, number, JSX.Element][] = [];

    if ('fullText' in tweet) {
      return [];
    }

    const t = ('retweeted_status' in tweet ? tweet.retweeted_status : tweet) as PartialTweet;

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

  return (
    <Typography variant="body2" className="pre-wrap break-word tweet-font tweet-text" color="textSecondary" component="p">
      {renderText()}
    </Typography>
  );
}

export default TweetText;
