import React from 'react';
import Router from '../Router/Router';
import { setPageTitle } from '../../helpers';
import Toaster from '../shared/Toaster/Toaster';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core';
import SETTINGS from '../../tools/Settings';

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

class App extends React.Component<{}, { theme: any }> {
  state = {
    theme: SETTINGS.dark_mode ? dark_theme : theme
  };

  constructor(props: {}) {
    super(props);

    setPageTitle();

    if (SETTINGS.dark_mode) {
      document.body.classList.add('dark');
    }
  }

  componentDidMount() {
    // @ts-ignore
    window.addEventListener('darkmodechange', this.handleToggle);
  }

  componentWillUnmount() {
    // @ts-ignore
    window.removeEventListener('darkmodechange', this.handleToggle);
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

  render() {  
    return (
      <ThemeProvider theme={this.state.theme}>
        <Router />
        <Toaster />
      </ThemeProvider>
    );
  }
}

export default App;
