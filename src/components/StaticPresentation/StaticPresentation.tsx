import React from 'react';
import './StaticPresentation.scss';
import { Link } from 'react-router-dom';
import { Avatar, Container, Typography, Divider } from '@material-ui/core';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import { DownloadGDPRModal } from '../shared/NoGDPR/NoGDPR';
import SETTINGS from '../../tools/Settings';

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

            <h1>Twitter Archive Explorer</h1>
          </section>

          <section>
            Explore through time, browse your old direct messages and quickly delete embarrassing tweets.
          </section>

          <section>
            {(
              SETTINGS.is_logged ?
              <Link to="/archive/" className="button-login">Explore your archive</Link> :
              <Link to="/login/" className="button-login">Login</Link>
            )}
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
                Want to explore your shared videos ?
                See your most popular posts of all times ?
                Browse through your content without seeing the retweets ?<br />

                Explore more precisly your archive by choosing a content filter : 
                Find your favorites retweets, selfies and top tweets from years ago !
              </p>
            </div>

            <img alt="Sort and filter" title="Sort tweets and filter them" src="/assets/start_page/sort.png" />
          </section>

          <section className="other-feature">
            <div>
              <h2>And even more</h2>

              <div className="container">
                <div>
                  <h5>Travel through time</h5>
                  <p>
                    Explore tweets or DMs conversations directly by year or month,
                    relive every moment spent on Twitter, no matter of how far it is.
                  </p>
                </div>

                <div>
                  <h5>Favorites deletion</h5>
                  <p>
                    You've favorited dozens of thousands of tweets, and you
                    want to make a clean sweep of your Twitter account past ?
                    Two clicks and it's done.
                  </p>
                </div>

                <div>
                  <h5>Background tasks</h5>
                  <p>
                    With a very large number of tweets, favorites or mutes, deletion may be long.
                    Without installing any program, or keeping any computer on,
                    delete with tasks started in background. 
                    You can cancel them at any time.
                  </p>
                </div>

                <div>
                  <h5>Tweets of the day</h5>
                  <p>
                    For fun or for nostalgia, find your posted tweets in the same day, the previous years.
                    You could be surprised !
                  </p>
                </div>

                <div>
                  <h5>Twitter @ history</h5>
                  <p>
                    As a old Twitter user, did you ever asked when you've changed your Twitter @ for the last time ?
                    Archive Explorer let you know every name you've used, and when you've modified it.
                  </p>
                </div>

                <div>
                  <h5>Open and private</h5>
                  <p>
                    Archive Explorer makes your privacy a priority. 
                    Not a single of your direct messages are stored in our database.
                    Twitter archive data stays in your browser.
                    Have some doubt ? Code is <a 
                      href="https://github.com/alkihis/archive-explorer-web"
                      rel="noopener noreferrer"
                      target="_blank"
                    >open-source</a>.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </Container>
      </main>

      <footer>
        <Container>
          <Divider className="divider-big-margin" />
          <Copyright />
        </Container>
      </footer>

      <DownloadGDPRModal open={open} onClose={closeModal} />
    </div>
  );
}

export default StaticPresentation;

function Copyright() {
  return (
    <div className="copyright">
      <Typography variant="body2" color="textSecondary" align="center">
        Archive Explorer is an open-source tool made by <a 
          href="https://alkihis.fr/" 
          rel="noopener noreferrer" 
          target="_blank"
        >
          Alkihis
        </a> • <a 
          href="https://twitter.com/alkihis/" 
          rel="noopener noreferrer" 
          target="_blank"
          className="twitter-link"
        >
          @Alkihis
        </a>.
      </Typography>

      <div className="github-links">
        <GithubLogo url="https://github.com/alkihis/archive-explorer-node" text="Server" />

        <GithubLogo url="https://github.com/alkihis/archive-explorer-web" text="Client" />

        <GithubLogo url="https://github.com/alkihis/twitter-archive-reader" text="Archive reader" />
      </div>
    </div>
  );
}


function GithubLogo(props: { url: string, text: string }) {
  return (
    <a rel="noopener noreferrer" target="_blank" className="github-container" href={props.url}>
      <img src="/assets/github_logo.png" alt="" className="github-img" />
      <span className="github-text">{props.text}</span>
    </a>
  );
}
