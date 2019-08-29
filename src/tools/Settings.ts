import { IUser } from "./interfaces";

class AESettings {
  protected _token: string = "";
  protected current_user: IUser | null = null;

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
