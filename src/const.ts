export const VERSION = "0.4.0";
export const THRESHOLD_PREFETCH = 20;
export const SERVER_URL = "http://localhost:3128";
// export const SERVER_URL = "https://beta.archive-explorer.fr";
export const AUTO_TWITTER_CHECK = true;
export const DEBUG_MODE = false;

export const IMG_PREFIX = "/assets/";
export const IMG_LIST: string[] = [
  "1.jpg",
  "2.jpg",
  "3.jpg",
  "4.jpg",
  "5.jpg",
];

declare global {
  interface Window {
    DEBUG: any;
  }
}
