import SETTINGS from "./Settings";

export class APIHelper {
    request(
        url: string, 
        parameters: { [key: string]: string } = {}, 
        method = "GET", 
        mode = "json",
        auth = true,
        headers?: any
    ) : Promise<any> {
        let fullurl = BASE_API_URL + url + (url.endsWith('.json') ? "" : ".json");

        // Build parameters
        if (Object.keys(parameters).length) {
            if (method === "GET") {
                let str = "?";
                for (const [key, value] of Object.entries(parameters)) {
                    str += key + "=" + value;
                }
                fullurl += str;
            }
            else {
                var fd = new FormData;

                for (const [key, value] of Object.entries(parameters)) {
                    fd.append(key, value);
                }
            }
        }

        if (auth) {
            if (!SETTINGS.token) {
                console.warn("Could not authentificate request without token. Skipping auth header...");
            }
            else {
                if (headers) {
                    headers['Authorization'] = "Bearer " + SETTINGS.token;
                }
                else {
                    headers = {
                        Authorization: "Bearer " + SETTINGS.token
                    };
                }
            }
        }

        return fetch(fullurl, {
            method,
            body: (fd ? fd : undefined),
            headers: headers
        })
            .then(rq => {
                if (mode === "json") {
                    return rq.ok ? rq.json() : rq.json().then(d => Promise.reject(d));
                }
                else {
                    return rq.ok ? rq.text() : rq.text().then(d => Promise.reject(d));
                }
            });
    }
}

export const BASE_API_URL = "http://localhost:3128/api/";

const APIHELPER = new APIHelper;

export default APIHELPER;
