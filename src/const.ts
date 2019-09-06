export const VERSION = "0.1.0";
export const THRESHOLD_PREFETCH = 20;
export const SERVER_URL = "http://localhost:3128";
export const AUTO_TWITTER_CHECK = false;
export const DEBUG_MODE = true;

declare global {
  interface Window {
    DEBUG: any;
  }
}
