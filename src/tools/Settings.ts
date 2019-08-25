class AESettings {
    protected _token: string = "";

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
}

const SETTINGS = new AESettings;

export default SETTINGS;
