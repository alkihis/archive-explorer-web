import { FullUser } from 'twitter-d';
import APIHELPER from '../tools/ApiHelper';
import { Conversation } from 'twitter-archive-reader';

class __UserCache {
  protected cache: {
    [id: string]: FullUser
  } = {};

  async bulk(ids: string[]) {
    const ids_to_get = ids.filter(u => !this.has(u));
    const ids_to_get_from_cache = ids.filter(u => this.has(u));

    let users: { [userId: string]: FullUser } = {};

    // Si il y a des IDs à récupérer
    if (ids_to_get.length) {
        users = await APIHELPER.request('batch/users', {
        method: 'POST',
        parameters: { ids: ids.filter(u => !this.has(u)) },
        body_mode: "json"
      });

      // On met à jour le cache
      for (const [id, v] of Object.entries(users)) {
        this.cache[id] = v;
      }
    }

    // On récupère les utilisateurs déjà en cache pour les ajouter à l'objet
    for (const cached_user of ids_to_get_from_cache) {
      users[cached_user] = this.getFromCache(cached_user);
    }

    return users;
  }

  async get(id: string) {
    if (this.has(id)) {
      return this.getFromCache(id);
    }

    const user = await this.bulk([id]);

    if (id in user) {
      return user[id];
    }

    return null;
  }

  /** User informations about the participants (warning: it requires a fetch()) */
  twitterParticipants(conv: Conversation) : Promise<{ [userId: string]: FullUser }> {
    return UserCache.bulk([...conv.participants]);
  }

  protected getFromCache(id: string) {
    return this.cache[id];
  }

  protected has(id: string) {
    return id in this.cache;
  }
}

export const UserCache = new __UserCache;
export default UserCache;
