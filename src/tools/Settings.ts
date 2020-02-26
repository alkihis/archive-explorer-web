import { IUser } from "./interfaces";
import { TwitterArchive } from "twitter-archive-reader";
import { FullUser } from "twitter-d";
import { DEBUG_MODE } from "../const";
import APIHELPER, { API_URLS } from "./ApiHelper";
import { AuthorizedLangs, isAuthorizedLang } from "../classes/Lang/Language";
import Cookies from 'js-cookie';

export type TweetSortType = "time" | "popular" | "retweets" | "favorites" | "random";
export type TweetSortWay = "asc" | "desc";
export type TweetMediaFilters = "none" | "pic" | "video";

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
  protected _auto_tweet_download = false;
  protected _auto_rt_download = true;
  protected _pp = true;
  protected _lang: AuthorizedLangs = window.navigator.language.includes('fr') ? 'fr' : 'en';

  protected _sort_way: TweetSortWay;
  protected _sort_type: TweetSortType;
  protected _media_filter: TweetMediaFilters;
  protected _allow_rts: boolean = true;
  protected _allow_self: boolean = true;
  protected _allow_mentions: boolean = true;
  protected _has_server_errors: boolean = false;
  protected _can_save_other_users_archives: boolean = true;

  // Globals
  protected current_user: IUser | null = null;
  protected current_archive: TwitterArchive | null = null;
  protected _twitter_user: FullUser;
  protected _dark_mode: boolean = null;
  protected _dark_mode_auto = media_query_list.matches;

  archive_name: string = "";
  archive_in_load = "";
  expired = false;
  is_saved_archive = false;

  constructor() {
    // Refresh html lang attribute
    document.documentElement.lang = this._lang;

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
    }
    if (localStorage.getItem('auto_tweet_download')) {
      this.tweet_dl = localStorage.getItem('auto_tweet_download') === "true";
    }
    if (localStorage.getItem('can_save_other_users_archives')) {
      this.can_save_other_users_archives = localStorage.getItem('can_save_other_users_archives') === "true";
    }
    if (localStorage.getItem('has_server_errors')) {
      this.has_server_errors = localStorage.getItem('has_server_errors') === "true";
    }
    if (localStorage.getItem('auto_rt_download')) {
      this.rt_dl = localStorage.getItem('auto_rt_download') === "true";
    }
    if (localStorage.getItem('pp')) {
      this.pp = localStorage.getItem('pp') === "true";
    }
    if (localStorage.getItem('sort_way')) {
      this.sort_way = localStorage.getItem('sort_way') as TweetSortWay;
    }
    else {
      this.sort_way = "desc";
    }
    if (localStorage.getItem('sort_type')) {
      this.sort_type = localStorage.getItem('sort_type') as TweetSortType;
    }
    else {
      this.sort_type = "time";
    }
    if (localStorage.getItem('allow_rts')) {
      this.allow_rts = localStorage.getItem('allow_rts') === "true";
    }
    if (localStorage.getItem('allow_mentions')) {
      this.allow_mentions = localStorage.getItem('allow_mentions') === "true";
    }
    if (localStorage.getItem('allow_self')) {
      this.allow_self = localStorage.getItem('allow_self') === "true";
    }
    if (localStorage.getItem('lang')) {
      const l = localStorage.getItem('lang');
      if (isAuthorizedLang(l)) {
        this._lang = l;
      }
      else {
        localStorage.removeItem('lang');
      }
    }
    if (localStorage.getItem('media_filter')) {
      this.media_filter = localStorage.getItem('media_filter') as TweetMediaFilters;
    }
    else {
      this.media_filter = "none";
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

  
  get can_save_other_users_archives() {
    return this._can_save_other_users_archives;
  }
  
  set can_save_other_users_archives(v: boolean) {
    localStorage.setItem('can_save_other_users_archives', String(v));
    this._can_save_other_users_archives = v;
  }

  get has_server_errors() {
    return this._has_server_errors;
  }
  
  set has_server_errors(v: boolean) {
    localStorage.setItem('has_server_errors', String(v));
    this._has_server_errors = v;
  }

  get lang() : AuthorizedLangs {
    return this._lang;
  }

  set lang(v: AuthorizedLangs) {
    if (!isAuthorizedLang(v)) {
      throw new Error("Language " + v + " is not valid");
    }

    const old = this._lang;

    this._lang = v;
    localStorage.setItem('lang', v);

    if (old !== v) {
      window.dispatchEvent(new CustomEvent('root.refresh'));
    }
  }

  get dark_mode() {
    if (this._dark_mode !== null)
      return this._dark_mode;
    return this._dark_mode_auto;
  }

  set dark_mode(v: boolean) {
    if (v === null) {
      localStorage.removeItem('dark_mode');
      const current = media_query_list.matches;
      this._dark_mode = null;
      window.dispatchEvent(new CustomEvent('darkmodechange', { detail: current }));

      return;
    }

    this._dark_mode = v;
    localStorage.setItem('dark_mode', String(v));
    window.dispatchEvent(new CustomEvent('darkmodechange', { detail: v }));
  }

  set passive_dark_mode(v: boolean) {
    this._dark_mode_auto = v;

    if (this.is_auto_dark_mode)
      window.dispatchEvent(new CustomEvent('darkmodechange', { detail: v }));
  }

  get is_auto_dark_mode() {
    return this._dark_mode === null;
  }

  get allow_self() {
    return this._allow_self;
  }

  set allow_self(v: boolean) {
    localStorage.setItem('allow_self', String(v));
    this._allow_self = v;
  }

  get allow_mentions() {
    return this._allow_mentions;
  }

  set allow_mentions(v: boolean) {
    localStorage.setItem('allow_mentions', String(v));
    this._allow_mentions = v;
  }

  get allow_rts() {
    return this._allow_rts;
  }

  set allow_rts(v: boolean) {
    localStorage.setItem('allow_rts', String(v));
    this._allow_rts = v;
  }

  get sort_type() {
    return this._sort_type;
  }

  set sort_type(v: TweetSortType) {
    localStorage.setItem('sort_type', v);
    this._sort_type = v;
  }

  get sort_way() {
    return this._sort_way;
  }

  set sort_way(v: TweetSortWay) {
    localStorage.setItem('sort_way', v);
    this._sort_way = v;
  }

  get media_filter() {
    return this._media_filter;
  }

  set media_filter(v: TweetMediaFilters) {
    localStorage.setItem('media_filter', v);
    this._media_filter = v;
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
    Cookies.set('login_token', v, { secure: !DEBUG_MODE, path: '/' });
    localStorage.setItem('login_token', v);
  }

  get only_medias() {
    return this._media_filter === "video" || this._media_filter === "pic";
  }

  get only_videos() {
    return this._media_filter === "video";
  }

  get tweet_dl() {
    return this._auto_tweet_download;
  }

  set tweet_dl(v: boolean) {
    this._auto_tweet_download = v;
    localStorage.setItem('auto_tweet_download', String(v));
  }

  get rt_dl() {
    return this._auto_rt_download;
  }

  set rt_dl(v: boolean) {
    this._auto_rt_download = v;
    localStorage.setItem('auto_rt_download', String(v));
  }

  set user(v: IUser) {
    this.current_user = v;
    localStorage.setItem('current_user', JSON.stringify(v));
    window.DEBUG.LoggedUser = v;
  }

  get user() {
    return this.current_user;
  }

  set twitter_user(v: FullUser) {
    this._twitter_user = v;
    localStorage.setItem('twitter_user', JSON.stringify(v));
    window.DEBUG.TwitterLoggedUser = v;
  }

  get twitter_user() {
    return this._twitter_user;
  }

  set archive(v: TwitterArchive | null) {
    if (v === undefined) {
      v = null;
    }
    this.current_archive = v;
    window.DEBUG.Archive = v;
  }

  get archive() {
    return this.current_archive;
  }

  get is_owner() {
    return !!this.archive && this.archive.user.id === this.user.twitter_id;
  }

  get can_delete() {
    if (DEBUG_MODE && window.DEBUG.globals.force_no_delete)
      return false;

    if (DEBUG_MODE)
      return true;

    return !!this.archive && this.archive.user.id === this.user.twitter_id && !this.expired;
  }

  get is_logged() {
    return !!this.token;
  }

  logout(reload = true, revoke = false) {
    const is_logged = this.is_logged;
    localStorage.removeItem("save_token_secret");

    if (revoke && is_logged) {
      // Revoke without specifing token: revoking current
      return APIHELPER.request(API_URLS.user_token_revoke, { method: 'POST' })
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
    return !!(u.created_at && u.twitter_id && u.twitter_name && u.twitter_screen_name);
  }

  protected isTUserValid(u: FullUser) {
    return !!(u.created_at && u.profile_image_url_https && u.id_str && u.screen_name && u.name);
  }
}

const SETTINGS = new AESettings();

export default SETTINGS;

//// DEBUG
window.DEBUG.Settings = SETTINGS;
