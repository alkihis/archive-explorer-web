import APIHELPER from "./tools/ApiHelper";
import { IUser } from "./tools/interfaces";
import SETTINGS from "./tools/Settings";
import { PartialTweet } from "twitter-archive-reader";
import UserCache from "./classes/UserCache";
import TwitterArchive from "twitter-archive-reader";
import { toast } from "./components/shared/Toaster/Toaster";
import { FullUser } from "twitter-d";
import { AUTO_TWITTER_CHECK } from "./const";

export function setPageTitle(title?: string) {
  document.title = "Archive Explorer" + (title ? ` - ${title}` : '');
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
                toast("Twitter credentials have expired. Please log out and log in again.", "error");
                return;
              }
              
              // Unknown error
              console.log(_, c);
              return;
            }
          }
      
          // API unavailable (fetch promise reject), or other error
          toast("Twitter account can't be verified. You may be unable to delete tweets.", "warning");
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
      return "January";
    case 2:
      return "February";
    case 3:
      return "March";
    case 4:
      return "April";
    case 5:
      return "May";
    case 6:
      return "June";
    case 7:
      return "July";
    case 8:
      return "August";
    case 9:
      return "September";
    case 10:
      return "October";
    case 11:
      return "November";
    case 12:
      return "December";
  }
}

export function uppercaseFirst(str: string) {
  return str.slice(0, 1).toLocaleUpperCase() + str.slice(1);
}

/**
 * Filter and sort tweets
 * 
 * @param tweets 
 */
export function filterTweets(tweets: PartialTweet[]) {
  let sort_fn: (a: PartialTweet, b: PartialTweet) => number; 
  
  // Every thing is asc by default !
  if (SETTINGS.sort_type === "time") {
    if (typeof BigInt !== 'undefined') {
      sort_fn = (a: PartialTweet, b: PartialTweet) => Number(BigInt(a.id_str) - BigInt(b.id_str));
    }
    else {
      // Does not support BigInt, fallback to Collator
      const coll = new Intl.Collator(undefined, { numeric: true });
      sort_fn = (a: PartialTweet, b: PartialTweet) => coll.compare(a.id_str, b.id_str);
    }
  }
  else if (SETTINGS.sort_type === "popular") {
    sort_fn = (a: PartialTweet, b: PartialTweet) => {
      let score_a = 0, score_b = 0;

      if (a.retweet_count !== undefined && !isNaN(a.retweet_count)) {
        score_a += (a.retweet_count * 5);
      }
      if (b.retweet_count !== undefined && !isNaN(b.retweet_count)) {
        score_b += (b.retweet_count * 5);
      }

      if (a.favorite_count !== undefined && !isNaN(a.favorite_count)) {
        score_a += a.favorite_count;
      }
      if (b.favorite_count !== undefined && !isNaN(b.favorite_count)) {
        score_b += b.favorite_count;
      }

      return score_a - score_b;
    };
  }
  else if (SETTINGS.sort_type === "retweets") {
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

  const rt_only = SETTINGS.show_type === "retweets";
  const tweet_only = SETTINGS.show_type === "tweets";

  const res = tweets.filter(t => {
    if (rt_only && !t.retweeted_status) {
      return false;
    }

    if (tweet_only && t.retweeted_status) {
      return false;
    }

    if (SETTINGS.only_medias && (!t.entities || !t.entities.media || !t.entities.media.length)) {
      return false;
    }

    if (SETTINGS.only_videos) {
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

  if (SETTINGS.sort_way === "desc") {
    res.reverse();
  }

  return res;
}

export function isFilterApplied() {
  return SETTINGS.only_medias || SETTINGS.only_medias || SETTINGS.only_videos;
}

export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function unescapeTwi(str: string) {
  return str.replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<");
}

export function specialJoin(array: string[], sep = ", ", final_joiner = " and ") : string {
  if (array.length < 2) {
    return array.join(sep);
  }

  return array.slice(0, array.length - 1).join(sep) + final_joiner + array[array.length - 1];
}

export function toggleDarkMode(force: boolean = undefined) {
  SETTINGS.dark_mode = force === undefined ? !SETTINGS.dark_mode : force;
}

// DEBUG
window.DEBUG.dark_mode = toggleDarkMode;
