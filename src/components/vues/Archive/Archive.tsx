import React from 'react';
import Button from '@material-ui/core/Button';
import styles from './Archive.module.scss';
import { setPageTitle, dateFormatter } from '../../../helpers';
import { Typography, CircularProgress, Divider, Dialog, ListItem, ListItemAvatar, Avatar, ListItemText, ListItemSecondaryAction, IconButton, List, ListSubheader, withTheme, Theme, Paper, DialogActions, DialogTitle, DialogContent, DialogContentText, Link as MUILink, FormControlLabel, Checkbox, withStyles, Container, Hidden } from '@material-ui/core';
import { CenterComponent, Marger } from '../../../tools/PlacingComponents';
import SETTINGS from '../../../tools/Settings';
import TwitterArchive, { ArchiveReadState, TwitterHelpers } from 'twitter-archive-reader';
import UserCache from '../../../classes/UserCache';
import { THRESHOLD_PREFETCH } from '../../../const';
import { Link } from 'react-router-dom';
import QuickDelete from '../QuickDelete/QuickDelete';
import FileUploadIcon from '@material-ui/icons/CloudUpload';
import Timer from 'timerize';
import JSZip from 'jszip';
import LANG from '../../../classes/Lang/Language';
import SAVED_ARCHIVES, { SavedArchiveInfo } from '../../../tools/SavedArchives/SavedArchives';
import FolderIcon from '@material-ui/icons/Folder';
import SaveIcon from '@material-ui/icons/Save';
import DeleteIcon from '@material-ui/icons/Delete';
import DeleteAllIcon from '@material-ui/icons/DeleteSweep';
import clsx from 'clsx';
import CustomTooltip from '../../shared/CustomTooltip/CustomTooltip';
import ArchiveLoadErrorDialog from './ArchiveLoadErrorDialog';
import { truncateText, loadingMessage, AvatarArchive } from './ArchiveHelpers';
import { DownloadGDPRModal } from '../../shared/NoGDPR/NoGDPR';

type ArchiveState = {
  loaded: string;
  is_error: boolean | {
    error: any,
    files: string[],
    saved: boolean,
    archive?: TwitterArchive,
  };
  in_load: string;
  loading_state: ArchiveReadState | "prefetch" | "read_save";
  quick_delete_open: boolean;
  in_drag: boolean;
  is_a_saved_archive: boolean;
  how_to_dl_open: boolean;
  header_url?: string;
};

Timer.default_format = "s";

class Archive extends React.Component<{ classes: Record<string, string> }, ArchiveState> {
  state: ArchiveState;
  timer: Timer;

  /** True if the component is mounted. false when unmounted (don't use setState !). */
  active = true;

  card_ref = React.createRef<HTMLDivElement>();
  root_ref = React.createRef<HTMLDivElement>();
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
      in_drag: false,
      is_a_saved_archive: SETTINGS.is_saved_archive,
      how_to_dl_open: false,
    };

    // Subscribe to archive readyness when in load
    if (this.state.in_load) {
      if (SETTINGS.archive) {
        this.state.loading_state = SETTINGS.archive.state;
        this.checkOnReadyArchive();
      }
      else {
        this.state.loading_state = "read_save";
      }
    }
    
    // Subscribe to saved archives events
    this.subscribeToSavedArchiveEvents();
  }

  componentDidMount() {
    setPageTitle();
    window.DEBUG.Archive = this;

    setTimeout(() => {
      const card = this.card_ref.current;
      if (card) {
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
      }
    }, 200);
  }

  componentWillUnmount() {
    this.active = false;

    if (SETTINGS.archive) {
      SETTINGS.archive.events.removeAllListeners('error');
      SETTINGS.archive.events.removeAllListeners('read');
      // Do not cancel ready, because it will properly init archive.
    }

    if (this.state.header_url) {
      URL.revokeObjectURL(this.state.header_url);
    }

    delete window.DEBUG.Archive;
  }


  /* --------------------------------------------------------------------- */
  /* ARCHIVE INITIALIZATION (subscribing to events, read parts of archive) */
  /* --------------------------------------------------------------------- */

  subscribeToSavedArchiveEvents() {
    SAVED_ARCHIVES.onload = async ({ detail }) => {
      SETTINGS.archive_name = this.state.in_load;
      SETTINGS.archive = detail;
      SETTINGS.archive_in_load = "";

      if (this.active)
        this.setState({
          is_a_saved_archive: true
        });

      await this.doArchiveInit();
    };

    SAVED_ARCHIVES.onerror = (err: CustomEvent) => {
      if (this.active)
        this.setState({
          is_error: {
            error: err.detail ? err.detail : err,
            files: [],
            saved: false
          },
          in_load: ""
        });
      
      console.error(err);
      window.DEBUG.last_archive_error = err;
      SETTINGS.archive = undefined;
      SETTINGS.archive_in_load = "";
    };
  }

  // Subscribe to archive readyness
  checkOnReadyArchive() {
    if (SETTINGS.archive) {
      SETTINGS.archive.events.removeAllListeners();
    }

    SETTINGS.is_saved_archive = false;
    this.timer = new Timer();

    SETTINGS.archive.events.on('ready', async () => {
      SETTINGS.archive_name = this.state.in_load;
      SETTINGS.archive_in_load = "";

      this.setState({
        is_a_saved_archive: false
      });

      await this.doArchiveInit();
    });

    SETTINGS.archive.events.on('error', (err: CustomEvent) => {
      console.error(err);
      window.DEBUG.last_archive_error = err;
      let files: string[] = [];
      
      try {
        // Todo show an error message
        files = Object.keys(SETTINGS.archive.raw.ls(false));
      } catch (e) { }

      if (this.active)
        this.setState({
          is_error: {
            error: err.detail ? err.detail : err,
            files,
            saved: false,
            archive: SETTINGS.archive
          },
          in_load: ""
        });

      SETTINGS.archive = undefined;
      SETTINGS.archive_in_load = "";
    });

    // Subscribe for archive loading states
    SETTINGS.archive.events.on('read', ({ step }: { step: string }) => {
      if (this.active) {
        let loading_state: ArchiveReadState | "prefetch" | "read_save";

        switch (step) {
          case "zipready":
            loading_state = "tweet_read";
            break;
          case "tweetsread":
            loading_state = "indexing";
            break;
          case "willreaddm":
            loading_state = "dm_read";
            break;
          case "willreadextended":
            loading_state = "extended_read";
            break;
          default:
            return;
        }

        this.setState({
          loading_state
        });
      }
    });

    // Fire a warning when a file could not be read
    SETTINGS.archive.events.on('archive file not found error', ({ filename }: { filename: string }) => {
      if (filename.endsWith('.js')) {
        console.warn(
          `File ${filename.split('/').pop()} could not be found. Are you sure that archive is complete ?`
        );
      }
    });
  }

  async doArchiveInit() {
    this.downloadHeaderImg();

    // Reset le statut "utilisateurs impossibles à trouver"
    UserCache.clearFailCache();

    // Récupère les personnes qui apparaissent plus de 
    // THRESHOLD_PREFETCH fois dans l'archive pour les précharger
    // (permet de voir leur PP sans DL les tweets)
    const users_in_archive: { [userId: string]: number } = {
      [SETTINGS.archive.user.id]: THRESHOLD_PREFETCH
    };

    for (const t of SETTINGS.archive.tweets) {
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

    if (this.active) {
      this.setState({
        loading_state: "prefetch"
      });
    }

    // Lance le DL
    try {
      await cache_dl;
    } catch (e) { }

    if (this.timer)
      console.log("Archive loaded in " + this.timer.elapsed + "s");
      
    // Terminé, composant prêt !
    if (this.active)
      this.setState({
        loaded: SETTINGS.archive_name,
        in_load: ""
      });
  }

  async downloadHeaderImg() {
    const archive = SETTINGS.archive;

    if (archive.medias.has_medias) {
      const header = await archive.medias.getProfileBannerOf(archive.user, false) as Blob;
  
      if (header && this.active) {
        this.setState({
          header_url: URL.createObjectURL(header),
        });
      }
    }
  }


  /* ------------------------------------------- */
  /* EVENTS TRIGGERED BY BUTTONS OR ARCHIVE LOAD */
  /* ------------------------------------------- */

  onSavedArchiveSelect = async (info: SavedArchiveInfo) => {
    this.setState({
      loaded: "",
      in_load: info.name,
      is_error: false,
      loading_state: "read_save"
    });

    SETTINGS.archive = undefined;
    SETTINGS.archive_name = "";
    SETTINGS.archive_in_load = info.name;
    SETTINGS.is_saved_archive = true;

    // Failure and success will be treated automatically via events
    SAVED_ARCHIVES.getArchive(info.uuid);
    this.timer = new Timer();
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

      try {
        SETTINGS.archive = new TwitterArchive(f);

        this.checkOnReadyArchive();
        console.log(SETTINGS.archive);
  
        console.log("Loading a new archive: ", filename);
  
        this.setState({
          loaded: "",
          in_load: filename,
          is_error: false,
          loading_state: "reading"
        });
        SETTINGS.archive_name = "";
        SETTINGS.archive_in_load = filename;      
      } catch (e) {
        console.log(e);
        this.setState({
          is_error: true
        });
      }
    }
  }


  /* ---------------- */
  /* DRAG DROP EVENTS */
  /* ---------------- */

  handleEventPropagation = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
  };

  handleDragEnter = () => {
    if (this.last_refresh + 200 > Date.now()) {
      return;
    }

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
      console.log(e, files[0]);
  
      if (files && files.length) {
        this.loadArchive(files[0]);
      }
    }
  };


  /* ------------ */
  /* QUICK DELETE */
  /* ------------ */

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


  /* ------- */
  /* GETTERS */
  /* ------- */

  get is_available_for_loading() {
    if (this.state.in_drag) {
      return false;
    }
    else if (this.state.loaded) {
      // Chargée
      return true
    }
    else if (this.state.in_load) {
      // En charge
      return false
    }
    else if (this.state.is_error) {
      // Si erreur
      return true;
    }
    else {
      // Aucune chargée
      return true;
    }
  }

  get has_archive_loaded() {
    return !!this.state.loaded;
  }


  /* -------------- */
  /* VUES - ACTIONS */
  /* -------------- */

  clickOnInput = () => {
    (this.root_ref.current.querySelector('[data-archive-input]') as HTMLElement).click();
  }

  loadRightActions() {
    if (!this.state.in_load && !this.state.in_drag) {
      return this.loadButton();
    }
  }

  loadButton() {
    return (
      <React.Fragment>
        <input type="file" data-archive-input="" onChange={(e) => this.loadArchive(e)} hidden />

        {(this.state.loaded || this.state.is_error) && 
        <div className={clsx("center-space-between", this.props.classes.actions)}>
          {this.buttonLoad()}
          {this.state.loaded && SETTINGS.can_delete && this.buttonQuickDelete()}
        </div>}
      </React.Fragment>
    );
  }

  buttonQuickDelete() {
    return (
      <Button 
        style={{ marginTop: '.5rem' }} 
        color="secondary" 
        variant="outlined" 
        onClick={this.handleModalOpen}
      >
        {LANG.quick_delete}
      </Button>
    );
  }

  buttonLoad() {
    return (
      <Button
        style={{ marginTop: '.5rem' }} 
        color="primary" 
        variant="outlined" 
        onClick={this.clickOnInput}
      >
        {LANG.load_another_archive}
      </Button>
    );
  }


  /* -------------- */
  /* VUES - CONTENT */
  /* -------------- */

  errorLoad() {
    return (
      <div className={this.props.classes.isError}>
        <Typography 
          variant="h4" 
          component="h2" 
          style={{ fontWeight: 200, letterSpacing: '-.08rem' }} 
          className={styles.title}
          color="error"
        >
          {LANG.error}
        </Typography>
        
        <Typography style={{ fontWeight: 200, fontSize: '1.2rem' }}>
          {LANG.archive_bad_format}
        </Typography>

        {typeof this.state.is_error !== 'boolean' && <ArchiveLoadErrorDialog 
          detail={this.state.is_error}
        >
          <MUILink href="#" style={{ fontSize: '1.2rem' }}>
            {LANG.omg_what_happend}
          </MUILink>
        </ArchiveLoadErrorDialog>}
      </div>
    );  
  }

  tweetDmCount() {
    const ar = SETTINGS.archive;
    const cl = this.props.classes;

    return (
      <>
        <Hidden smDown>
          <Typography>
            <span className={cl.tweetNumber}>
              {ar.tweets.length}
            </span>
            <span className={cl.tweetText}>
              {" tweets" + (ar.is_gdpr ? ", " : "")}
            </span>
            
            {ar.is_gdpr && <>
              <span className={cl.tweetNumber}>
                {ar.messages?.count ?? 0} 
              </span>
              <span className={cl.tweetText}>
                {" "}{LANG.direct_messages.toLowerCase()} 
              </span>
            </>}
          </Typography>
        </Hidden>
        <Hidden mdUp>
          <Typography>
            <span className={cl.tweetNumber}>
              {ar.tweets.length}
            </span>
            <span className={cl.tweetText}>
              {" tweets"}
            </span>
            
            {ar.is_gdpr && <>
              <br />
              <span className={cl.tweetNumber} style={{ marginTop: '-1rem', display: 'inline-block' }}>
                {ar.messages?.count ?? 0} 
              </span>
              <span className={cl.tweetText}>
                {" "}{LANG.direct_messages.toLowerCase()} 
              </span>
            </>}
          </Typography>
        </Hidden>
      </>
    );
  }

  loaded() {
    const cl = this.props.classes;

    return (
      <div className={this.props.classes.loadedArchive}>
        {/* OK ! */}
        <div className={this.props.classes.loadedAvatar}>
          <AvatarArchive />
          <span style={{ gridArea: 'na', alignSelf: 'end', fontWeight: 300, fontSize: '1.6rem' }}>
            {SETTINGS.archive.info.user.full_name}
          </span>
          <span style={{ gridArea: 'sn', alignSelf: 'start', fontWeight: 300, fontSize: '1.15rem' }}>
            @{SETTINGS.archive.user.screen_name}
          </span>
        </div>

        <Marger size=".5rem" />

        {this.tweetDmCount()}

        <Typography color="textSecondary">
          <span className={styles.bio}>{SETTINGS.archive.info.user.bio}</span>
        </Typography>


        <Marger size=".5rem" />
        <Divider />
        <Marger size=".5rem" />

        <Typography className={cl.accountSummary}>
          {LANG.twitter_account} #<span className={styles.bold}>{SETTINGS.archive.info.user.id}</span> {LANG.created_at} {
            dateFormatter(
              SETTINGS.lang === "fr" ? "d/m/Y H:i" : "Y-m-d H:i", 
              TwitterHelpers.parseTwitterDate(SETTINGS.archive.info.user.created_at)
            )
          }.
        </Typography>

        <Marger size=".15rem" />

        <Typography className={cl.fileHeader} color="textSecondary">
          {LANG.file}: <span className={cl.filename}>{truncateText(this.state.loaded)}</span>.
        </Typography>

        {!SETTINGS.is_owner && <div>
          <Marger size=".25rem" />
          <Typography className={styles.cannot_delete}>
            {LANG.dont_own_archive}
          </Typography>

          {this.state.is_a_saved_archive && <Typography color="error">
            {LANG.cant_show_dm_images}
          </Typography>}
        </div>}

        {SETTINGS.is_owner && SETTINGS.expired && <div>
          <Marger size=".20rem" />
          <Typography className={styles.cannot_delete}>
            {LANG.credentials_expired_cant_deleted} 
            {LANG.logout_and_in_in} <Link to="/settings/">{LANG.settings}</Link>.
          </Typography>
        </div>}
      </div>
    );
  }

  howToLoadMessage() {
    if (this.state.loaded) {
      // Chargée
      return "";
    }
    else if (this.state.in_load) {
      // En charge
      return "";
    }
    else if (this.state.is_error) {
      // Si erreur
      return "";
    }

    return (
      <Typography color="textSecondary" className={this.props.classes.headerText}>
        {LANG.how_to_load_p1} <MUILink 
          href="#" 
          onClick={() => this.setState({ how_to_dl_open: true })}
        >
          {" "}{LANG.follow_the_guide}
        </MUILink>.
      </Typography>
    );
  }

  emptyArchive() {
    return (
      <React.Fragment>
        <div className={styles.dragdrop_no_drop} onClick={() => this.clickOnInput()}>
          <Typography className={styles.title} variant="h5" component="h2" color="textSecondary">
            {LANG.load_an_archive}
          </Typography>

          <Typography>
            <strong>{LANG.click_here_to_load}</strong>.
            {/* {LANG.no_archive_loaded} */}
            <br />
            {/* {LANG.load_or_drag_drop} */}
            {LANG.save_or_drag_drop}
          </Typography>
        </div>
      </React.Fragment>
    );
  }

  inLoad() {
    const msg = loadingMessage(this.state.loading_state);

    return (
      <div className={this.props.classes.inLoad}>
        <Typography 
          variant="h4" 
          component="h2" 
          style={{ fontWeight: 200, letterSpacing: '-.1rem' }} 
          className={styles.title}
        >
          {LANG.loading}
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

  dragdrop() {
    const sty = this.state.loaded || this.state.is_error ? { marginTop: '1rem' } : {};

    return (
      <div className={styles.dragdrop} style={sty}>
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


  /* ------------- */
  /* VUES - RENDER */
  /* ------------- */

  render() {
    const actions = this.loadRightActions();
    const can_save_archive = this.has_archive_loaded && (
      SETTINGS.archive.user.id === SETTINGS.user.twitter_id ||
      SETTINGS.can_save_other_users_archives
    );

    const styles_of_header: any = {};
    const has_custom_img = !!(this.state.header_url || (this.state.loaded && SETTINGS.archive.user.profile_banner_url));

    if (this.state.header_url) {
      styles_of_header.backgroundImage = `url(${this.state.header_url})`;
    }
    else if (this.state.loaded && SETTINGS.archive.user.profile_banner_url) {
      styles_of_header.backgroundImage = `url(${SETTINGS.archive.user.profile_banner_url})`;
    }

    return (
      <div ref={this.root_ref} className={this.props.classes.root}>
        <div className={styles.container}>
          <header 
            data-custom-img={has_custom_img ? "true" : undefined} 
            data-loaded={this.state.loaded ? "true" : undefined} 
            className={this.props.classes.header} 
            style={styles_of_header}
          >
            <Typography variant="h2" className={this.props.classes.mainHeader}>
              Archive
            </Typography>
          </header>

          <Container className={this.props.classes.main}>
            {this.howToLoadMessage()}

            <div className={this.props.classes.archiveLoader} ref={this.card_ref}>
              {this.loadRightContent()}

              {actions}
            </div>

            <Marger size="1rem" />

            <div className={this.props.classes.savedArchives}>
              <AvailableSavedArchives 
                canSave={can_save_archive} 
                block={!this.is_available_for_loading} 
                onLoad={this.onSavedArchiveSelect} 
              />
            </div>
          </Container>
        </div>

        {this.modalQuickDelete()}
        <DownloadGDPRModal 
          open={this.state.how_to_dl_open} 
          onClose={() => this.setState({ how_to_dl_open: false })} 
        />
      </div>
    );
  }
}

export default withStyles(theme => {
  let bg_img = "";
  if (theme.palette.type === 'light') {
    bg_img = `linear-gradient(144deg, rgba(0,120,215,1) 16%, rgba(8,204,195,1) 93%)`;
  }
  else {
    bg_img = `linear-gradient(144deg, #344660 16%, #08ccc3a6 93%)`;
  }

  return {
    root: {
      flexGrow: 1,
      width: '100%',
    },
    actions: {
      [theme.breakpoints.down('xs')]: {
        flexDirection: 'column',
      },
      marginTop: '1rem',
    },
    accountSummary: {
      fontSize: '1.2rem',
    },
    fileHeader: {
      fontSize: '1.05rem',
      fontWeight: 300,
    },
    filename: {
      fontWeight: 'bold',
    },
    header: {
      backgroundImage: bg_img,
      backgroundPosition: 'bottom',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 5vw 2rem 5vw',
      boxSizing: 'border-box',
      minHeight: 150,
      transition: 'min-height 1s ease',
      transitionDelay: '150ms',
      '&[data-loaded="true"] h2': {
        opacity: 0,
      },
      '&[data-custom-img="true"]': {
        backgroundSize: "cover",
        minHeight: 280,
        [theme.breakpoints.down('sm')]: {
          minHeight: 200,
        },
        '& h2': {
          textShadow: '0 0 4px #000',
          opacity: 0,
        },
      },
    },
    main: {
      paddingTop: '.5rem',
      paddingBottom: '2rem',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    },
    mainHeader: {
      fontWeight: 200,
      color: 'white',
      fontSize: '4.5rem',
      letterSpacing: '-.2rem',
      transition: 'opacity .3s ease',
    },
    headerText: {
      fontSize: '1.3rem',
      marginTop: '1rem',
      marginBottom: '2rem',
    },
    inLoad: {
      padding: '1rem .3rem',
    },
    isError: {
      padding: '1rem .3rem',
    },
    loadedArchive: {
      marginTop: '1.2rem',
    },
    loadedAvatar: {
      display: 'grid',
      gridTemplateAreas: "\"p na\" \"p sn\"",
      gridTemplateColumns: "min-content auto",
      gridTemplateRows: '1fr 1fr',
      columnGap: '.5rem',
      marginTop: '-1.2rem',
    },
    tweetNumber: {
      fontWeight: 200,
      fontSize: '2.5rem',
    },
    tweetText: {
      fontWeight: 200,
      fontSize: '1.1rem',
      marginLeft: '-.2rem',
    },
  };
})(Archive);

/// -------------------
/// *  ARCHIVE SAVER  *
/// -------------------

type AvailableSavedArchivesProps = {
  onLoad: (archive: SavedArchiveInfo) => void;
  canSave?: boolean;
  block?: boolean;
  theme: Theme;
};
type AvailableSavedArchivesState = {
  available: SavedArchiveInfo[] | null | undefined;
  save_modal: boolean;
  quota: { used: number; available: number; quota: number; };
  delete_modal: boolean | string;
};

class AvailableSavedArchivesRaw extends React.Component<AvailableSavedArchivesProps, AvailableSavedArchivesState> {
  state: AvailableSavedArchivesState = {
    available: null,
    save_modal: false,
    delete_modal: false,
    quota: { used: 0, available: 1, quota: 0 },
  };

  mounted = false;

  componentDidMount() {
    this.mounted = true;
    this.refreshSavedArchivesList();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  onArchiveSelect = (info: SavedArchiveInfo) => {
    this.props.onLoad(info);
  };

  onArchiveDelete = (info: SavedArchiveInfo) => {
    this.setState({
      delete_modal: info.uuid
    });
  };

  onArchiveSave = () => {
    this.setState({ 
      save_modal: true 
    });
  };

  onArchiveSaveSuccess = () => {
    this.setState({
      save_modal: false
    });
    this.refreshSavedArchivesList();
  };

  onDeleteAll = () => {
    this.setState({
      delete_modal: true
    });
  };

  onDeleteSuccess = () => {
    this.setState({
      delete_modal: false
    });
    this.refreshSavedArchivesList();
  }

  refreshSavedArchivesList() {
    if (!SAVED_ARCHIVES.can_work) {
      this.setState({
        available: undefined
      });
      return;
    }

    this.setState({
      available: null
    });
    // Load the archive save list pour current user
    SAVED_ARCHIVES.getRegistredArchives()
      .then(list => this.mounted && this.setState({
        available: list
      }))
      .then(() => SAVED_ARCHIVES.usedQuota())
      .then(used => this.mounted && this.setState({
        quota: used
      }))
      .catch(e => console.error("Unable to get list of archives stored", e));
  }

  renderArchiveList() {
    const used_quota = Math.trunc(this.state.quota.used / 1024 / 1024);

    // We organize the saves
    let sorted_available = this.state.available;
    if (this.state.available.length) {
      // Split by owner: Associate screen_name => list of saves
      const sn_to_info: {[screenName: string]: SavedArchiveInfo[]} = {};
      for (const archive of this.state.available) {
        const info = SAVED_ARCHIVES.getUserInfoOf(archive);

        const lo_sn = info.screen_name.toLowerCase();
        if (lo_sn in sn_to_info) {
          sn_to_info[lo_sn].push(archive);
        }
        else {
          sn_to_info[lo_sn] = [archive];
        }
      }

      // Register logged user archive's in a special slot
      const logged_sn = SETTINGS.user.twitter_screen_name.toLowerCase();
      const archives_of_logged: [string, SavedArchiveInfo[]] = [logged_sn, []];
      if (logged_sn in sn_to_info) {
        archives_of_logged[1] = sn_to_info[logged_sn];
        delete sn_to_info[logged_sn];
      }

      // Sort the rest of users alphabetically
      const archives_owners_ordrerd = Object.entries(sn_to_info).sort((a, b) => a[0].localeCompare(b[0]));
      // Merge logged user archives and the rest, with logged user on first position
      const final_array = [archives_of_logged, ...archives_owners_ordrerd];

      // Sort each archive of each array with most recent tweet date on top
      for (const sn_archives of final_array) {
        sn_archives[1] = sn_archives[1].sort((a, b) => new Date(b.last_tweet_date).getTime() - new Date(a.last_tweet_date).getTime());
      }

      // Concat all the archives array: It is sorted !
      sorted_available = [].concat(...final_array.map(e => e[1]));
    }

    return (
      <List>
        {/* Title and buttons */}
        <ListSubheader 
          className={styles.list_archive_header} 
          style={{ backgroundColor: this.props.theme.palette.background.paper }}
        >
          <div>
            {LANG.available_saved_archives}

            {/* Available MB */}
            {this.state.quota.available !== 1 && this.state.available.length > 0 && <Typography 
              color="textSecondary"
              style={{ fontSize: '.8rem', marginTop: -15 }}
              gutterBottom
            >
              {used_quota} {LANG.megabytes_used}{used_quota > 1 ? LANG.used_with_s : ""}
            </Typography>}
          </div>
          
          {/* The save and delete button */}
          <span className={styles.list_archive_header_buttons}>
            {this.props.canSave && <CustomTooltip title={LANG.save_current_archive} placement="top">
              <IconButton style={{ marginRight: 5 }} edge="end" aria-label="save" onClick={this.onArchiveSave}>
                <SaveIcon style={{
                  color: this.props.theme.palette.primary.main
                }} />
              </IconButton>
            </CustomTooltip>}
            
            <CustomTooltip title={LANG.delete_all_archives} placement="top">
              <IconButton edge="end" aria-label="delete-all" onClick={this.onDeleteAll}>
                <DeleteAllIcon style={{
                  color: this.props.theme.palette.secondary.main
                }} />
              </IconButton>
            </CustomTooltip>
          </span>
        </ListSubheader>

        {/* Quota warning */}
        {this.state.quota.quota > 0.7 && <Typography 
          color="error" 
          component="li" 
          style={{ paddingLeft: 16, paddingRight: 16 }}
          gutterBottom
        >
          <strong>
            {LANG.quota_warning}{Math.trunc(this.state.quota.quota * 100)}%{LANG.quota_used})
          </strong>
        </Typography>}
        
        {/* All the saved archives */}
        {sorted_available.map(a => this.renderArchiveItem(a))}

        {/* Invitation to save archives */}
        {this.state.available.length === 0 && <Typography 
          variant="body1" 
          align="center" 
          color="textSecondary"
          style={{ marginBottom: 12 }}
          component="li"
        >
          {LANG.no_archive_saved}

          {this.props.canSave && <Typography variant="body2" component="span">
            <br />
            <MUILink href="#" onClick={() => this.setState({ save_modal: true })}>
              {LANG.save_current_archive} ?
            </MUILink>
          </Typography>}
        </Typography>}
      </List>
    );
  }

  renderArchiveItem(info: SavedArchiveInfo) {
    const user_info = SAVED_ARCHIVES.getUserInfoOf(info);
    let register_screen_name = `@${user_info.screen_name}`;
    let register_name = user_info.name;

    return (
      <ListItem key={info.uuid} button onClick={() => this.onArchiveSelect(info)}>
        <ListItemAvatar>
          <Avatar>
            <FolderIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={this.renderSaveText(info)}
          secondary={<Typography color="textSecondary" variant="body2">
            <strong>{register_screen_name}</strong> — {register_name}
          </Typography>}
        />
        <ListItemSecondaryAction>
          <IconButton edge="end" aria-label="delete" onClick={() => this.onArchiveDelete(info)}>
            <DeleteIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    );
  }

  renderSaveText(info: SavedArchiveInfo) {    
    const last_tweet_date = dateFormatter(
      SETTINGS.lang === "fr" ? "d/m/Y" : "Y-m-d", 
      new Date(info.last_tweet_date)
    );

    return (
      <Typography variant="body1" component="span">
        <strong>{info.tweets}</strong> tweets
        {info.dms > 0 && <span>
          , <strong>{info.dms}</strong> {LANG.dms}
        </span>} 
        <br />
        {LANG.last_tweet_on} {last_tweet_date}
      </Typography>
    );
  }

  render() {
    return (
      <Paper variant="outlined" style={{ width: '100%' }}>
        {this.props.canSave && this.state.save_modal && <ArchiveSaver 
          onClose={() => this.setState({ save_modal: false })}
          onSave={this.onArchiveSaveSuccess} 
        />}

        {this.state.delete_modal && <ArchiveDeleter 
          archive={typeof this.state.delete_modal === 'string' ? this.state.delete_modal : false}
          onClose={() => this.setState({ delete_modal: false })}
          onDelete={this.onDeleteSuccess}
        />}

        <div style={{ width: '100%' }} className={clsx(this.props.block ? styles.blocked : "", styles.smooth_opacity)}>
          {this.state.available && this.renderArchiveList()}

          {this.state.available === null && <CenterComponent style={{
            marginBottom: 15,
            marginTop: 15,
          }}>
            <CircularProgress style={{width: '48px', height: '48px'}} thickness={2} />
          </CenterComponent>}

          {this.state.available === undefined && <CenterComponent style={{
            marginBottom: 15,
            marginTop: 15,
            padding: 10,
            textAlign: 'center'
          }}>
            <Typography variant="h6" color="textSecondary">
              {LANG.cant_save_archive_on_this_device}
            </Typography>
          </CenterComponent>}
        </div>
      </Paper>
    );
  }
}

const AvailableSavedArchives = withTheme(AvailableSavedArchivesRaw);

const ArchiveSaver = (props: { onClose?: () => void, onSave?: () => void }) => {
  const [onSave, setOnSave] = React.useState<boolean | undefined>(false);

  async function handleSave() {
    setOnSave(true);

    try {
      await SAVED_ARCHIVES.registerArchive(SETTINGS.archive, SETTINGS.archive_name);
  
      if (props.onSave) {
        props.onSave();
      }
      else if (props.onClose) {
        props.onClose();
      }
    } catch (e) {
      setOnSave(undefined);
    }
  }

  function ifUserMismatch() {
    return (
      <Typography color="error">
        {LANG.user_archive_save_mismatch}
      </Typography>
    );
  }

  function onError() {
    return (
      <>
        <DialogTitle>{LANG.error}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {LANG.unable_to_save_archive}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} color="primary">
            {LANG.close}
          </Button>
        </DialogActions>
      </>
    );
  }

  function onAsk() {
    return (
      <>
        <DialogTitle>{LANG.save_current_archive} ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {LANG.save_current_archive_explaination}
          </DialogContentText>
          {SETTINGS.user.twitter_id !== SETTINGS.archive.user.id && ifUserMismatch()}
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} color="secondary">
            {LANG.cancel}
          </Button>
          <Button onClick={handleSave} color="primary" autoFocus>
            {LANG.save}
          </Button>
        </DialogActions>
      </>
    );
  }
  
  function whenSave() {
    return (
      <>
        <DialogTitle>{LANG.saving}...</DialogTitle>
        <DialogContent>
          <DialogContentText style={{ marginTop: -10 }}>
            {LANG.it_may_take_a_while}.
          </DialogContentText>

          <CenterComponent style={{ marginTop: 5, marginBottom: 20 }}>
            <CircularProgress size="56px" thickness={2} />
          </CenterComponent>
        </DialogContent>
      </>
    );
  }

  return (
    <Dialog open fullWidth onClose={onSave ? undefined : props.onClose}>
      {onSave ? whenSave() : onSave === undefined ? onError() : onAsk()}
    </Dialog>
  );
};

const ArchiveDeleter = (props: { onClose?: () => void, onDelete?: () => void, archive: string | false }) => {
  const [onDelete, setOnDelete] = React.useState<boolean | undefined>(false);
  const [removeAll, setRemoveAll] = React.useState(false);

  async function handleDelete() {
    setOnDelete(true);

    try {
      if (props.archive) {
        await SAVED_ARCHIVES.removeArchive(props.archive);
      }
      else if (removeAll) {
        // Delete all
        await SAVED_ARCHIVES.removeAllArchives();
      }
      else {
        // All archives of current user
        await SAVED_ARCHIVES.removeCurrentUser();
      }

      if (props.onDelete) {
        props.onDelete();
      }
      else if (props.onClose) {
        props.onClose();
      }
    } catch (e) {
      setOnDelete(undefined);
    }
  }

  function onError() {
    return (
      <>
        <DialogTitle>{LANG.error}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {LANG.unable_to_delete_archive}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} color="primary">
            {LANG.close}
          </Button>
        </DialogActions>
      </>
    );
  }

  function onAsk() {
    return (
      <>
        <DialogTitle>{props.archive ? LANG.remove_one_archive : LANG.remove_all_archives} ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {LANG.remove_archives_explaination}
            {!props.archive && <>
              <br /><br />
              {LANG.remove_all_archives_explaination}
            </>}
          </DialogContentText>
          
          {!props.archive && <FormControlLabel
            control={<Checkbox
              checked={removeAll} 
              onChange={(_, checked) => setRemoveAll(checked)} 
              value="remove-all" 
            />}
            label={LANG.remove_all_checkbox}
          />}

        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} color="primary" autoFocus>
            {LANG.cancel}
          </Button>
          <Button onClick={handleDelete} color="secondary">
            {LANG.remove}
          </Button>
        </DialogActions>
      </>
    );
  }
  
  function whenSave() {
    return (
      <>
        <DialogTitle>{LANG.removing}...</DialogTitle>
        <DialogContent>
          <DialogContentText style={{ marginTop: -10 }}>
            {LANG.it_may_take_a_while}.
          </DialogContentText>

          <CenterComponent style={{ marginTop: 5, marginBottom: 20 }}>
            <CircularProgress size="56px" thickness={2} />
          </CenterComponent>
        </DialogContent>
      </>
    );
  }

  return (
    <Dialog open fullWidth onClose={onDelete ? undefined : props.onClose}>
      {onDelete ? whenSave() : onDelete === undefined ? onError() : onAsk()}
    </Dialog>
  );
};
