import { IUser } from "./interfaces";
import { TwitterArchive } from "twitter-archive-reader";
import { FullUser } from "twitter-d";
import { DEBUG_MODE } from "../const";
import APIHELPER from "./ApiHelper";

// Check if dark theme requested
const media_query_list = window.matchMedia('(prefers-color-scheme: dark)');

// Listen for dark mode change
try {
  media_query_list.addEventListener("change", () => {
    // Refresh current setting
    SETTINGS.passive_dark_mode = media_query_list.matches;
  });
} catch (e) {
  // needed for Safari or navs that doesn't implement EventTarget:
  // Use of @deprecated .addListener
  media_query_list.addListener(() => {
    // Refresh current setting
    SETTINGS.passive_dark_mode = media_query_list.matches;
  });
}

class AESettings {
  // Saved settings
  protected _token: string = "";
  protected _only_medias: boolean = false;
  protected _only_videos = false;
  protected _auto_tweet_download = false;
  protected _only_rts = false;
  protected _pp = true;
  protected _sort_reverse_chrono = true;

  // Globals
  protected current_user: IUser | null = null;
  protected current_archive: TwitterArchive | null = null;
  protected _twitter_user: FullUser;
  protected _dark_mode: boolean = null;
  protected _dark_mode_auto = media_query_list.matches;

  archive_name: string = "";
  archive_in_load = "";
  expired = false;

  constructor() {
    if (localStorage.getItem('login_token')) {
      this.token = localStorage.getItem('login_token');
    }
    if (localStorage.getItem('dark_mode')) {
      this.dark_mode = localStorage.getItem('dark_mode') === "true";
    }
    else {
      // Initial init
      console.log("Autodetecting prefereed mode...");
      console.log("Dark mode on:", media_query_list.matches);
      this.dark_mode = media_query_list.matches;
    }
    if (localStorage.getItem('only_medias')) {
      this.only_medias = localStorage.getItem('only_medias') === "true";
    }
    if (localStorage.getItem('only_videos')) {
      this.only_videos = localStorage.getItem('only_videos') === "true";
    }
    if (localStorage.getItem('auto_tweet_download')) {
      this.tweet_dl = localStorage.getItem('auto_tweet_download') === "true";
    }
    if (localStorage.getItem('only_rts')) {
      this.only_rts = localStorage.getItem('only_rts') === "true";
    }
    if (localStorage.getItem('pp')) {
      this.pp = localStorage.getItem('pp') === "true";
    }
    if (localStorage.getItem('sort_reverse_chrono')) {
      this.sort_reverse_chrono = localStorage.getItem('sort_reverse_chrono') === "true";
    }
    if (localStorage.getItem('current_user')) {
      try {
        const u = JSON.parse(localStorage.getItem('current_user'));

        if (this.isUserValid(u)) {
          this.user = u;
        }
        else {
          localStorage.removeItem('current_user');
        }
      } catch (e) {
        localStorage.removeItem('current_user');
      }
    }
    if (localStorage.getItem('twitter_user')) {
      try {
        const u = JSON.parse(localStorage.getItem('twitter_user'));

        if (this.isTUserValid(u)) {
          this.twitter_user = u;
        }
        else {
          localStorage.removeItem('twitter_user');
        }
      } catch (e) {
        localStorage.removeItem('twitter_user');
      }
    }
  }

  get dark_mode() {
    if (this._dark_mode !== null)
      return this._dark_mode;
    return this._dark_mode_auto;
  }

  set dark_mode(v: boolean) {
    this._dark_mode = v;
    localStorage.setItem('dark_mode', String(v));
    window.dispatchEvent(new CustomEvent('darkmodechange', { detail: v }));
  }

  set passive_dark_mode(v: boolean) {
    this._dark_mode = null;
    localStorage.removeItem('dark_mode');
    this._dark_mode_auto = v;
    window.dispatchEvent(new CustomEvent('darkmodechange', { detail: v }));
  }

  get sort_reverse_chrono() {
    return this._sort_reverse_chrono;
  }

  set sort_reverse_chrono(v: boolean) {
    this._sort_reverse_chrono = v;
    localStorage.setItem('sort_reverse_chrono', String(v));
  }

  get pp() {
    return this._pp;
  }

  set pp(v: boolean) {
    this._pp = v;
    localStorage.setItem('pp', String(v));
  }

  get token() {
    return this._token;
  }

  set token(v: string) {
    this._token = v;
    localStorage.setItem('login_token', v);
  }

  get only_medias() {
    return this._only_medias;
  }

  set only_medias(v: boolean) {
    this._only_medias = v;
    localStorage.setItem('only_medias', String(v));
  }

  get only_videos() {
    return this._only_videos;
  }

  set only_videos(v: boolean) {
    this._only_videos = v;
    localStorage.setItem('only_videos', String(v));
  }

  get only_rts() {
    return this._only_rts;
  }

  set only_rts(v: boolean) {
    this._only_rts = v;
    localStorage.setItem('only_rts', String(v));
  }

  get tweet_dl() {
    return this._auto_tweet_download;
  }

  set tweet_dl(v: boolean) {
    this._auto_tweet_download = v;
    localStorage.setItem('auto_tweet_download', String(v));
  }

  set user(v: IUser) {
    this.current_user = v;
    localStorage.setItem('current_user', JSON.stringify(v));
  }

  get user() {
    return this.current_user;
  }

  set twitter_user(v: FullUser) {
    this._twitter_user = v;
    localStorage.setItem('twitter_user', JSON.stringify(v));
  }

  get twitter_user() {
    return this._twitter_user;
  }

  set archive(v: TwitterArchive | null) {
    this.current_archive = v;
  }

  get archive() {
    return this.current_archive;
  }

  get is_owner() {
    return !!this.archive && this.archive.owner === this.user.twitter_id;
  }

  get can_delete() {
    if (DEBUG_MODE && window.DEBUG.force_no_delete)
      return false;

    if (DEBUG_MODE)
      return true;

    return !!this.archive && this.archive.owner === this.user.twitter_id && !this.expired;
  }

  get is_logged() {
    return !!this.token;
  }

  logout(reload = true, revoke = false) {
    const is_logged = this.is_logged;

    if (revoke && is_logged) {
      // Revoke without specifing token: revoking current
      return APIHELPER.request('users/tokens/revoke', { method: 'POST' })
        .finally(() => {
          this.token = "";

          if (reload)
            this.reload();
        });
    }
    else {
      this.token = "";

      if (reload)
        this.reload();
    }
  }

  reload() {
    window.location.pathname = '/';
  }

  protected isUserValid(u: IUser) {
    if (u.created_at && u.twitter_id && u.twitter_name && u.twitter_screen_name) {
      return true;
    }
    return false;
  }

  protected isTUserValid(u: FullUser) {
    if (u.created_at && u.profile_image_url_https && u.id_str && u.screen_name && u.name) {
      return true;
    }
    return false;
  }
}

const SETTINGS = new AESettings();

export default SETTINGS;

//// DEBUG
window.DEBUG.settings = SETTINGS;
