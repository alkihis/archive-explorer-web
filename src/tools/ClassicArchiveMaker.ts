import APIHELPER, { API_URLS } from "./ApiHelper";
import SETTINGS from "./Settings";
import JSZip from 'jszip';

const ARCHIVE_URL = API_URLS.classic_archive;

export default new class ClassicArchiveMaker {
  async make() {
    if (!SETTINGS.archive) {
      throw new Error("You need to load an archive first.");
    }

    const archive_as_ab: ArrayBuffer = await APIHELPER.request(ARCHIVE_URL, { mode: 'arraybuffer', method: 'GET' });

    const created = await JSZip.loadAsync(archive_as_ab);

    // complete archive...
  }
}();
