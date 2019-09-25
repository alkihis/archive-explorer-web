import React from 'react';
import Router from '../Router/Router';
import { setPageTitle } from '../../helpers';
import Toaster from '../shared/Toaster/Toaster';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core';

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

const DARK = true;
if (DARK) {
  document.body.classList.add('dark');
}
else {
  document.body.classList.remove('dark');
}

const App: React.FC = () => {
  setPageTitle();

  return (
    <ThemeProvider theme={dark_theme}>
      <Router />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
