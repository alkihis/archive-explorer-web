import React from 'react';
import logo from '../../logo.svg';
import Button from '@material-ui/core/Button';
import './Home.scss';

const Home: React.FC = () => {
  return (
    <div className="Home">
      <header className="Home-header">
        <img src={logo} className="Home-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="Home-link"
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

export default Home;
