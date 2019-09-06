import React from 'react';
import Router from '../Router/Router';
import './App.scss';
import { setPageTitle } from '../../helpers';
import Toaster from '../shared/Toaster/Toaster';

const App: React.FC = () => {
  setPageTitle();

  return (
    <div className="App">
      <Router />
      <Toaster />
    </div>
  );
}

export default App;
