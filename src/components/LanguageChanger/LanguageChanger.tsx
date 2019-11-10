import React from 'react';
import { RouteComponentProps, Redirect } from 'react-router-dom';
import { isAuthorizedLang } from '../../classes/Lang/Language';
import SETTINGS from '../../tools/Settings';

export default class LanguageChanger extends React.Component<RouteComponentProps> {
  protected url: string;

  constructor(props: RouteComponentProps) {
    super(props);

    const [, lang, ...rest] = props.location.pathname.split('/');
    if (lang && isAuthorizedLang(lang)) {
      if (lang !== SETTINGS.lang) {
        SETTINGS.lang = lang;
      }
    }
    
    this.url = "/" + rest.join('/');
  }

  render() {
    return <Redirect to={this.url} />;
  }
}
