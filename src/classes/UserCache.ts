import { FullUser } from 'twitter-d';
import { Conversation } from 'twitter-archive-reader';
import Cache from './Cache';
import { escapeRegExp } from '../helpers';
import { DEBUG_MODE } from '../const';
import { API_URLS } from '../tools/ApiHelper';

class __UserCache extends Cache<FullUser> {
  protected user_cache: {
    [screen_name: string]: FullUser
  } = {};

  /** User informations about the participants (warning: it requires a fetch()) */
  twitterParticipants(conv: Conversation) : Promise<{ [userId: string]: FullUser }> {
    return UserCache.bulk([...conv.participants]);
  }

  async bulk(ids: string[], events: EventTarget = document.createElement('div'), id_field = "ids") {
    const already_bulked: {
      [id: string]: FullUser;
    } = {};
    if (id_field === "sns") {
      const new_ids: string[] = [];

      for (const id of ids) {
        const i = id.toLowerCase();
        if (i in this.user_cache) {
          already_bulked[this.user_cache[i].id_str] = this.user_cache[i];
        }
        else {
          new_ids.push(id);
        }
      }
      ids = new_ids;
    }

    const bulked = await super.bulk(ids, events, id_field);

    // Register screen names
    for (const user of Object.values(bulked)) {
      this.user_cache[user.screen_name] = user;
      this.user_cache[user.screen_name.toLowerCase()] = user;
    }

    return {...bulked, ...already_bulked};
  }

  getFromCacheByScreenName(screen_name: string) {
    return this.user_cache[screen_name];
  }

  getFromCacheByApproximateName(screen_name_or_name: string | RegExp) {
    const matched: FullUser[] = [];

    if (typeof screen_name_or_name === 'string') {
      try {
        screen_name_or_name = new RegExp(
          (screen_name_or_name.startsWith('^') ? '' : '^') + 
          screen_name_or_name + 
          (screen_name_or_name.endsWith('$') ? '' : '$'), 'i');
      } catch (e) {
        screen_name_or_name = new RegExp('^' + escapeRegExp(screen_name_or_name as string) + '$', 'i');
      }
    }

    for (const user of Object.values(this.user_cache)) {
      if (user.screen_name.match(screen_name_or_name) || user.name.match(screen_name_or_name)) {
        matched.push(user);
      }
    }

    return matched;
  }

  clear() {
    this.user_cache = {};
    this.cache = {};
    this.asked_by_empty = new Set();
  }
}

export const UserCache = new __UserCache(API_URLS.batch_users);
export default UserCache;

if (DEBUG_MODE) {
  window.DEBUG.UserCache = UserCache;
}
