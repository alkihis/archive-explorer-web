import { IUser } from "./interfaces";
import { TwitterArchive } from "twitter-archive-reader";
import { FullUser } from "twitter-d";

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

  archive_name: string = "";
  archive_in_load = "";
  expired = false;

  twitter_user: FullUser | undefined;

  constructor() {
    if (localStorage.getItem('login_token')) {
      this.token = localStorage.getItem('login_token');
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
  }

  get user() {
    return this.current_user;
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
    // DEBUG
    // return true;

    return !!this.archive && this.archive.owner === this.user.twitter_id && !this.expired;
  }

  logout(reload = true) {
    this.token = "";

    if (reload)
      this.reload();
  }

  reload() {
    window.location.pathname = '/';
  }
}

const SETTINGS = new AESettings;

export default SETTINGS;

//// DEBUG
window.DEBUG.settings = SETTINGS;
