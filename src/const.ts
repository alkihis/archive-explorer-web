import TwitterArchive from "twitter-archive-reader";

export const DEBUG_MODE = true;

export const VERSION = "1.5.5";
export const THRESHOLD_PREFETCH = 20;
export const SERVER_URL = DEBUG_MODE ? "http://localhost:3128" : "https://archive-explorer.com";
export const AUTO_TWITTER_CHECK = !DEBUG_MODE;
export const THRESHOLD_SIZE_LIMIT = 0.75 * 1024 * 1024 * 1024;

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

declare global {
  interface Window {
    DEBUG: Partial<DebugContainer>;
    localforage: any;
  }
}

window.DEBUG = {
  SavedArchiveTester: {},
  SearchHistories: {},
  globals: {},
  TwitterArchive
};
