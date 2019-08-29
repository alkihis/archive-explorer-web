import APIHELPER from "./tools/ApiHelper";
import { IUser } from "./tools/interfaces";
import SETTINGS from "./tools/Settings";

export const VERSION = "0.1.0";

declare global {
  interface Window {
    DEBUG: any;
  }
}

export function setPageTitle(title?: string) {
  document.title = "Archive Explorer" + (title ? ` - ${title}` : '');
}

export async function checkCredentials() {
  try {
    const reso: IUser = await APIHELPER.request('users/credentials');
    SETTINGS.user = reso;
    return !!reso.user_id;
  } catch (e) {
    return false;
  }
}
