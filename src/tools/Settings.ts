import { IUser } from "./interfaces";
import { TwitterArchive } from "../classes/Archive";

class AESettings {
  protected _token: string = "";
  protected current_user: IUser | null = null;

  protected current_archive: TwitterArchive | null = null;

  constructor() {
    if (localStorage.getItem('login_token')) {
      this.token = localStorage.getItem('login_token');
    }
  }

  get token() {
    return this._token;
  }

  set token(v: string) {
    this._token = v;
    localStorage.setItem('login_token', v);
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

  logout(reload = true) {
    this.token = "";

    if (reload)
      window.location.href = window.location.protocol + window.location.host + '/';
  }
}

const SETTINGS = new AESettings;

export default SETTINGS;

//// DEBUG
window.DEBUG.settings = SETTINGS;
