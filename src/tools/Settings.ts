import { TwitterArchive } from "twitter-archive-reader";
import { FullUser } from "twitter-d";
import { AuthorizedLangs, isAuthorizedLang } from "../classes/Lang/Language";

export type TweetSortType = "time" | "popular" | "retweets" | "favorites" | "random";
export type FavoriteTweetSortType = "time" | "random";
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
  protected _pp = true;
  protected _lang: AuthorizedLangs = window.navigator.language.includes('fr') ? 'fr' : 'en';

  protected _sort_way: TweetSortWay;
  protected _sort_type: TweetSortType;
  public favorite_sort_type: FavoriteTweetSortType = "time";
  protected _media_filter: TweetMediaFilters;
  protected _allow_rts: boolean = true;
  protected _allow_self: boolean = true;
  protected _allow_mentions: boolean = true;
  protected _has_server_errors: boolean = false;
  protected _can_save_other_users_archives: boolean = true;
  protected _use_tweets_local_medias: boolean = true;
  protected _use_tweets_local_videos: boolean = true;
  protected _show_explore_as_list: boolean = false;

  // Globals
  protected current_archive: TwitterArchive | null = null;
  protected _twitter_user: FullUser;
  protected _dark_mode: boolean = null;
  protected _dark_mode_auto = media_query_list.matches;

  archive_name: string = "";
  archive_in_load = "";
  is_saved_archive = false;

  constructor() {
    // Refresh html lang attribute
    document.documentElement.lang = this._lang;

    if (localStorage.getItem('dark_mode')) {
      this.dark_mode = localStorage.getItem('dark_mode') === "true";
    }
    else {
      // Initial init
      console.log("Autodetecting prefereed mode...");
      console.log("Dark mode on:", media_query_list.matches);
    }
    if (localStorage.getItem('can_save_other_users_archives')) {
      this.can_save_other_users_archives = localStorage.getItem('can_save_other_users_archives') === "true";
    }
    if (localStorage.getItem('has_server_errors')) {
      this.has_server_errors = localStorage.getItem('has_server_errors') === "true";
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
    if (localStorage.getItem('use_local_medias')) {
      this.use_tweets_local_medias = localStorage.getItem('use_local_medias') === 'true';
    }
    if (localStorage.getItem('use_local_videos')) {
      this._use_tweets_local_videos = localStorage.getItem('use_local_videos') === 'true';
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
    if (localStorage.getItem('show_explore_as_list')) {
      this._show_explore_as_list = localStorage.getItem('show_explore_as_list') === 'true';
    }
  }

  get show_explore_as_list() {
    return this._show_explore_as_list;
  }

  set show_explore_as_list(v: boolean) {
    localStorage.setItem('show_explore_as_list', String(v));
    this._show_explore_as_list = v;
  }

  get can_save_other_users_archives() {
    return this._can_save_other_users_archives;
  }

  set can_save_other_users_archives(v: boolean) {
    localStorage.setItem('can_save_other_users_archives', String(v));
    this._can_save_other_users_archives = v;
  }

  get use_tweets_local_medias() {
    return this._use_tweets_local_medias;
  }

  set use_tweets_local_medias(v: boolean) {
    localStorage.setItem('use_local_medias', String(v));
    this._use_tweets_local_medias = v;
  }

  get use_tweets_local_videos() {
    return this._use_tweets_local_videos;
  }

  set use_tweets_local_videos(v: boolean) {
    localStorage.setItem('use_local_videos', String(v));
    this._use_tweets_local_videos = v;
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

  get only_medias() {
    return this._media_filter === "video" || this._media_filter === "pic";
  }

  get only_videos() {
    return this._media_filter === "video";
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

  reload() {
    window.location.pathname = '/';
  }

  protected isTUserValid(u: FullUser) {
    return !!(u.created_at && u.profile_image_url_https && u.id_str && u.screen_name && u.name);
  }
}

const SETTINGS = new AESettings();

export default SETTINGS;

//// DEBUG
window.DEBUG.Settings = SETTINGS;
