import React from 'react';
import ReactDOM from 'react-dom';
import Button from '@material-ui/core/Button';
import styles from './Archive.module.scss';
import { setPageTitle, dateFormatter } from '../../../helpers';
import { AppBar, Toolbar, Typography, Card, CardContent, CardActions, Container, CircularProgress, Divider, Dialog } from '@material-ui/core';
import { CenterComponent } from '../../../tools/PlacingComponents';
import SETTINGS from '../../../tools/Settings';
import TwitterArchive, { ArchiveReadState, parseTwitterDate } from 'twitter-archive-reader';
import UserCache from '../../../classes/UserCache';
import { THRESHOLD_PREFETCH } from '../../../const';
import { Link } from 'react-router-dom';
import QuickDelete from '../QuickDelete/QuickDelete';
import FileUploadIcon from '@material-ui/icons/CloudUpload';
import Timer from 'timerize';
import JSZip from 'jszip';
import LANG from '../../../classes/Lang/Language';

type ArchiveState = {
  loaded: string;
  is_error: boolean | string;
  in_load: string;
  loading_state: ArchiveReadState | "prefetch" | "converting";
  quick_delete_open: boolean;
  in_drag: boolean;
};

Timer.default_format = "s";

export default class Archive extends React.Component<{}, ArchiveState> {
  state: ArchiveState;
  timer: Timer;

  /** True if the component is mounted. false when unmounted (don't use setState !). */
  active = true;

  card_ref = React.createRef<HTMLDivElement>();
  last_refresh: number = 0;

  constructor(props: any) {
    super(props);

    // Initiate the state the component should have
    this.state = {
      loaded: SETTINGS.archive_name,
      loading_state: "reading",
      is_error: false,
      in_load: SETTINGS.archive_in_load,
      quick_delete_open: false,
      in_drag: false
    };

    // Subscribe to archive readyness when in load
    if (this.state.in_load) {
      this.state.loading_state = SETTINGS.archive.state;
      this.checkOnReadyArchive();
    }
  }

  // Subscribe to archive readyness
  checkOnReadyArchive() {
    this.timer = new Timer();

    SETTINGS.archive.onready = async () => {
      const name = this.state.in_load;

      SETTINGS.archive_name = name;
      SETTINGS.archive_in_load = "";

      // Reset le statut "utilisateurs impossibles à trouver"
      UserCache.clearFailCache();

      // Récupère les personnes qui apparaissent plus de 
      // THRESHOLD_PREFETCH fois dans l'archive pour les précharger
      // (permet de voir leur PP sans DL les tweets)
      const users_in_archive: { [userId: string]: number } = {
        [SETTINGS.archive.owner]: THRESHOLD_PREFETCH
      };

      for (const t of SETTINGS.archive.all) {
        const rt = t.retweeted_status ? t.retweeted_status : t;

        if (rt.user.id_str in users_in_archive) {
          users_in_archive[rt.user.id_str]++;
        }
        else {
          users_in_archive[rt.user.id_str] = 1;
        }
      }

      // Récupère les utilisateurs apparaissant plus de THRESHOLD_PREFETCH fois
      const most_actives = Object.entries(users_in_archive)
        .filter(([_, c]) => c >= THRESHOLD_PREFETCH)
        .map(([id, ]) => id);

      const cache_dl = UserCache.prefetch(most_actives);

      // Préfetch si actif
      if (this.active) {
        this.setState({
          loading_state: "prefetch"
        });

        // Lance le DL
        try {
          await cache_dl;
        } catch (e) { }

        console.log("Archive loaded in " + this.timer.elapsed + "s");
         
        // Terminé, composant prêt !
        if (this.active)
          this.setState({
            loaded: name,
            in_load: ""
          });
      }
    };

    SETTINGS.archive.onerror = (err: CustomEvent) => {
      if (this.active)
        this.setState({
          is_error: err.detail instanceof DOMException ? "fail" : true,
          in_load: ""
        });

      try {
        console.error("Files in archive: ", Object.keys(SETTINGS.archive.raw.ls(false)));
      } catch (e) { }

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
    window.DEBUG.Archive = this;

    setTimeout(() => {
      const card = this.card_ref.current;

      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        card.addEventListener(eventName, this.handleEventPropagation, true);
      });

      ['dragenter', 'dragover'].forEach(eventName => {
        card.addEventListener(eventName, this.handleDragEnter, true);
      });
      
      ['dragleave', 'drop'].forEach(eventName => {
        card.addEventListener(eventName, this.handleDragEnd, true);
      });

      ['drop'].forEach(eventName => {
        card.addEventListener(eventName, this.handleDrop, true);
      });
    }, 200);
  }

  componentWillUnmount() {
    this.active = false;
    delete window.DEBUG.Archive;
  }

  // Load archive inside SETTINGS.archive
  loadArchive(e: React.ChangeEvent<HTMLInputElement> | File) {
    let f: File | Promise<JSZip>;

    if (e instanceof File) {
      f = e;
    }
    else if (e.target.files.length) {
      f = e.target.files[0];
    }

    if (f && f instanceof File) {
      const filename = f.name;

      SETTINGS.archive = new TwitterArchive(f, true);

      console.log("Loading a new archive: ", filename);

      this.setState({
        loaded: "",
        in_load: filename,
        is_error: false,
        loading_state: f instanceof Promise ? "converting" : "reading"
      });
      SETTINGS.archive_name = "";
      SETTINGS.archive_in_load = filename;

      this.checkOnReadyArchive();
    }
  }

  getLoadingMessage() {
    switch (this.state.loading_state) {
      case "dm_read":
        return LANG.reading_dms;
      case "extended_read":
        return LANG.reading_fav_moments_other;
      case "indexing":
        return LANG.indexing_tweets;
      case "reading":
        return LANG.unzipping;
      case "tweet_read":
        return LANG.reading_tweets;
      case "user_read":
        return LANG.reading_user_infos;
      case "prefetch":
        return LANG.gathering_user_data;
      case "converting":
        return LANG.lightening_archive;
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
          {LANG.load_an_archive}
        </Typography>

        <Typography>
          {LANG.no_archive_loaded}
          <br />
          {LANG.load_or_drag_drop}
        </Typography>
      </div>
    );
  }

  errorLoad() {
    return (
      <div>
        <Typography variant="h5" component="h2" className={styles.title} color="error">
          {LANG.error}
        </Typography>

        <Typography>
          {LANG.archive_bad_format}
        </Typography>
      </div>
    );
  }

  loaded() {
    return (
      <div>
        <Typography variant="h5" component="h2" className={styles.title}>
          <span className={styles.filename}>{this.calcTruncated()}</span> {LANG.is_loaded}.
        </Typography>

        <Typography>
          {LANG.archive_created} {!SETTINGS.archive.is_gdpr && // Hide date if gdpr (not accurate)
          <span>
            {LANG.on_date} {dateFormatter(SETTINGS.lang === "fr" ? "d/m/Y" : "Y-m-d", SETTINGS.archive.generation_date)}
          </span>} {LANG.by_date} {SETTINGS.archive.index.info.full_name} • <span className={styles.bio}>@{SETTINGS.archive.owner_screen_name}</span>.
        </Typography>

        <Typography>
          {LANG.account} #<span className={styles.bold}>{SETTINGS.archive.index.info.id}</span> {LANG.created_at} {
            dateFormatter(SETTINGS.lang === "fr" ? "d/m/Y H:i" : "Y-m-d H:i", parseTwitterDate(SETTINGS.archive.index.info.created_at))
          }.
        </Typography>

        <Typography variant="h6" style={{marginTop: '.5rem'}}>
          <span className={styles.bold}>{SETTINGS.archive.length}</span> tweets
        </Typography>

        { SETTINGS.archive.is_gdpr &&
          <Typography style={{marginTop: '.3rem'}} className={styles.dmsinfowrapper}>
            <span className={styles.dmsinfo}>{SETTINGS.archive.messages.count}</span> {LANG.direct_messages_in} 
            <span className={styles.dmsinfo}> {SETTINGS.archive.messages.length}</span> conversations
          </Typography>
        }

        <Divider className="divider-margin" />

        <Typography>
          <span className={styles.bio}>{SETTINGS.archive.index.info.bio}</span>
        </Typography>

        {!SETTINGS.is_owner && <div>
          <Divider className="divider-margin" />

          <Typography className={styles.cannot_delete}>
            {LANG.dont_own_archive}
          </Typography>
        </div>}

        {SETTINGS.is_owner && SETTINGS.expired && <div>
          <Divider className="divider-margin" />

          <Typography className={styles.cannot_delete}>
            {LANG.credentials_expired_cant_deleted} 
            {LANG.logout_and_in_in} <Link to="/settings/">{LANG.settings}</Link>.
          </Typography>
        </div>}
      </div>
    );
  }

  inLoad() {
    const msg = this.getLoadingMessage();

    return (
      <div>
        <Typography variant="h5" component="h2" className={styles.title}>
          {this.state.loading_state === "converting" ? 
            LANG.please_wait : 
            LANG.loading
          }
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
          {LANG.load}{this.state.loaded || this.state.is_error ? " " + LANG.another_f : ""} archive
        </Button>
        <input type="file" data-archive-input="" onChange={(e) => this.loadArchive(e)} hidden />

        {this.state.loaded && SETTINGS.can_delete && this.buttonQuickDelete()}
      </div>
    );
  }

  buttonQuickDelete() {
    return (
      <Button color="secondary" onClick={this.handleModalOpen}>
        {LANG.quick_delete}
      </Button>
    );
  }

  handleModalOpen = () => {
    this.setState({ quick_delete_open: true });
  }

  handleModalClose = () => {
    this.setState({ quick_delete_open: false });
  }

  modalQuickDelete() {
    return (
      <Dialog
        open={this.state.quick_delete_open}
        onClose={this.handleModalClose}
        scroll="body"
        classes={{
          paper: styles.modal_paper
        }}
      >
        {this.state.quick_delete_open ? <QuickDelete onClose={this.handleModalClose} /> : ""}
      </Dialog>
    );
  }

  dragdrop() {
    return (
      <div className={styles.dragdrop}>
        <FileUploadIcon className={styles.fu_icon} />
        <h3 className={styles.fu_text}>{LANG.drop_archive_here}</h3>
      </div>
    );
  }

  loadRightContent() {
    if (this.state.in_drag) {
      return this.dragdrop();
    }
    else if (this.state.loaded) {
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

  loadRightActions() {
    if (!this.state.in_load && !this.state.in_drag) {
      return this.loadButton();
    }
  }

  handleEventPropagation = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
  };

  handleDragEnter = (e: Event) => {
    if (this.last_refresh + 200 > Date.now()) {
      return;
    }

    console.log((e as DragEvent));

    if (!this.state.in_load && !this.state.in_drag)
      this.setState({
        in_drag: true
      });
  };

  handleDragEnd = () => {
    this.last_refresh = Date.now();

    if (!this.state.in_load && this.state.in_drag)
      this.setState({
        in_drag: false
      });
  };

  handleDrop = (e: Event) => {
    if (!this.state.in_load) {
      this.setState({
        in_drag: false
      });
  
      const files = (e as DragEvent).dataTransfer.files;
  
      if (files && files.length) {
        this.loadArchive(files[0]);
      }
    }
  };
  
  render() {
    const actions = this.loadRightActions();

    return (
      <div className={styles.root}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" color="inherit">
              Archive
            </Typography>
          </Toolbar>
        </AppBar>

        {this.modalQuickDelete()}
  
        <Container maxWidth="sm" className={styles.center}>
          <CenterComponent>
            <Card innerRef={this.card_ref} className={styles.card}>
              <CardContent>
                {this.loadRightContent()}
              </CardContent>
              {actions && <CardActions>
                {actions}
              </CardActions>}
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
