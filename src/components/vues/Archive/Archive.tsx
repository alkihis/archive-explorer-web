import React from 'react';
import ReactDOM from 'react-dom';
import Button from '@material-ui/core/Button';
import styles from './Archive.module.scss';
import { setPageTitle, dateFormatter } from '../../../helpers';
import { AppBar, Toolbar, Typography, Card, CardContent, CardActions, Container, CircularProgress, Divider, Dialog, ListItem, ListItemAvatar, Avatar, ListItemText, ListItemSecondaryAction, IconButton, List, ListSubheader, withTheme, Theme, Paper, DialogActions, DialogTitle, DialogContent, DialogContentText, Link as MUILink, FormControlLabel, Checkbox } from '@material-ui/core';
import { CenterComponent, Marger } from '../../../tools/PlacingComponents';
import SETTINGS from '../../../tools/Settings';
import TwitterArchive, { ArchiveReadState, TweetArchive } from 'twitter-archive-reader';
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
import Logger from '../../../tools/ErrorLogger';

type ArchiveState = {
  loaded: string;
  is_error: boolean | string;
  in_load: string;
  loading_state: ArchiveReadState | "prefetch" | "read_save";
  quick_delete_open: boolean;
  in_drag: boolean;
  is_a_saved_archive: boolean;
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
      in_drag: false,
      is_a_saved_archive: SETTINGS.is_saved_archive,
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

    this.checkOnReadySavedArchive();
  }

  checkOnReadySavedArchive() {
    SETTINGS.is_saved_archive = true;
    SAVED_ARCHIVES.onload = async ({ detail }) => {
      SETTINGS.archive_name = this.state.in_load;
      SETTINGS.archive = detail;
      SETTINGS.archive_in_load = "";

      this.setState({
        is_a_saved_archive: true
      });

      await this.doArchiveInit();
    };

    SAVED_ARCHIVES.onerror = (err: CustomEvent) => {
      if (this.active)
        this.setState({
          is_error: true,
          in_load: ""
        });
      
      console.error(err);
      SETTINGS.archive = undefined;
      SETTINGS.archive_in_load = "";
    };
  }

  // Subscribe to archive readyness
  checkOnReadyArchive() {
    SETTINGS.is_saved_archive = false;
    this.timer = new Timer();

    SETTINGS.archive.onready = async () => {
      SETTINGS.archive_name = this.state.in_load;
      SETTINGS.archive_in_load = "";

      this.setState({
        is_a_saved_archive: false
      });

      await this.doArchiveInit();
    };

    SETTINGS.archive.onerror = (err: CustomEvent) => {
      if (this.active)
        this.setState({
          is_error: err.detail instanceof DOMException ? "fail" : true,
          in_load: ""
        });

      try {
        console.error("Files in archive: ", Object.keys(SETTINGS.archive.raw[0].ls(false)));
        Logger.push("Error when loading archive; files:", Object.keys(SETTINGS.archive.raw[0].ls(false)));
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

  async doArchiveInit() {
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

    // Préfetch si actif
    if (this.active) {
      this.setState({
        loading_state: "prefetch"
      });

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
  }

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

    // Failure and success will be treated automatically via events
    SAVED_ARCHIVES.getArchive(info.uuid);
    this.timer = new Timer();
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

      SETTINGS.archive = new TwitterArchive(f, { load_images_in_zip: false, build_ad_archive: true });

      console.log("Loading a new archive: ", filename);

      this.setState({
        loaded: "",
        in_load: filename,
        is_error: false,
        loading_state: "reading"
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
      case "read_save":
        return LANG.reading_saved_archive;
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
          </span>} {LANG.by_date} {SETTINGS.archive.info.user.full_name} • <span className={styles.bio}>@{SETTINGS.archive.user.screen_name}</span>.
        </Typography>

        <Typography>
          {LANG.account} #<span className={styles.bold}>{SETTINGS.archive.info.user.id}</span> {LANG.created_at} {
            dateFormatter(SETTINGS.lang === "fr" ? "d/m/Y H:i" : "Y-m-d H:i", TweetArchive.parseTwitterDate(SETTINGS.archive.info.user.created_at))
          }.
        </Typography>

        <Typography variant="h6" style={{marginTop: '.5rem'}}>
          <span className={styles.bold}>{SETTINGS.archive.tweets.length}</span> tweets
        </Typography>

        { SETTINGS.archive.is_gdpr &&
          <Typography style={{marginTop: '.3rem'}} className={styles.dmsinfowrapper}>
            <span className={styles.dmsinfo}>{SETTINGS.archive.messages.count}</span> {LANG.direct_messages_in} 
            <span className={styles.dmsinfo}> {SETTINGS.archive.messages.length}</span> conversations
          </Typography>
        }

        <Divider className="divider-margin" />

        <Typography>
          <span className={styles.bio}>{SETTINGS.archive.info.user.bio}</span>
        </Typography>

        {!SETTINGS.is_owner && <div>
          <Divider className="divider-margin" />

          <Typography className={styles.cannot_delete}>
            {LANG.dont_own_archive}
          </Typography>

          {this.state.is_a_saved_archive && <Typography color="error">
            {LANG.cant_show_dm_images}
          </Typography>}
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
  
      if (files && files.length) {
        this.loadArchive(files[0]);
      }
    }
  };

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
  
  render() {
    const actions = this.loadRightActions();
    const can_save_archive = this.has_archive_loaded && (
      SETTINGS.archive.user.id === SETTINGS.user.twitter_id ||
      SETTINGS.can_save_other_users_archives
    );

    return (
      <div className={styles.root}>
        <AppBar position="relative">
          <Toolbar>
            <Typography variant="h6" color="inherit">
              Archive
            </Typography>
          </Toolbar>
        </AppBar>

        {this.modalQuickDelete()}
  
        <Container maxWidth="sm" className={styles.container}>
          <Card innerRef={this.card_ref} className={styles.card}>
            <CardContent>
              {this.loadRightContent()}
            </CardContent>
            {actions && <CardActions>
              {actions}
            </CardActions>}
          </Card>

          <Marger size=".5rem" />
          
          <AvailableSavedArchives 
            canSave={can_save_archive} 
            block={!this.is_available_for_loading} 
            onLoad={this.onSavedArchiveSelect} 
          />
        </Container>
      </div>
    );
  }

  get element() {
    return ReactDOM.findDOMNode(this) as Element;
  }
}


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
