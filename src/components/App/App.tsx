import React from 'react';
import Router from '../Router/Router';
import { setPageTitle } from '../../helpers';
import Toaster from '../shared/Toaster/Toaster';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core';
import SETTINGS from '../../tools/Settings';
import AppError from './AppError';
import NavigatorChecker from '../NavigatorChecker/NavigatorChecker';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#0078D7',
    },
  },
});

const dark_theme = createMuiTheme({
  palette: {
    primary: {
      main: '#86caff',
    },
    secondary: {
      main: '#f08ae3'
    },
    type: 'dark'
  },
  
});

class App extends React.Component<{}, { theme: any, error: any }> {
  state = {
    theme: SETTINGS.dark_mode ? dark_theme : theme,
    error: false,
  };

  constructor(props: {}) {
    super(props);

    setPageTitle();

    if (SETTINGS.dark_mode) {
      document.body.classList.add('dark');
    }
  }

  static getDerivedStateFromError(error: any) {
    return { error };
  }

  componentDidMount() {
    // @ts-ignore
    window.addEventListener('darkmodechange', this.handleToggle); 
    window.addEventListener('root.refresh', this.handleLangChange);

    // -- DEBUG --
    window.DEBUG.RootComponent = this;
    // -- DEBUG --
  }

  componentWillUnmount() {
    // @ts-ignore
    window.removeEventListener('darkmodechange', this.handleToggle);
    window.removeEventListener('root.refresh', this.handleLangChange);
  }

  componentDidCatch(err: any, info: any) {
    // Exemple de `componentStack` :
    //   in ComponentThatThrows (created by App)
    //   in ErrorBoundary (created by App)
    //   in div (created by App)
    //   in App
    console.warn("App crashed with error", err, info.componentStack);
  }

  handleToggle = (event: CustomEvent<boolean>) => {
    if (event.detail) {
      // dark mode on
      document.body.classList.add('dark');
      this.setState({ theme: dark_theme });
    }
    else {
      document.body.classList.remove('dark');
      this.setState({ theme });
    }
  };
  
  handleLangChange = () => {
    document.documentElement.lang = SETTINGS.lang;
    this.forceUpdate();
  };

  get tweet_font_for_system() {
    if (
      navigator.vendor.includes('Apple') || 
      navigator.platform.includes('Mac') || 
      navigator.userAgent.includes('iPhone OS')
    ) {
      return "font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont !important;";
    }
    return "font-family: 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', sans-serif !important;" +
      "line-height: normal;";
  }

  render() {  
    return (
      <ThemeProvider theme={this.state.theme}>
        <style>
          {`
            .tweet-font {
              ${this.tweet_font_for_system}
            }  
            .tweet-font.tweet-text {
              font-weight: 500 !important;
            }
            .tweet-font.tweet-details {
              font-weight: normal !important;
            }
            .small-title-twitter {
              ${this.tweet_font_for_system}
              font-weight: 700 !important;
              letter-spacing: .005rem !important;
            }
          `}
        </style>
        
        {this.state.error && <AppError error={this.state.error} />}
        {!this.state.error && <>
          <NavigatorChecker />
          <Router />
          <Toaster />
        </>}
      </ThemeProvider>
    );
  }
}

export default App;
