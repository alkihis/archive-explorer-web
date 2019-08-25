import React from 'react';
import './About.scss';

const About: React.FC = () => {
  return (
    <div className="About">
      <header className="About-header">
        <p>
          About this page
        </p>
        <a
          className="About-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default About;
