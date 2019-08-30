import APIHELPER from "./tools/ApiHelper";
import { IUser } from "./tools/interfaces";
import SETTINGS from "./tools/Settings";
import { PartialTweet } from "twitter-archive-reader";
import UserCache from "./classes/UserCache";
import DMArchive from "twitter-archive-reader";

export const VERSION = "0.1.0";

declare global {
  interface Window {
    DEBUG: any;
  }
}

export function setPageTitle(title?: string) {
  document.title = "Archive Explorer" + (title ? ` - ${title}` : '');
}

export async function checkCredentials() {
  try {
    const reso: IUser = await APIHELPER.request('users/credentials');
    SETTINGS.user = reso;
    return !!reso.user_id;
  } catch (e) {
    return false;
  }
}

export function dateFromTweet(tweet: PartialTweet) : Date {
  if ('created_at_d' in tweet) {
    return tweet.created_at_d;
  }
  return tweet.created_at_d = new Date(tweet.created_at);
}

export function prefetchAllUserData(archive: DMArchive) {
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
