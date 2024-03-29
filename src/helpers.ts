import SETTINGS, { TweetSortType, TweetSortWay } from "./tools/Settings";
import TwitterArchive, { PartialTweet, PartialTweetUser, TwitterHelpers } from 'twitter-archive-reader';
import LANG from "./classes/Lang/Language";
import UserCache from './classes/UserCache';
import { FullUser } from 'twitter-d';

export function setPageTitle(title?: string, absolute = false) {
  if (!absolute)
    document.title = "Archive Explorer" + (title ? ` - ${title}` : '');
  else
    document.title = title;
}

export function nFormat(number: number) {
  const lang = SETTINGS.lang === "fr" ? "fr-FR" : "en-US";
  return new Intl.NumberFormat(lang).format(number);
}

export function localeDateFormat(date: Date, with_time = false) {
  const lang = SETTINGS.lang === "fr" ? "fr-FR" : "en-US";

  if (with_time) {
    return dateFormatter(
      lang === "fr-FR" ?
        "d/m/Y H:i:s" :
        "Y-m-d H:i:s",
      date
    );
  }
  return dateFormatter(
    lang === "fr-FR" ?
      "d/m/Y" :
      "Y-m-d",
    date
  );
}

/**
 * Formate un objet Date en chaîne de caractères potable.
 * Pour comprendre les significations des lettres du schéma, se référer à : http://php.net/manual/fr/function.date.php
 * @param schema string Schéma de la chaîne. Supporte Y, m, d, g, H, i, s, n, N, v, z, w
 * @param date Date Date depuis laquelle effectuer le formatage
 * @returns string La chaîne formatée
 */
export function dateFormatter(schema: string, date = new Date()) : string {
  function getDayOfTheYear(now: Date): number {
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);

    return day - 1; // Retourne de 0 à 364/365
  }

  const Y = date.getFullYear();
  const N = date.getDay() === 0 ? 7 : date.getDay();
  const n = date.getMonth() + 1;
  const m = (n < 10 ? "0" : "") + String(n);
  const d = ((date.getDate()) < 10 ? "0" : "") + String(date.getDate());
  const L = Y % 4 === 0 ? 1 : 0;

  const i = ((date.getMinutes()) < 10 ? "0" : "") + String(date.getMinutes());
  const H = ((date.getHours()) < 10 ? "0" : "") + String(date.getHours());
  const g = date.getHours();
  const s = ((date.getSeconds()) < 10 ? "0" : "") + String(date.getSeconds());

  const replacements: any = {
    Y, m, d, i, H, g, s, n, N, L, v: date.getMilliseconds(), z: getDayOfTheYear, w: date.getDay()
  };

  let str = "";

  // Construit la chaîne de caractères
  for (const char of schema) {
    if (char in replacements) {
      if (typeof replacements[char] === 'string') {
        str += replacements[char];
      }
      else if (typeof replacements[char] === 'number') {
        str += String(replacements[char]);
      }
      else {
        str += String(replacements[char](date));
      }
    }
    else {
      str += char;
    }
  }

  return str;
}

export function isArchiveLoaded() {
  return !!SETTINGS.archive_name;
}

export function getMonthText(month: string) {
  const m = Number(month);

  switch (m) {
    case 1:
      return LANG.january;
    case 2:
      return LANG.february;
    case 3:
      return LANG.march;
    case 4:
      return LANG.april;
    case 5:
      return LANG.may;
    case 6:
      return LANG.june;
    case 7:
      return LANG.july;
    case 8:
      return LANG.august;
    case 9:
      return LANG.september;
    case 10:
      return LANG.october;
    case 11:
      return LANG.november;
    case 12:
      return LANG.december;
  }
}

export function uppercaseFirst(str: string) {
  return str.slice(0, 1).toLocaleUpperCase() + str.slice(1);
}

interface SortFilterTweetsSettings {
  sort_type: TweetSortType,
  allow_rts: boolean,
  allow_self: boolean,
  allow_mentions: boolean,
  only_medias: boolean,
  only_videos: boolean,
  sort_way: TweetSortWay,
}

export function sortAndFilterTweetsFromSettings(tweets: PartialTweet[], settings: SortFilterTweetsSettings) {
  let sort_fn: (a: PartialTweet, b: PartialTweet) => number;

  // Every thing is asc by default !
  if (settings.sort_type === "time") {
    if (typeof BigInt !== 'undefined') {
      sort_fn = (a: PartialTweet, b: PartialTweet) => Number(BigInt(a.id_str) - BigInt(b.id_str));
    }
    else {
      // Does not support BigInt, fallback to Collator
      const coll = new Intl.Collator(undefined, { numeric: true });
      sort_fn = (a: PartialTweet, b: PartialTweet) => coll.compare(a.id_str, b.id_str);
    }
  }
  else if (settings.sort_type === "popular") {
    sort_fn = (a: PartialTweet, b: PartialTweet) => scoreOfTweet(a) - scoreOfTweet(b);
  }
  else if (settings.sort_type === "retweets") {
    sort_fn = (a: PartialTweet, b: PartialTweet) => {
      if (a.retweet_count !== undefined && b.retweet_count !== undefined) {
        return a.retweet_count - b.retweet_count;
      }
      if (a.retweet_count !== undefined) {
        return a.retweet_count - 0;
      }
      if (b.retweet_count !== undefined) {
        return 0 - b.retweet_count;
      }
      return 0;
    };
  }
  else if (settings.sort_type === "favorites") {
    // favorites
    sort_fn = (a: PartialTweet, b: PartialTweet) => {
      if (a.favorite_count !== undefined && b.favorite_count !== undefined) {
        return a.favorite_count - b.favorite_count;
      }
      if (a.favorite_count !== undefined) {
        return a.favorite_count - 0;
      }
      if (b.favorite_count !== undefined) {
        return 0 - b.favorite_count;
      }
      return 0;
    };
  }

  let res = tweets.filter(t => {
    if (!settings.allow_rts && t.retweeted_status) {
      return false;
    }

    if (!settings.allow_self && !t.retweeted_status) {
      return false;
    }

    if (!settings.allow_mentions && t.text.startsWith('@')) {
      return false;
    }

    if (settings.only_medias && (!t.entities || !t.entities.media || !t.entities.media.length)) {
      return false;
    }

    if (settings.only_videos) {
      if (
        !t.extended_entities || 
        !t.extended_entities.media ||
        !t.extended_entities.media.length
      ) {
        return false;
      }

      if (t.extended_entities.media[0].type === "photo") {
        return false;
      }
    }

    return true;
  });

  if (sort_fn) {
    res = res.sort(sort_fn);
  }
  else if (settings.sort_type === "random") {
    res = arrayShuffle(res);
  }

  if (settings.sort_way === "desc") {
    res.reverse();
  }

  return res;
}

/**
 * Filter and sort tweets
 */
export function filterTweets(tweets: PartialTweet[], with_moments?: boolean) {
  if (with_moments) {
    // TODO do not hardcode decade
    const years = findMomentsOfYears(tweets, getDecadeFrom(2010));

    // For each year, sort and filter
    for (const year in years) {
      years[year] = sortAndFilterTweetsFromSettings(years[year], SETTINGS);
    }

    let year_entries = Object.entries(years);
    // Collapse every year together (following desc or TIME ASC if specified)
    if (SETTINGS.sort_way === "asc" && SETTINGS.sort_type === "time") {
      // sort asc
      year_entries = year_entries.sort((a, b) => Number(a[0]) - Number(b[0]));
    }
    else {
      // sort year desc
      year_entries = year_entries.sort((a, b) => Number(b[0]) - Number(a[0]));
    }

    // Collapse years together
    return [].concat(...year_entries.map(e => e[1])) as PartialTweet[];
  }
  return sortAndFilterTweetsFromSettings(tweets, SETTINGS);
}

export function scoreOfTweet(tweet: PartialTweet) {
  if ('score' in tweet) {
    return tweet['score'] as number;
  }

  let score = 0;
  if (tweet.retweet_count !== undefined && !isNaN(tweet.retweet_count)) {
    score += (tweet.retweet_count * 5);
  }
  if (tweet.favorite_count !== undefined && !isNaN(tweet.favorite_count)) {
    score += tweet.favorite_count;
  }
  // @ts-ignore
  tweet['score'] = score;

  return score;
}

/**
 * Find moments of selected {years} in {tweets}
 *
 * Moments are the most {max_elements} popular tweets of a year.
 *
 * Tweets with popularity < {threshold} will be skipped.
 *
 * Unfortunatly, we can't check the number of replies to the tweet to check if it's popular...
 */
export function findMomentsOfYears(tweets: PartialTweet[], years: Iterable<number> = [new Date().getFullYear()], max_elements = 10, threshold = 5) {
  const sort_fn = (a: PartialTweet, b: PartialTweet) => scoreOfTweet(b) - scoreOfTweet(a);

  const ys = new Set(years);
  const years_to_tweets: {[year: string]: PartialTweet[]} = {};

  for (const tweet of tweets) {
    if (scoreOfTweet(tweet) < threshold) {
      continue;
    }

    const year = TwitterHelpers.dateFromTweet(tweet).getFullYear();

    if (ys.has(year)) {
      if (year in years_to_tweets) {
        years_to_tweets[year].push(tweet);
      }
      else {
        years_to_tweets[year] = [tweet];
      }
    }
  }

  // Tweets sorted by years and {threshold} of score applied
  for (const y in years_to_tweets) {
    years_to_tweets[y] = years_to_tweets[y].sort(sort_fn).slice(0, max_elements);
  }

  // Tweets sorted & filtered by popularity with array of {max_elements}
  return years_to_tweets;
}

export function isFilterApplied() {
  return SETTINGS.only_medias || SETTINGS.only_medias || SETTINGS.only_videos;
}

export function* getDecadeFrom(year: number) {
  let i = -1;
  while (++i < 10) {
    yield year + i;
  }
}

export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function unescapeTwi(str: string) {
  return str.replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<");
}

export function specialJoin(array: string[], sep = ", ", final_joiner?: string) : string {
  if (final_joiner === undefined) {
    final_joiner = " " + LANG.and + " ";
  }

  if (array.length < 2) {
    return array.join(sep);
  }

  return array.slice(0, array.length - 1).join(sep) + final_joiner + array[array.length - 1];
}

export function toggleDarkMode(force: boolean = undefined) {
  SETTINGS.dark_mode = force === undefined ? !SETTINGS.dark_mode : force;
}

export function truncateInteractionCount(count: number) {
  if (count >= 1000) {
    if (count >= 10000) {
      if (count >= 1000000) {
        if (count >= 10000000) {
          return `${Math.trunc(count / 1000000)}M`;
        }

        return `${Math.trunc(count / 100000) / 10}M`;
      }

      return `${Math.trunc(count / 1000)}K`;
    }

    return `${Math.trunc(count / 100) / 10}K`;
  }
  return String(count);
}

export function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

export function randomIntFromInterval(min: number, max: number) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function range(start: number, end?: number, step: number = 1) {
  if (end === undefined) {
    end = start;
    start = 0;
  }

  if (end < start) {
    return [];
  }

  const elements = [] as number[];
  for (let i = start; i < end; i += step) {
    elements.push(i);
  }
  return elements;
}

/**
 * Shuffle an array using the Durstenfeld shuffle.
 *
 * See: https://en.wikipedia.org/wiki/Fisher-Yates_shuffle#The_modern_algorithm
 *
 * @param array The array to shuffle
 * @param use_source `true` if shuffle use the original array, `false` to create a copy.
 */
export function arrayShuffle<T>(array: T[], use_source = true) {
  const copy = use_source ? array : [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];

    copy[i] = copy[j];
    copy[j] = temp;
  }

  return copy;
}

export function makeFileDownload(file: string, filename: string) {
  const blob = new Blob([file]);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  // the filename you want
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
}

export function extractUsersFromAvailableTweets(archive: TwitterArchive, cache: typeof UserCache) {
  const mergeOrSet = (user: Partial<PartialTweetUser>) => {
    if (cache.getFromCache(user.id_str)) {
      cache.set(user.id_str, { ...cache.getFromCache(user.id_str), ...user });
    } else {
      if (!user.name) {
        user.name = user.screen_name;
      }
      cache.set(user.id_str, user as FullUser);
    }
  };

  for (const tweet of archive.tweets) {
    mergeOrSet(tweet.user);

    // Build from in reply
    if (tweet.in_reply_to_user_id_str && tweet.in_reply_to_screen_name) {
      mergeOrSet({
        id_str: tweet.in_reply_to_user_id_str,
        screen_name: tweet.in_reply_to_screen_name,
      });
    }

    // Build from mentions
    for (const entity of tweet.entities?.user_mentions ?? []) {
      mergeOrSet({
        id_str: entity.id_str,
        screen_name: entity.screen_name,
        name: entity.name,
      });
    }
  }
}
