import SETTINGS from "./Settings";
import { SERVER_URL } from "../const";

export class APIHelper {
  request(
    url: string,
    settings: {
      parameters?: { [key: string]: any },
      method: "GET" | "POST",
      mode?: 'json' | 'text',
      headers?: { [key: string]: string } | Headers,
      body_mode?: 'form-encoded' | 'multipart' | 'json',
      auth?: boolean
    } = { 
      method: 'GET',
      parameters: {}, 
      mode: 'json',
      body_mode: 'form-encoded',
      auth: true
    }
  ): Promise<any> {
    let fullurl = BASE_API_URL + url + (url.endsWith('.json') ? "" : ".json");

    if (!settings.parameters) {
      settings.parameters = {};
    }

    // Build parameters
    if (Object.keys(settings.parameters).length) {
      // Encodage dans la query
      if (settings.method === "GET") {
        let str = "?";
        for (const [key, value] of Object.entries(settings.parameters)) {
          str += key + "=" + value;
        }
        fullurl += str;
      }
      // Encodage POST (dans le body)
      else {
        var fd: FormData | string;
        // Si multipart (formdata)
        if (settings.body_mode && settings.body_mode === "multipart") {
          fd = new FormData;
  
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
      .then(rq => {
        if (!settings.mode || settings.mode === "json") {
          if (rq.headers.get('Content-Length') === "0") {
            return {};
          }

          return (rq.ok ? 
            rq.json() : 
            rq.json()
              .then(d => Promise.reject([rq, d]))
              .catch(e => Promise.reject([rq, e]))
          );
        }
        else {
          return rq.ok ? rq.text() : rq.text().then(d => Promise.reject([rq, d]));
        }
      });
  }
}

export const BASE_API_URL = SERVER_URL + "/api/";

const APIHELPER = new APIHelper;

export default APIHELPER;
