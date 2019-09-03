import APIHELPER from "../tools/ApiHelper";

export class Cache<T> {
  protected cache: {
    [id: string]: T
  } = {};

  protected asked_by_empty: Set<string> = new Set;

  protected readonly CHUNK_LENGTH = 100;
  protected readonly MAX_THREADS = 5;

  constructor(protected url: string, protected id_field = "id_str") { }

  async bulk(ids: string[], events: EventTarget = document.createElement('div')) {
    const ids_to_get = ids.filter(u => !this.has(u) && !this.asked_by_empty.has(u));
    const ids_to_get_from_cache = ids.filter(u => this.has(u));

    let getted: { [id: string]: T } = {};

    // Si il y a des IDs à récupérer
    if (ids_to_get.length) {
      let i = 0;

      let promises: Promise<void>[] = [];
      while (i < ids_to_get.length) {
        const chunk = ids_to_get.slice(i, i + this.CHUNK_LENGTH);

        promises.push(
          this.tinyBulk(chunk)
            .then(data => {
              for (const [id, v] of Object.entries(data)) {
                getted[id] = v;
              }

              events.dispatchEvent(new CustomEvent('progress', { detail: {
                downloaded: Object.keys(getted).length,
                total: ids_to_get.length
              }}));
            })
        );

        if (promises.length >= this.MAX_THREADS) {
          await Promise.all(promises);
          promises = [];
        }

        i += this.CHUNK_LENGTH;
      }

      await Promise.all(promises);
    }

    // On récupère les tweets déjà en cache pour les ajouter à l'objet
    for (const cached_user of ids_to_get_from_cache) {
      getted[cached_user] = this.getFromCache(cached_user);
    }

    return getted;
  }

  protected async tinyBulk(ids: string[]) {
    const api_res: T[] = await APIHELPER.request(this.url, {
      method: 'POST',
      parameters: { ids },
      body_mode: "json",
      auth: true
    });

    const returned: { [id: string]: T } = {};

    for (const t of api_res) {
      // @ts-ignore
      returned[t[this.id_field]] = t;
    }

    // On met à jour le cache
    for (const [id, v] of Object.entries(returned)) {
      this.cache[id] = v;
    }

    // Check quels ids étaient demandés mais non reçus
    const ids_recus = new Set(Object.keys(returned));
    const diff = ids.filter(e => !ids_recus.has(e));

    for (const unrecieved of diff) {
      this.asked_by_empty.add(unrecieved);
    }
    
    return returned;
  }

  async get(id: string) {
    if (this.has(id)) {
      return this.getFromCache(id);
    }

    const tweet = await this.tinyBulk([id]);

    if (id in tweet) {
      return tweet[id];
    }

    return null;
  }

  getFromCache(id: string) {
    return this.cache[id];
  }

  protected has(id: string) {
    return id in this.cache;
  }

  clearFailCache() {
    this.asked_by_empty = new Set;
  }
}

export default Cache;
