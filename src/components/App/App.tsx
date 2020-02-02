import React from 'react';
import Router from '../Router/Router';
import { setPageTitle } from '../../helpers';
import Toaster from '../shared/Toaster/Toaster';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core';
import SETTINGS from '../../tools/Settings';
import AppError from './AppError';

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

  render() {  
    return (
      <ThemeProvider theme={this.state.theme}>
        {this.state.error && <AppError error={this.state.error} />}
        {!this.state.error && <>
          <Router />
          <Toaster />
        </>}
      </ThemeProvider>
    );
  }
}

export default App;
