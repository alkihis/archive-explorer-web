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

const App: React.FC = () => {
  setPageTitle();

  return (
    <ThemeProvider theme={theme}>
      <Router />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
