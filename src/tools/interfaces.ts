import { DirectMessageEventContainer, LinkedDirectMessage } from "twitter-archive-reader";

export interface RequestTokenRequest {
  oauth_token: string;
  oauth_token_secret: string;
  url: string;
}

export interface IUser {
  oauth_token: string,
  oauth_token_secret: string,
  user_id: string,
  last_login: string,
  twitter_name: string,
  twitter_screen_name: string,
  twitter_id: string,
  profile_picture: string,
  created_at: string
}  

export interface IToken {
  user_id: string,
  token: string,
  login_ip: string,
  date: string,
  last_use: string
} 

export interface DMEvent extends DirectMessageEventContainer {
  messageCreate?: LinkedDirectMessage;
  welcomeMessageCreate?: LinkedDirectMessage;
}

export interface LogFile {
  /** The error message if any. */
  message?: string;
  /** 
   * The extract of concerned data if any. 
   * If parse error, contain a part of `FileParseError.content`.
   * If other read error, contains the stringified version of `{Error}.extract`. 
   */
  concern?: string;
  /** If error has no message, this should be the stringified error. */
  raw_error?: string;
  /** If the archive is "built", this an extract of the archive data. */
  archive_info?: {
    has_user: boolean;
    has_tweets: boolean;
    has_dms: boolean;
    state: string;
    payload: any;
    is_gdpr: boolean;
  };
  /** List of the files inside the ZIP. */
  archive_files?: string[];
  /** Stack trace of thrown error. */
  stack?: string;
  /** If error has been re-thrown, this is the original stack trace. */
  original_stack?: string;
  /** If error is `FileParseError`, this is the incrimined filename. */
  filename?: string;
  /** Type of error. Usually refers to `Object.name`. */
  type?: string;
  /** Is a saved archive. */
  saved_archive?: boolean;
  /** Informations from performance.memory, in Chrome. */
  performance?: any;
  /** Informations from navigator, if any. */
  navigator?: any;
}
