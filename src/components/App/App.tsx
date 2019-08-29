import React from 'react';
import Router from '../Router/Router';
import './App.scss';
import { setPageTitle } from '../../helpers';

const App: React.FC = () => {
  setPageTitle();

  return (
    <div className="App">
      <Router />
    </div>
  );
}

export default App;
