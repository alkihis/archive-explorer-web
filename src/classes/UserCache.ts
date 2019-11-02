import { FullUser } from 'twitter-d';
import { Conversation } from 'twitter-archive-reader';
import Cache from './Cache';
import { escapeRegExp } from '../helpers';

class __UserCache extends Cache<FullUser> {
  protected user_cache: {
    [screen_name: string]: FullUser
  } = {};

  /** User informations about the participants (warning: it requires a fetch()) */
  twitterParticipants(conv: Conversation) : Promise<{ [userId: string]: FullUser }> {
    return UserCache.bulk([...conv.participants]);
  }

  async bulk(ids: string[], events: EventTarget = document.createElement('div')) {
    const bulked = await super.bulk(ids, events);

    // Register screen names
    for (const user of Object.values(bulked)) {
      this.user_cache[user.screen_name] = user;
    }

    return bulked;
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
}

export const UserCache = new __UserCache('batch/users');
export default UserCache;
