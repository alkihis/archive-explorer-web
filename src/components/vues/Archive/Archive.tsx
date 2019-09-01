import React from 'react';
import ReactDOM from 'react-dom';
import Button from '@material-ui/core/Button';
import styles from './Archive.module.scss';
import { setPageTitle, dateFormatter } from '../../../helpers';
import { AppBar, Toolbar, Typography, Card, CardContent, CardActions, Container, CircularProgress, Divider } from '@material-ui/core';
import { CenterComponent } from '../../../tools/PlacingComponents';
import SETTINGS from '../../../tools/Settings';
import TwitterArchive from 'twitter-archive-reader';

type ArchiveState = {
  loaded: string;
  is_error: boolean;
  in_load: string;
  loading_state: "reading" | "indexing" | "tweet_read" | "user_read" | "dm_read" | "extended_read";
};

export default class Archive extends React.Component<{}, ArchiveState> {
  state: ArchiveState;

  /** True if the component is mounted. false when unmounted (don't use setState !). */
  active = true;

  constructor(props: any) {
    super(props);

    // Initiate the state the component should have
    this.state = {
      loaded: SETTINGS.archive_name,
      loading_state: "reading",
      is_error: false,
      in_load: SETTINGS.archive_in_load
    };

    // Subscribe to archive readyness when in load
    if (this.state.in_load) {
      this.checkOnReadyArchive();
    }
  }

  // Subscribe to archive readyness
  checkOnReadyArchive() {
    SETTINGS.archive.onready = () => {
      const name = this.state.in_load;

      SETTINGS.archive_name = name;
      SETTINGS.archive_in_load = "";

      if (this.active)
        this.setState({
          loaded: name,
          in_load: ""
        });
    };

    SETTINGS.archive.onerror = () => {
      if (this.active)
        this.setState({
          is_error: true,
          in_load: ""
        });
      
      SETTINGS.archive = undefined;
      SETTINGS.archive_in_load = "";
    };

    // Subscribe for archive loading states
    SETTINGS.archive.onzipready = () => {
      if (this.active)
        this.setState({ // Skip user load (very fast)
          loading_state: "tweet_read"
        });
    };
    SETTINGS.archive.ontweetsread = () => {
      if (this.active)
        this.setState({
          loading_state: "indexing"
        });
    };
    SETTINGS.archive.onwillreaddm = () => {
      if (this.active)
        this.setState({
          loading_state: "dm_read"
        });
    };
    SETTINGS.archive.onwillreadextended = () => {
      if (this.active)
        this.setState({
          loading_state: "extended_read"
        });
    };
  }

  componentDidMount() {
    setPageTitle();
  }

  componentWillUnmount() {
    this.active = false;
  }

  // Load archive inside SETTINGS.archive
  loadArchive(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files.length) {
      const f = e.target.files[0];

      SETTINGS.archive = new TwitterArchive(f, true);

      this.setState({
        loaded: "",
        in_load: f.name,
        is_error: false,
        loading_state: "reading"
      });
      SETTINGS.archive_name = "";
      SETTINGS.archive_in_load = f.name;

      this.checkOnReadyArchive();
    }
  }

  getLoadingMessage() {
    switch (this.state.loading_state) {
      case "dm_read":
        return "Reading direct messages";
      case "extended_read":
        return "Reading favorites, moments, and other informations";
      case "indexing":
        return "Indexing tweets";
      case "reading":
        return "Unzipping";
      case "tweet_read":
        return "Reading tweets";
      case "user_read":
        return "Reading user informations";
    }
  }

  calcTruncated() {
    const l = this.state.loaded.length;
    if (l > 40) {
      const p1 = this.state.loaded.slice(0, 13);
      const p2 = this.state.loaded.slice(l - 10, l);
      
      return `${p1}...${p2}`;
    }
    return this.state.loaded;
  }

  emptyArchive() {
    return (
      <div>
        <Typography className={styles.title} variant="h5" component="h2" color="textSecondary">
          Load an archive
        </Typography>

        <Typography>
          You don't have any archive loaded. Load an archive using the "load archive" button.
        </Typography>
      </div>
    );
  }

  errorLoad() {
    return (
      <div>
        <Typography variant="h5" component="h2" className={styles.title} color="error">
          Error
        </Typography>

        <Typography>
          Archive couldn't be loaded. Please load a new archive with the required format.
        </Typography>
      </div>
    );
  }

  loaded() {
    return (
      <div>
        <Typography variant="h5" component="h2" className={styles.title}>
          <span className={styles.filename}>{this.calcTruncated()}</span> is loaded.
        </Typography>

        <Typography>
          Archive created at {
            dateFormatter("Y-m-d", new Date(SETTINGS.archive.index.archive.created_at))
          } by {SETTINGS.archive.index.info.full_name} • <span className={styles.bio}>@{SETTINGS.archive.owner_screen_name}</span>.
        </Typography>

        <Typography>
          Account #<span className={styles.bold}>{SETTINGS.archive.index.info.id}</span> created at {
            dateFormatter("Y-m-d H:i", new Date(SETTINGS.archive.index.info.created_at))
          }.
        </Typography>

        <Typography variant="h6" style={{marginTop: '.5rem'}}>
          <span className={styles.bold}>{SETTINGS.archive.length}</span> tweets
        </Typography>

        { SETTINGS.archive.is_gdpr &&
          <Typography style={{marginTop: '.3rem'}} className={styles.dmsinfowrapper}>
            <span className={styles.dmsinfo}>{SETTINGS.archive.messages.count}</span> direct messages in 
            <span className={styles.dmsinfo}> {SETTINGS.archive.messages.length}</span> conversations
          </Typography>
        }

        <Divider className="divider-margin" />

        <Typography>
          <span className={styles.bio}>{SETTINGS.archive.index.info.bio}</span>
        </Typography>
      </div>
    );
  }

  inLoad() {
    const msg = this.getLoadingMessage();
    console.log(msg);

    return (
      <div>
        <Typography variant="h5" component="h2" className={styles.title}>
          Loading...
        </Typography>
        <Typography className={styles.subtitle}>
          {msg}
        </Typography>

        <CenterComponent>
          <CircularProgress />
        </CenterComponent>
      </div>
    );  
  }

  loadButton() {
    return (
      <div className="center-space-between">
        <Button color="primary" onClick={() => (this.element.querySelector('[data-archive-input]') as HTMLElement).click()}>
          Load{this.state.loaded || this.state.is_error ? " another" : ""} archive
        </Button>
        <input type="file" data-archive-input="" onChange={(e) => this.loadArchive(e)} hidden />

        {this.state.loaded && this.buttonQuickDelete()}
      </div>
    );
  }

  buttonQuickDelete() {
    return (
      <Button color="secondary">
        Quick delete
      </Button>
    );
  }

  loadRightContent() {
    if (this.state.loaded) {
      // Chargée
      return this.loaded();
    }
    else if (this.state.in_load) {
      // En charge
      return this.inLoad();
    }
    else if (this.state.is_error) {
      // Si erreur
      return this.errorLoad();
    }
    else {
      // Aucune chargée
      return this.emptyArchive();
    }
  }
  
  render() {
    return (
      <div className={styles.root}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" color="inherit">
              Archive
            </Typography>
          </Toolbar>
        </AppBar>
  
        <Container maxWidth="sm" className={styles.center}>
          <CenterComponent>
            <Card className={styles.card}>
              <CardContent>
                {this.loadRightContent()}
              </CardContent>
              <CardActions>
                {!this.state.in_load && this.loadButton()}
              </CardActions>
            </Card>
          </CenterComponent>
        </Container>
      </div>
    );
  }

  get element() {
    return ReactDOM.findDOMNode(this) as Element;
  }
}
