import { FullUser } from 'twitter-d';
import { Conversation } from 'twitter-archive-reader';
import Cache from './Cache';

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
}

export const UserCache = new __UserCache('batch/users');
export default UserCache;
