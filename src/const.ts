import TwitterArchive from "twitter-archive-reader";

export const DEBUG_MODE = process.env.NODE_ENV === 'development';

export const VERSION = "1.8.0";
export const THRESHOLD_PREFETCH = 20;
export const SERVER_URL = DEBUG_MODE ? ("http://" + window.location.hostname + ":3128") : "";
export const AUTO_TWITTER_CHECK = !DEBUG_MODE;
export const THRESHOLD_SIZE_LIMIT = 0.75 * 1024 * 1024 * 1024;
export const MAX_CLOUDED_ARCHIVES = 10;

export const IMG_PREFIX = "/assets/";
export const IMG_LIST: string[] = [
  "1.jpg",
  "2.jpg",
  "3.jpg",
  "4.jpg",
  "5.jpg",
];

export const REGEX_URL = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g;


// --------------------
// Useful for debugging
// --------------------

/**
 * In this, everything is intentionnaly `any`-typed, in order to avoid imports.
 */
interface DebugContainer {
  SavedArchives: any;
  SavedArchiveTester: Partial<{
    creator: any;
    loader: any;
    remover: any;
  }>;
  SearchHistories: Partial<{
    DMSearchHistory: any;
    TweetSearchHistory: any;
  }>;
  TaskManager: any;
  RootComponent: any;
  Helpers: any;
  Archive: any;
  Loaded: any;
  LoggedUser: any;
  TwitterLoggedUser: any;
  TweetCache: any;
  UserCache: any;
  Settings: any;
  LanguageDatabase: any;
  Language: any;
  globals: {
    force_no_delete?: boolean;
  };
  last_archive_error: any;
  TwitterArchive: any;
}

interface ArchiveExplorer {
  archive: any;
  tweet_cache: any;
  user_cache: any;
  saver: any;
  search_history: any;
  tasks: any;
  helpers: any;
  settings: any;
  lang: any;
  setLanguage(lang: string): void;
  reloadComponentTree(): void;
}

declare global {
  interface Window {
    DEBUG: Partial<DebugContainer>;
    localforage: any;
    Explorer: ArchiveExplorer;
  }
}

window.Explorer = {
  get archive() {
    return window.DEBUG.Loaded;
  },
  get tweet_cache() {
    return window.DEBUG.TweetCache;
  },
  get user_cache() {
    return window.DEBUG.UserCache;
  },
  get saver() {
    return window.DEBUG.SavedArchives;
  },
  get search_history() {
    return window.DEBUG.SearchHistories;
  },
  get tasks() {
    return window.DEBUG.TaskManager;
  },
  get helpers() {
    return window.DEBUG.Helpers;
  },
  get settings() {
    return window.DEBUG.Settings;
  },
  get lang() {
    return window.DEBUG.Language;
  },
  setLanguage(lang: string) {
    const settings = this.settings;
    if (settings) {
      settings.lang = lang;
    }
  },
  reloadComponentTree() {
    window.DEBUG.RootComponent.forceUpdate();
  },
};

window.DEBUG = {
  SavedArchiveTester: {},
  SearchHistories: {},
  globals: {},
  TwitterArchive,
  get Loaded() {
    if (this.Settings) {
      return this.Settings.archive;
    }
    return null;
  },
};
