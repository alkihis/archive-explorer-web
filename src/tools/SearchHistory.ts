import { DEBUG_MODE } from "../const";

class SearchHistory {
  protected static readonly MAX_ELEMENTS = 5;

  constructor(protected prefix: string) {}

  get() {
    const history_raw = localStorage.getItem(this.local_storage_key);

    if (!history_raw) {
      return [];
    }
    return JSON.parse(history_raw) as string[];
  }

  getItem(pos: number) {
    return this.get()[pos];
  }

  push(search: string) {
    if (!search) {
      return;
    }
    search = search.trim();

    const history = this.get();
    let new_array: string[] = [];
    
    if (history.length >= SearchHistory.MAX_ELEMENTS) {
      const begin = (history.length + 1) - SearchHistory.MAX_ELEMENTS;

      new_array = [...history.slice(begin), search];
    }
    else {
      new_array = [...history, search];
    }

    this.set([...new Set(new_array)]);
  }

  clear() {
    this.set([]);
  }

  protected set(history: string[]) {
    localStorage.setItem(this.local_storage_key, JSON.stringify(history));
  }

  protected get local_storage_key() {
    return "__" + this.prefix + "__search_history";
  }

  *[Symbol.iterator]() {
    yield* this.get();
  }
}

export const TweetSearchHistory = new SearchHistory("tweets");
export const DMSearchHistory = new SearchHistory("dms");

if (DEBUG_MODE) {
  window.DEBUG.SearchHistories = {
    TweetSearchHistory,
    DMSearchHistory
  };
}
