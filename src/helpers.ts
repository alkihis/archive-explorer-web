import APIHELPER from "./tools/ApiHelper";
import { IUser } from "./tools/interfaces";
import SETTINGS, { TweetSortType, TweetSortWay } from "./tools/Settings";
import { PartialTweet, dateFromTweet } from "twitter-archive-reader";
import UserCache from "./classes/UserCache";
import TwitterArchive from "twitter-archive-reader";
import { toast } from "./components/shared/Toaster/Toaster";
import { FullUser } from "twitter-d";
import { AUTO_TWITTER_CHECK } from "./const";
import LANG from "./classes/Lang/Language";

export function setPageTitle(title?: string, absolute = false) {
  if (!absolute)
    document.title = "Archive Explorer" + (title ? ` - ${title}` : '');
  else
    document.title = title;
}

/**
 * Return true if user is verified, false if token expires, null if server can't be accessed.
 */
export async function checkCredentials(auto_user_dl = true, check_twitter_account = AUTO_TWITTER_CHECK) {
  try {
    const reso: IUser = await APIHELPER.request('users/credentials');
    SETTINGS.user = reso;

    if (check_twitter_account) {
      const twitter_check = APIHELPER.request('users/twitter');

      twitter_check
        .then((d: { user: IUser, twitter: FullUser }) => {
          SETTINGS.twitter_user = d.twitter;
        })
        .catch((e: any) => {
          if (Array.isArray(e)) {
            const [_, c] = e as [Response, any];
      
            if (c) {
              if (c.code === 11) {
                // Token expiré
                SETTINGS.expired = true;
                toast(LANG.credentials_expired, "error");
                return;
              }
              
              // Unknown error
              console.log(_, c);
              return;
            }
          }
      
          // API unavailable (fetch promise reject), or other error
          toast(LANG.account_unverifable, "warning");
        });
    }

    if (reso.twitter_id && auto_user_dl) {
      if (UserCache.getFromCache(reso.twitter_id)) {
        SETTINGS.twitter_user = UserCache.getFromCache(reso.twitter_id);
      }
      else {
        try {
          const u_twi = await UserCache.get(reso.twitter_id);

          if (u_twi) {
            SETTINGS.twitter_user = u_twi;
          }
        } catch (e) { /* do nothing, l'utilisateur peut ne pas exister */ }
      }
    }

    return !!reso.user_id;
  } catch (e) {
    if (Array.isArray(e)) {
      const [rq, c] = e as [Response, any];

      if (rq) {
        if (rq.status === 403 || rq.status === 401) {
          // Login invalid
          return false;
        }
        
        // Unknown error
        console.log(rq, c);
      }
    }

    // API unavailable (fetch promise reject), or other error
    return null;
  }
}

export function prefetchAllUserData(archive: TwitterArchive) {
  const sets: Set<string>[] = archive.messages.all.map(e => e.participants);

  const users = new Set<string>();

  for (const s of sets) {
    for (const u of s) {
      users.add(u);
    }
  }

  if (users.size)
    return UserCache.bulk([...users]);

  return Promise.resolve();
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
  else {
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

  const res = tweets.filter(t => {
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
  }).sort(sort_fn);

  if (settings.sort_way === "desc") {
    res.reverse();
  }

  return res;
}

/**
 * Filter and sort tweets
 * 
 * @param tweets 
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

    const year = dateFromTweet(tweet).getFullYear();

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

// DEBUG
window.DEBUG.dark_mode = toggleDarkMode;
