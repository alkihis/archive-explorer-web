import React from 'react';
import LANG from '../../../classes/Lang/Language';
import { ArchiveReadState } from 'twitter-archive-reader';

export function truncateText(str: string, threshold = 40, limit_start = 13, limit_end = 10) {
  const l = str.length;
    if (l > threshold) {
      const p1 = str.slice(0, limit_start);
      const p2 = str.slice(l - limit_end, l);
      
      return `${p1}...${p2}`;
    }
    return str;
}

export function loadingMessage(loading_state: ArchiveReadState | "prefetch" | "read_save") {
  switch (loading_state) {
    case "dm_read":
      return LANG.reading_dms;
    case "extended_read":
      return LANG.reading_fav_moments_other;
    case "indexing":
      return LANG.indexing_tweets;
    case "reading":
      return LANG.unzipping;
    case "tweet_read":
      return LANG.reading_tweets;
    case "user_read":
      return LANG.reading_user_infos;
    case "prefetch":
      return LANG.gathering_user_data;
    case "read_save":
      return LANG.reading_saved_archive;
  }
}
