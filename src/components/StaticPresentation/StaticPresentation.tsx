import React from 'react';
import './StaticPresentation.scss';
import { Link } from 'react-router-dom';
import { Container } from '@material-ui/core';
import { DownloadGDPRModal } from '../shared/NoGDPR/NoGDPR';
import { setPageTitle, nFormat } from '../../helpers';
import LANG from '../../classes/Lang/Language';
import { Copyright } from '../../tools/PlacingComponents';

const StaticPresentation: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  setPageTitle("Twitter Archive Explorer")

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
            <h1 className="tweet-font">Twitter Archive Explorer</h1>

            <div className="small-blue-divider" />
          </section>

          <section>
            {LANG.catch_phrase}
          </section>

          <section>
            <Link to="/archive/" className="button-login">{LANG.explore_archive}</Link>
          </section>
        </Container>
      </header>

      <main>
        <section>
          <Container>
            <h2 className="tweet-font">
              {LANG.whats_a_archive} ?
            </h2>

            <p>
              {LANG.whats_a_archive_p1}
              <br />
              <a href="#!" onClick={openModal} className="dl-btn">
                {LANG.how_to_download}
              </a>.
            </p>
          </Container>
        </section>

        <Container>
          <section className="feature">
            <div>
              <h3 className="tweet-font">
                <span role="img" aria-label="spark">⚡</span>
                {" "}{LANG.blazing_fast_loading}
              </h3>

              <div className="small-classic-divider" />

              <p>
                {LANG.blazing_fast_loading_p1}
                <br />
                {LANG.blazing_fast_loading_p2}
              </p>
            </div>

            <img alt={LANG.blazing_fast_loading} title={LANG.blazing_fast_loading} src="/assets/start_page/archive_home.jpg" />
          </section>

          <section className="feature">
            <div>
              <h3 className="tweet-font">
                <span role="img" aria-label="Magnifying glass">🔍</span>
                {" "}{LANG.powerful_search}
              </h3>

              <div className="small-classic-divider" />

              <p>
                {LANG.powerful_search_p1}
              </p>
            </div>

            <img alt="Search" title={LANG.powerful_search} src="/assets/start_page/search.png" />
          </section>

          <section className="feature">
            <div>
              <h3 className="tweet-font">
                <span role="img" aria-label="target">🎯</span>
                {" "}{LANG.intelligent_targeting}
              </h3>

              <div className="small-classic-divider" />

              <p>
                {LANG.intelligent_targeting_p1}
                <br />
                {LANG.intelligent_targeting_p2}
              </p>
            </div>

            <img alt={LANG.intelligent_targeting} title={LANG.intelligent_targeting} src="/assets/start_page/search_target.png" />
          </section>

          <section className="feature">
            <div>
              <h3 className="tweet-font">
                <span role="img" aria-label="broom">🧹</span>
                {" "}{LANG.clean_your_account}
              </h3>

              <div className="small-classic-divider" />

              <p>
                {LANG.clean_your_account_p1} <strong><DeletedCounter /></strong> {LANG.tweets} !
              </p>
            </div>

            <img alt="Tasks" title={LANG.clean_your_account} src="/assets/start_page/task.jpg" />
          </section>

          <section className="feature">
            <div>
              <h3 className="tweet-font">
                <span role="img" aria-label="random">🔀</span>
                {" "}{LANG.sort_and_filter_tweets}
              </h3>

              <div className="small-classic-divider" />

              <p>
                {LANG.specific_wishes}
                <br />
                {LANG.explore_sort_p1}
                <br />
                {LANG.explore_sort_p2}
              </p>
            </div>

            <img alt={LANG.sort_and_filter_tweets} title={LANG.sort_and_filter_tweets} src="/assets/start_page/sort.png" />
          </section>

          <section className="feature">
            <div>
              <h3 className="tweet-font">
                <span role="img" aria-label="star">🌟</span>
                {" "}{LANG.find_your_favorites_favorites}
              </h3>

              <div className="small-classic-divider" />

              <p>
                {LANG.find_favorites_p1}
                <br />
                {LANG.find_favorites_p2}
              </p>
            </div>

            <img alt={LANG.find_your_favorites_favorites} title={LANG.find_your_favorites_favorites} src="/assets/start_page/favorites.png" />
          </section>

          <section className="other-feature">
            <div>
              <h2>{LANG.even_more}</h2>

              <div className="container">
                <div>
                  <h5>{LANG.travel_through_time}</h5>
                  <p>
                    {LANG.travel_through_time_p1}
                  </p>
                </div>

                <div>
                  <h5>{LANG.most_mentionned_per_month}</h5>
                  <p>
                    {LANG.most_mentionned_per_month_p1}
                  </p>
                </div>

                <div>
                  <h5>{LANG.background_tasks}</h5>
                  <p>
                    {LANG.background_tasks_p1}
                  </p>
                </div>

                <div>
                  <h5>{LANG.tweets_of_the_day}</h5>
                  <p>
                    {LANG.tweets_of_the_day_p1}
                  </p>
                </div>

                <div>
                  <h5>{LANG.twitter_at_history}</h5>
                  <p>
                    {LANG.twitter_at_history_p1}
                  </p>
                </div>

                <div>
                  <h5>{LANG.open_and_private}</h5>
                  <p>
                    {LANG.open_and_private_p1} <a
                      href="https://github.com/alkihis/archive-explorer-web"
                      rel="noopener noreferrer"
                      target="_blank"
                    >{LANG.open_source}</a>.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </Container>
      </main>

      <footer>
        <Container>
          <Copyright />
        </Container>
      </footer>

      <DownloadGDPRModal open={open} onClose={closeModal} />
    </div>
  );
}

export default StaticPresentation;

type DCProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;

const DeletedCounter: React.FC<DCProps> = (props: DCProps) => {
  const [deleted, ] = React.useState<number>(undefined);
  //TODO?
  return (
    <span {...props}>
      {deleted !== undefined ? nFormat(deleted) : "•••"}
    </span>
  );
};
