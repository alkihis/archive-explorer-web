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

export const AvailableLanguages = {
  fr: "Français",
  en: "English",
};

interface Locale {
  // @ts-ignore
  format: (item: string, ...replacements: any[]) => string;
  [message: string]: string; 
}

function formatLang(item: string, ...replacements: any[]) : string {
  item = LANG[item];
  const parts: string[] = [];
  let current_part = 0;

  for (let i = 0; i < item.length; i++) {
    let can_seek_closing_bracket = false;

    if (item[i] === "{") {
      if (i === 0 || item[i-1] !== "\\") {
        can_seek_closing_bracket = true;
      }
    }

    if (can_seek_closing_bracket && i + 1 < item.length && item[i+1] === "}") {
      // Take [current_part, i[, with item[i] === {
      parts.push(item.slice(current_part, i));

      // On the next match, will take AFTER the closing bracket
      current_part = i + 2;
    }
  }
  // Push the rest
  parts.push(item.slice(current_part));

  let final = "";

  for (let i = 0; i < parts.length - 1; i++) {
    final += parts[i];

    if (i in replacements) {
      const rpl = replacements[i];

      if (typeof rpl === 'string') {
        final += rpl;
      }
      else if (rpl === undefined || rpl === null) {
        // do nothing
      }
      else if ('toString' in rpl) {
        // number, symbol, object, function...
        final += rpl.toString();
      }
    }
    else {
      final += "{}";
    }
  }

  return final + parts[parts.length - 1];
}

const LANG: Locale = new Proxy(LanguageDatabase, {
  get: function(obj, prop: string) {
    if (prop in obj[SETTINGS.lang]) {
      return obj[SETTINGS.lang][prop];
    }
    // Should be in first pos, but for perf. issue we do not check every time.
    // Please do not define a property "format" in the language file !
    if (prop === "format") {
      return formatLang;
    }
    if (prop in obj.en) {
      return obj.en[prop];
    }
    return "{" + SETTINGS.lang + "." + prop + "}";
  },
  set: function() {
    throw new Error("Setting a language data is forbidden");
  },
}) as any;

export default LANG;


// -- DEBUG --
window.DEBUG.LanguageDatabase = LanguageDatabase;
window.DEBUG.Language = LANG;
// -- DEBUG --
