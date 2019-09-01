import { FullUser } from 'twitter-d';
import { Conversation } from 'twitter-archive-reader';
import Cache from './Cache';

class __UserCache extends Cache<FullUser> {
  /** User informations about the participants (warning: it requires a fetch()) */
  twitterParticipants(conv: Conversation) : Promise<{ [userId: string]: FullUser }> {
    return UserCache.bulk([...conv.participants]);
  }
}

export const UserCache = new __UserCache('batch/users');
export default UserCache;
