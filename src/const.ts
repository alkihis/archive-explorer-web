export const DEBUG_MODE = false;

export const VERSION = "1.5.0";
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

declare global {
  interface Window {
    DEBUG: any;
    ARCHIVE?: any;
    USER?: any;
  }
}
