import React from 'react';
import Button from '@material-ui/core/Button';
import './NotFound.scss';
import { RouteComponentProps } from 'react-router';

const Login = (props: RouteComponentProps) => {
  return (
    <div className="NotFound">
      <header className="NotFound-header">
        <p>
          Here's not found page.
        </p>
        <p>
          You tried to show <code>{props.location.pathname}</code>, but it does not exists.
        </p>
        <a
          className="NotFound-link"
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

export default Login;
