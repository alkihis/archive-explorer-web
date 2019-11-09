import SETTINGS from "../../tools/Settings";
import FRENCH from './fr';
import ENGLISH from './en';

const LanguageDatabase = {
  fr: FRENCH,
  en: ENGLISH,
};

export type AuthorizedLangs = keyof typeof LanguageDatabase;
export function isAuthorizedLang(lang: string) : lang is AuthorizedLangs {
  return lang in LanguageDatabase;
}

interface Locale {
  [message: string]: string | undefined; 
}

const LANG: Locale = new Proxy(LanguageDatabase, {
  get: function(obj, prop: string) {
    if (prop in obj[SETTINGS.lang]) {
      return obj[SETTINGS.lang][prop];
    }
    if (prop in obj.en) {
      return obj.en[prop];
    }
    return undefined;
  },
  set: function() {
    throw new Error("Setting a language data is forbidden");
  },
}) as any;

export default LANG;
