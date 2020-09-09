import LocalForage from 'localforage';
import uuidv4 from 'uuid/v4';
import TwitterArchive from 'twitter-archive-reader';
import ArchiveSaver, { ArchiveSave } from 'twitter-archive-saver';
import SETTINGS from '../Settings';
import EventTarget, { defineEventAttribute } from 'event-target-shim';

export interface SavedArchiveInfo {
  /** Unique identifier of the archive */
  uuid: string;
  /** Number of tweets in this archive */
  tweets: number;
  /** Number of DMs in this archive */
  dms: number;
  /** Last registered tweet in this archive */
  last_tweet_date: string;
  /** The date when the archive has been saved */
  save_date: string;
  /** The TwitterArchive's hash. May be not reliable, so `.uuid` is used for unique identifiers */
  hash: string;
  /** The archive name */
  name: string;
  /** User who own the archive */
  user?: {
    screen_name: string;
    name: string;
    id_str: string;
  };
}

type AvailableArchives = SavedArchiveInfo[];
type SavedArchivesEvents = {
  load: CustomEvent<TwitterArchive>;
  error: CustomEvent<any>;
};

type SavedArchivesOnEvents = {
  onload: CustomEvent<TwitterArchive>;
  onerror: CustomEvent<any>;
};

export class SavedArchives extends EventTarget<SavedArchivesEvents, SavedArchivesOnEvents> {
  protected saved_users_store = LocalForage.createInstance({
    name: "saved",
    driver: LocalForage.INDEXEDDB
  });

  protected readonly SAVED_USERS_KEY = "saved";
  protected readonly AVAILABLE_ARCHIVES_KEY = "available";

  protected store_by_user_id: { [userId: string]: LocalForage } = {};
  protected ask_persistence = false;

  constructor() {
    super();

    if (this.can_work && window.navigator && navigator.storage && navigator.storage.persisted) {
      // Ask for persistency
      navigator.storage.persisted()
        .then(is_persistent => {
          if (!is_persistent) {
            console.log("Storage for archive saves is not persistent, trying to be persistent on the next archive save.");
            this.ask_persistence = true;
          }
        });
    }
  }

  /**
   * Percentage usage of storage quota. Warning: this does **not** work in Safari !
   */
  async usedQuota() {
    if (window.navigator && navigator.storage && navigator.storage.estimate) {
      const estimated = await navigator.storage.estimate();
      return {
        available: estimated.quota,
        used: estimated.usage,
        quota: estimated.usage / estimated.quota
      };
    }
    return {
      available: 1,
      used: 0,
      quota: 0
    };
  }

  /**
   * Get user info of a save, even if its doesn't have `.user` property.
   * @param info 
   */
  getUserInfoOf(info: SavedArchiveInfo) {
    if (info.user)
      return info.user;

    return {
      screen_name: SETTINGS.user.twitter_screen_name,
      id_str: SETTINGS.user.twitter_id,
      name: SETTINGS.user.twitter_name
    };
  }

  // -------------------------
  // USER MANAGEMENT FUNCTIONS
  // -------------------------

  /**
   * Get the registred users in store. Returns a array of stringified twitter user ids.
   */
  async getRegistredUsers() {
    const registred = await this.saved_users_store.getItem<string[]>(this.SAVED_USERS_KEY);
    return registred ? registred : [];
  }

  /**
   * Register a new user to the saved user store.
   * 
   * This is **not** done when you ask for a storage for performance's sake, so
   * please take care of register an user when you register an archive from him !
   */
  protected async registerUser(user_id: string) {
    const current = await this.getRegistredUsers();

    const new_one = new Set(current);
    new_one.add(user_id);

    return this.saved_users_store.setItem(this.SAVED_USERS_KEY, [...new_one]);
  }

  /**
   * Remove an user from the store and delete its saved archives.
   */
  protected async removeUser(user_id: string) {
    const users = await this.getRegistredUsers();
    
    try {
      // Drop instance fails sometimes...
      await this.removeStorageOf(user_id);
    } catch (e) { }

    return this.saved_users_store.setItem(this.SAVED_USERS_KEY, users.filter(u => u !== user_id));
  }


  // -----------------------------
  // CURRENT LOGGED USER FUNCTIONS
  // -----------------------------

  /**
   * Get the registered archives for logged user.
   */
  getRegistredArchives() {
    return this.getRegistredArchivesOf(this.logged_user_id);
  }

  /**
   * Get an archive owned by logged user.
   */
  getArchive(uuid: string) {
    return this.getArchiveOf(this.logged_user_id, uuid);
  }

  /**
   * Register a new save for logged user.
   */
  registerArchive(archive: TwitterArchive, name: string, compress = false) {
    return this.registerArchiveOf(this.logged_user_id, archive, name, compress);
  }

  /**
   * Remove a single save of logged user.
   */
  removeArchive(uuid: string) {
    return this.removeArchiveOf(this.logged_user_id, uuid);
  }

  /**
   * Remove all the archive saves of logged user.
   */
  removeCurrentUser() {
    return this.removeUser(this.logged_user_id);
  }  


  // ---------------------------------------
  // APPLY TO ALL ARCHIVE STORAGES FUNCTIONS
  // ---------------------------------------

  /**
   * Get all archives saved, ordered by user id.
   */
  async getRegistredArchivesOfAllUsers() {
    const ids = await this.getRegistredUsers();
    const all_archives: { [userId: string]: AvailableArchives } = {};

    for (const id of ids) {
      all_archives[id] = await this.getRegistredArchivesOf(id);
    }

    return all_archives;
  }
  
  /**
   * Get the storage for each user available.
   */
  protected async getAllStorages() {
    const saved = await this.getRegistredUsers();
    const entries = saved.map(user => [user, this.getStorageOf(user)] as [string, LocalForage]);

    const all: { [userId: string]: LocalForage } = {};
    for (const [user, entry] of entries) {
      all[user] = entry;
    }

    return all;
  }


  // -----------------------------------------
  // ARCHIVE MANAGEMENT USER-GENERIC FUNCTIONS
  // -----------------------------------------

  /**
   * Get a archive from a user {owner} by its {uuid}.
   */
  protected async getArchiveOf(owner: string, uuid: string) : Promise<TwitterArchive> {
    const storage = this.getStorageOf(owner);
    const serialized = await storage.getItem(uuid) as ArchiveSave;

    if (serialized) {
      return ArchiveSaver.restore(serialized).then(archive => {
        this.dispatchEvent({ type: "load", detail: archive });
        return archive;
      }).catch(error => {
        this.dispatchEvent({ type: 'error', detail: error });
        return error;
      });
    }
    throw new Error("Archive does not exists");
  }

  /**
   * Get the collection associated to the given {user_id}.
   */
  protected getStorageOf(user_id: string) {
    if (user_id in this.store_by_user_id) {
      return this.store_by_user_id[user_id];
    }

    return this.store_by_user_id[user_id] = LocalForage.createInstance({
      name: user_id,
      driver: LocalForage.INDEXEDDB
    });
  }

  /**
   * Remove the collection associated to {user_id}.
   * 
   * If you want to delete all archives from an user, **please use `.removeUser()`, not this !**
   */
  protected async removeStorageOf(user_id: string) {
    if (user_id in this.store_by_user_id) {
      delete this.store_by_user_id[user_id];
    }

    await LocalForage.dropInstance({
      name: user_id
    }).catch(e => e);
  }

  /**
   * Get all the archives from {user_id}.
   */
  protected async getRegistredArchivesOf(user_id: string) {
    const storage = this.getStorageOf(user_id);

    const available = await storage.getItem<AvailableArchives>(this.AVAILABLE_ARCHIVES_KEY);

    return available ? available : [];
  }

  /**
   * Register a single {archive} into {owner}'s storage.
   */
  protected async registerArchiveOf(owner: string, archive: TwitterArchive, name: string, compress = false) {
    if (!archive || !(archive instanceof TwitterArchive)) {
      throw new Error("Archive is not valid.");
    }

    const storage = this.getStorageOf(owner);
    const archives = await this.getRegistredArchivesOf(owner);

    const current_hash = archive.hash;

    // Check if archive already exists
    const existant = archives.find(a => a.hash === current_hash);
    if (existant) {
      // Archive already exists, don't save it
      return existant;
    }

    if (this.ask_persistence) {
      // Ask for storage to be persistent. We do not await this.
      this.askForPersistence();
    }

    // Create the save
    // @ts-expect-error
    const save = await ArchiveSaver.create(archive, {
      tweets: true,
      dms: true,
      mutes: true,
      favorites: true,
      followers: true,
      followings: true,
      blocks: true,
      user: {
        phone_number: true,
        verified: true,
        age_info: true,
        email_address_changes: true,
        personalization: true,
      },
      ad_archive: true,
      compress
    });

    // Create the save info from save + current archive data
    const info: SavedArchiveInfo = {
      uuid: uuidv4(),
      tweets: save.info.tweet_count,
      dms: save.info.dm_count,
      last_tweet_date: save.info.last_tweet_date,
      save_date: new Date().toString(),
      hash: save.info.hash,
      name,
      user: {
        screen_name: archive.user.screen_name,
        name: archive.user.name,
        id_str: archive.user.id,
      },
    };

    // Save the archive
    await storage.setItem(info.uuid, save);

    // Save the updated available archives
    await storage.setItem<AvailableArchives>(this.AVAILABLE_ARCHIVES_KEY, [...archives, info]);

    // Register the user in the saved
    await this.registerUser(owner);

    return info;
  }

  /**
   * Remove a single archive save from {owner}'s storage. To remove all saves, please use `.removeUser()`.
   */
  protected async removeArchiveOf(owner: string, uuid: string) {
    const storage = this.getStorageOf(owner);
    const available = await this.getRegistredArchivesOf(owner);
    const new_availables = available.filter(a => a.uuid !== uuid);

    await storage.removeItem(uuid);
    await storage.setItem(this.AVAILABLE_ARCHIVES_KEY, new_availables);
  }

  /**
   * Remove all the saved archives.
   */
  async removeAllArchives() {
    const users = await this.getRegistredUsers();

    for (const user of users) {
      try {
        await this.removeStorageOf(user);
      } catch (e) {}
    }
    await this.saved_users_store.setItem(this.SAVED_USERS_KEY, []);
  }


  // ----
  // MISC
  // ----

  /**
   * `true` if the archive save system can work.
   */
  get can_work() {
    return LocalForage.supports(LocalForage.INDEXEDDB);
  }

  /**
   * Current user logged id.
   */
  protected get logged_user_id() {
    const logged_user = SETTINGS.user;

    if (!logged_user) {
      throw new Error("User must be logged");
    }

    return logged_user.user_id;
  }

  /**
   * Ask for storage persistency. Must be called at archive saving if `this.ask_persistance === true`.
   */
  protected async askForPersistence() {
    this.ask_persistence = false;

    if (navigator.storage) {
      return navigator.storage.persist()
        .then(has_succeeded => {
          if (!has_succeeded) {
            console.warn("Persistence demand failed or rejected. Storage may be wiped in the future.");
          }
        })
        .catch(e => console.error("Unable to ask for persistency", e));
    }
  }
}
defineEventAttribute(SavedArchives.prototype, "load");
defineEventAttribute(SavedArchives.prototype, "error");

const SAVED_ARCHIVES = new SavedArchives();

export default SAVED_ARCHIVES;


///***** TEST */
export async function loadFirstSavedArchiveInSettings(specific?: string) {
  const available = await SAVED_ARCHIVES.getRegistredArchives();
  console.log(available);

  if (available.length) {
    let choosen = available[0];

    if (specific) {
      const found = available.find(a => a.uuid === specific);
      if (found) {
        choosen = found;
      }
      else {
        console.log("Choosen archive not found");
      }
    }
    console.log("Loading the archive");
    const archive = await SAVED_ARCHIVES.getArchive(choosen.uuid);
    
    loadSavedArchiveInSettings(choosen.name, archive);
    console.log("Archive is loaded !");
  }
}

export function loadSavedArchiveInSettings(name: string, archive: TwitterArchive) {
  SETTINGS.archive = archive;
  SETTINGS.archive_name = name;
}

export function saveCurrentArchive() {
  return SAVED_ARCHIVES.registerArchive(SETTINGS.archive, SETTINGS.archive_name);
}

export function deleteArchive(uuid: string) {
  if (uuid) {
    return SAVED_ARCHIVES.removeArchive(uuid);
  }
}


// -- DEBUG --
window.localforage = LocalForage;
window.DEBUG.SavedArchives = SAVED_ARCHIVES;
window.DEBUG.SavedArchiveTester!.loader = loadFirstSavedArchiveInSettings;
window.DEBUG.SavedArchiveTester!.creator = saveCurrentArchive;
window.DEBUG.SavedArchiveTester!.remover = deleteArchive;
// -- DEBUG --
///***** END TEST */
