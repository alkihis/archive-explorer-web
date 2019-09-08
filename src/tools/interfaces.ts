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
