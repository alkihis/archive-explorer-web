import React from 'react';
import logo from '../../logo.svg';
import Button from '@material-ui/core/Button';
import './FinalizeLogin.scss';
import { RouteComponentProps } from 'react-router';

const FinalizeLogin = (props: RouteComponentProps) => {
  return (
    <div className="FinalizeLogin">
      <header className="FinalizeLogin-header">
        <img src={logo} className="FinalizeLogin-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="FinalizeLogin-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <section>
        <Button variant="contained" color="primary">
          Hello, i'm a material button !
        </Button>
      </section>
    </div>
  );
}

export default FinalizeLogin;
