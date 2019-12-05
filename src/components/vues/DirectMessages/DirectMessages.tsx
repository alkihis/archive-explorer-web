import React from 'react';
import classes from './DirectMessages.module.scss';
import { setPageTitle, isArchiveLoaded, specialJoin } from '../../../helpers';
import MailIcon from '@material-ui/icons/Mail';
import SETTINGS from '../../../tools/Settings';
import NoArchive from '../../shared/NoArchive/NoArchive';
import NoGDPR from '../../shared/NoGDPR/NoGDPR';
import { Conversation } from 'twitter-archive-reader';
import DMConversation from '../DMConversation/DMConversation';
import { Toolbar, AppBar, Typography, Container, Card, CardContent, Avatar, Tabs, Tab } from '@material-ui/core';
import UserCache from '../../../classes/UserCache';
import { CenterComponent, BigPreloader, specialJoinJSX } from '../../../tools/PlacingComponents';
import EmptyMessage from '../../shared/EmptyMessage/EmptyMessage';
import MailOutlineIcon from '@material-ui/icons/MailOutline';
import { FullUser } from 'twitter-d';
import LANG from '../../../classes/Lang/Language';

type DMProps = {};

type DMState = {
  /** Selected conversation */
  conversation: Conversation | null;

  /** Wait for user download */
  ready: boolean | null;

  /** Tab for group/non group */
  active_tab: number;
};

export default class DirectMessages extends React.Component<DMProps, DMState> {
  state: DMState = {
    conversation: null,
    ready: null,
    active_tab: 0,
  };

  protected in_dl = false;

  protected position: number = 0;
  protected should_scroll = false;

  componentDidMount() {
    if (isArchiveLoaded() && SETTINGS.archive.is_gdpr) {
       // Chargement des médias de l'archive si nécessaire
      if (SETTINGS.archive.requiresDmImageZipLoad()) {
        SETTINGS.archive.loadCurrentDmImageZip()
          .then(() => {
            this.setState({
              ready: false
            });
            
            this.downloadUsers();
          });
      }
      else {
        this.setState({
          ready: false
        });

        this.downloadUsers();
      }
    }

    setPageTitle(LANG.direct_messages);
  }

  componentDidUpdate(_: DMProps, old_state: DMState) {
    if (old_state.ready === null) {
      return;
    }

    if (this.should_scroll) {
      this.should_scroll = false;
      window.scrollTo(0, this.position);
    }
    // Si c'est pas OK, que l'archive est chargée et valide, et qu'on est pas en téléchargement
    else if (!this.state.ready && isArchiveLoaded() && SETTINGS.archive.is_gdpr && !this.in_dl) {
      this.downloadUsers();
    }
  }

  downloadUsers() {
    this.in_dl = true;
    const participants = new Set<string>();

    for (const conv of SETTINGS.archive.messages.all) {
      for (const p of conv.participants) {
        participants.add(p);
      }
    }

    UserCache.bulk([...participants])
      .finally(() => {
        this.setState({
          ready: true
        });

        this.in_dl = false;
      });
  }

  handleRemoveConversation = () => {
    this.should_scroll = true;
    this.setState({ conversation: null });
  };

  handleGetConv = (conv: Conversation) => {
    this.setState({
      conversation: conv
    });

    this.position = window.scrollY;
    this.should_scroll = false;
  };

  renderConversation(conv: Conversation) {
    const participants = [...conv.real_participants].map(e => {
      const cached = UserCache.getFromCache(e);

      if (cached) {
        return cached;
      }
      return e;
    });

    const oncardclick = () => this.handleGetConv(conv);

    if (participants.length === 1) {
      let avatar: JSX.Element;
      const p = participants[0];

      if (typeof p !== 'string') {
        avatar = <Avatar 
          className={classes.avatar}
          src={(p as FullUser).profile_image_url_https.replace('_normal', '')}
        />;
      }
      else {
        avatar = <Avatar className={classes.avatar}>#</Avatar>;
      }

      const name = typeof p === "string" ? "#" + p : p.name;
      const s_name = typeof p === "string" ? "" : "@" + p.screen_name;

      return (
        <Card key={conv.id} className={classes.card_root} onClick={oncardclick}>
          <CardContent className={classes.card_single}>
            <div className={classes.avatar_holder}>
              {avatar}

              <div className={classes.conv_name}>{name}</div>
              <div className={classes.conv_screen_name}>{s_name}</div>
            </div>

            <div className={classes.messages_number}>
              <span className="bold">{conv.length}</span> message{conv.length > 1 ? "s" : ""}
            </div>
          </CardContent>
        </Card>
      );
    }

    const s_n = specialJoinJSX(participants.map(e => typeof e === 'string' ? "#" + e : '@' + e.screen_name), { class_element: "bold" });
    const names = specialJoinJSX(participants.map(e => typeof e === 'string' ? "#" + e : e.name));

    return (
      <Card key={conv.id} className={classes.card_root} onClick={oncardclick}>
        <CardContent>
          <div className={classes.group_conv_container}>
            <div className={classes.group_conv}><span className="no-bold">{LANG.conversation_with}</span> {names}</div>
            <div className={classes.group_conv_screen_name}>{s_n}</div>
          </div>

          <div className={classes.messages_number}>
            <span className="bold">{conv.length}</span> message{conv.length > 1 ? "s" : ""}
          </div>
        </CardContent>
      </Card>
    );
  }

  changeActiveTab = (_: any, index: number) => {
    this.setState({
      active_tab: index
    });
  }

  renderConversations() {
    const messages = SETTINGS.archive.messages;
    const sort_fn = (a: Conversation, b: Conversation) => b.length - a.length;

    if (messages.all.length === 0) {
      return <EmptyMessage 
        main="No conversations" 
        second="You must have at least one conversation to explore your DMs." 
        icon={MailOutlineIcon}
      />;
    }

    const groups = messages.groups.sort(sort_fn);
    const singles = messages.directs.sort(sort_fn);

    return (
      <div>
        <AppBar position="static" className={classes.tabs}>
          <Tabs value={this.state.active_tab} onChange={this.changeActiveTab} centered>
            <Tab label="Conversations" disabled={singles.length === 0} />
            <Tab label={LANG.group_conversations} disabled={groups.length === 0} />
          </Tabs>
        </AppBar>

        <Container className={classes.root}>
          {this.state.active_tab === 0 && <div>
            <Typography className={classes.conv_title} variant="h6"> 
              Conversations
            </Typography>

            <div className={classes.conv_container}>
              {singles.map(e => this.renderConversation(e))}
            </div>
          </div>}

          {this.state.active_tab === 1 && <div>
            <Typography className={classes.conv_title} variant="h6"> 
              {LANG.group_conversations}
            </Typography>

            <div className={classes.conv_container}>
              {groups.map(e => this.renderConversation(e))}
            </div>
          </div>}
        </Container>        
      </div>
    );
  }

  get participants() {
    const names = [...this.state.conversation.real_participants]
      .map(e => {
        const user = UserCache.getFromCache(e);
        return user ? user.name : '#' + e;
      });

    return specialJoin(names);
  }

  render() {
    if (!isArchiveLoaded()) {
      return <NoArchive />;
    }

    if (!SETTINGS.archive.is_gdpr) {
      return <NoGDPR 
        icon={MailIcon} 
        message={LANG.archive_no_dms} 
      />;
    }

    if (this.state.ready && this.state.conversation) {
      return (
        <DMConversation 
          getBack={this.handleRemoveConversation} 
          conversation={this.state.conversation} 
        />
      );
    }

    return (
      <div>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" noWrap>
              {LANG.direct_messages}
            </Typography>
          </Toolbar>
        </AppBar>
          {!this.state.ready && <Container className={classes.root}>
            <CenterComponent className={classes.preloader}>
              <BigPreloader />

              <div className={classes.preloader_msg}>
                {this.state.ready === null ? LANG.reading_dm_img : LANG.downloading_users}
              </div>
            </CenterComponent>
          </Container> }

          {this.state.ready && this.renderConversations()}
      </div>
    );
  }
}
