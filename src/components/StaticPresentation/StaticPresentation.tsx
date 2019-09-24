import React from 'react';
import './StaticPresentation.scss';
import { Link } from 'react-router-dom';
import { Avatar, Container } from '@material-ui/core';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import { DownloadGDPRModal } from '../shared/NoGDPR/NoGDPR';

const StaticPresentation: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  const closeModal = () => {
    setOpen(false);
  };

  const openModal = () => {
    setOpen(true);
  };

  return (
    <div className="static-page">
      <header>
        <Container>
          <section>
            <Avatar className="avatar">
              <FolderOpenIcon />
            </Avatar>
          </section>

          <section>
            <h1>Twitter Archive Explorer</h1>
          </section>

          <section>
            Explore through time, browse your old direct messages and quickly delete embarrassing tweets.
          </section>

          <section>
            <Link to="/login/" className="button-login">Login</Link>
          </section>
        </Container>
      </header>

      <main>
        <Container>
          <section>
            <h2>
              What's a Twitter Archive ?
            </h2>

            <p>
              An archive is a compilation of all your actions inside the social network. It contains all your tweets,
              direct messages, moments, favorites, blocks and many more. 
              <br />
              <a href="#!" onClick={openModal} className="dl-btn">
                Learn how to download your archive
              </a>.
            </p>
          </section>

          <section className="feature">
            <div>
              <h3>Powerful search</h3>
              <p>
                Archive Explorer let you find in seconds tweets and direct messages. 
                With a simple text field, search by word, phrase or even using regular expressions.
                All that you want is within easy reach.
              </p>
            </div>

            <img alt="Search" title="Powerful search" src="/assets/start_page/search.png" />
          </section>

          <section className="feature">
            <div>
              <h3>Clean your account</h3>
              <p>
                The 13 years old you did post embarrassing tweets you don't even remember ?
                You've used an overkill block list and you want to reverse it ?
                Archive Explorer is a tool made for clear your old tweets, by month, year or even
                with a text query. You'll also be able to delete muted and blocked users !
              </p>
            </div>

            <img alt="Tasks" title="Clean with tasks" src="/assets/start_page/task.jpg" />
          </section>

          <section className="feature">
            <div>
              <h3>Sort and filter tweets</h3>
              <p>
                Specific wishes ? Specific filters.
                <br />
                Explore more precisly your archive by choosing a content filter : Find your
                favorites retweets and selfies from years ago !

              </p>
            </div>

            <img alt="Sort and filter" title="Sort tweets and filter them" src="/assets/start_page/sort.png" />
          </section>
        </Container>
      </main>

      <DownloadGDPRModal open={open} onClose={closeModal} />
    </div>
  );
}

export default StaticPresentation;
