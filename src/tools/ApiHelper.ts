import SETTINGS from "./Settings";
import { SERVER_URL } from "../const";

export class APIHelper {
  request(
    url: string,
    settings: {
      parameters?: { [key: string]: any },
      method: "GET" | "POST" | "DELETE",
      mode?: 'json' | 'text' | 'arraybuffer' | 'blob',
      headers?: { [key: string]: string } | Headers,
      body_mode?: 'form-encoded' | 'multipart' | 'json',
      auth?: boolean,
      end_with_json?: boolean,
    } = {
      method: 'GET',
      parameters: {},
      mode: 'json',
      body_mode: 'form-encoded',
      auth: true,
      end_with_json: true,
    }
  ): Promise<any> {
    let fullurl = BASE_API_URL + url + (url.endsWith('.json') ? "" : ".json");
    if (settings.end_with_json === false) {
      fullurl = BASE_API_URL + url;
    }

    if (!settings.parameters) {
      settings.parameters = {};
    }

    let fd: FormData | string;

    // Build parameters
    if (Object.keys(settings.parameters).length) {
      // Encodage dans la query
      if (settings.method === "GET" || settings.method === "DELETE") {
        let str = "?";
        for (const [key, value] of Object.entries(settings.parameters)) {
          str += key + "=" + value;
        }
        fullurl += str;
      }
      // Encodage POST (dans le body)
      else {
        // Si multipart (formdata)
        if (settings.body_mode && settings.body_mode === "multipart") {
          fd = new FormData();

          for (const [key, value] of Object.entries(settings.parameters)) {
            fd.append(key, value);
          }
        }
        // Si www-form-encoded (ou par défault)
        else if (!settings.body_mode || settings.body_mode === "form-encoded") {
          const buffer: string[] = [];

          for (const [key, value] of Object.entries(settings.parameters)) {
            buffer.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
          }

          fd = buffer.join('&');

          if (settings.headers) {
            if (settings.headers instanceof Headers)
              settings.headers.append('Content-Type', 'application/x-www-form-urlencoded');
            else
              settings.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          }
          else {
            settings.headers = {
              'Content-Type': 'application/x-www-form-urlencoded'
            };
          }
        }
        // Sinon (json)
        else {
          fd = JSON.stringify(settings.parameters);

          if (settings.headers) {
            if (settings.headers instanceof Headers)
              settings.headers.append('Content-Type', 'application/json');
            else
              settings.headers['Content-Type'] = 'application/json';
          }
          else {
            settings.headers = {
              'Content-Type': 'application/json'
            };
          }
        }
      }
    }

    if (settings.auth !== false) {
      if (!SETTINGS.token) {
        console.warn("Could not authentificate request without token. Skipping auth header...");
      }
      else {
        if (settings.headers) {
          if (settings.headers instanceof Headers)
            settings.headers.set('Authorization', "Bearer " + SETTINGS.token);
          else
            settings.headers['Authorization'] = "Bearer " + SETTINGS.token;
        }
        else {
          settings.headers = {
            Authorization: "Bearer " + SETTINGS.token
          };
        }
      }
    }

    return fetch(fullurl, {
      method: settings.method ? settings.method : "GET",
      body: (fd ? fd : undefined),
      headers: settings.headers
    })
      .then(res => {
        // If the token is due to renewal
        if (res.headers.has('X-Upgrade-Token')) {
          console.log("Token upgrade: A new JWT has been set.");
          SETTINGS.token = res.headers.get('X-Upgrade-Token');
        }

        if (!settings.mode || settings.mode === "json") {
          if (res.headers.get('Content-Length') === "0") {
            return {};
          }

          return (res.ok ?
            res.json() :
            res.json()
              .catch(e => Promise.reject([res, e]))
              .then(d => Array.isArray(d) ? Promise.reject(d) : Promise.reject([res, d]))
          );
        }
        else if (settings.mode === "text") {
          return res.ok ? res.text() : res.text().then(d => Promise.reject([res, d]));
        }
        else if (settings.mode === 'blob') {
          return res.ok ? res.blob() : res.blob().then(d => Promise.reject([res, d]));
        }
        else {
          return res.ok ? res.arrayBuffer() : res.arrayBuffer().then(d => Promise.reject([res, d]));
        }
      });
  }
}

export const BASE_API_URL = SERVER_URL + "/api/";

const APIHELPER = new APIHelper();

export default APIHELPER;

export const API_URLS = {
  task_all: 'tasks/details/all',
  task_destroy_all: 'tasks/destroy/all',
  task_destroy: 'tasks/destroy/',
  task_create: 'tasks/create',
  user_token_revoke: 'users/tokens/revoke',
  user_twitter_informations: 'users/twitter',
  user_credentials_check: 'users/credentials',
  user_delete: 'users/destroy',
  user_get_tokens: 'users/tokens/show',
  twitter_request_token: 'users/request',
  twitter_access_token: 'users/access',
  deleted_count: 'deleted_count',
  batch_tweets: 'batch/tweets',
  batch_tiny_tweets: 'batch/speed_tweets',
  batch_users: 'batch/users',
  classic_archive: 'tools/archive',
  cloud_start_upload: 'cloud/upload/start',
  cloud_send_chunk: 'cloud/upload/chunk',
  cloud_get_allowed: 'cloud/upload/allowed',
  cloud_end_upload: 'cloud/upload/terminate',
  cloud_get_uploaded: 'cloud/download/list',
  cloud_download_archive: 'cloud/download/archive',
  cloud_delete_archive: 'cloud/download/destroy',
};
