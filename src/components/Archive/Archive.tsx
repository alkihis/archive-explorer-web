import React from 'react';
import Button from '@material-ui/core/Button';
import './Archive.scss';

const Archive: React.FC = () => {
  return (
    <div className="Archive">
      <header className="Archive-header">
        <p>
          This is archive page.
        </p>
        <a
          className="Archive-link"
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

export default Archive;
