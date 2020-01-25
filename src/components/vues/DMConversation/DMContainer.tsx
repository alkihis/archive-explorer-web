import React from 'react';
import classes from './DMContainer.module.scss';
import { LinkedDirectMessage, ConversationNameUpdate, ParticipantJoin, ParticipantLeave, JoinConversation } from 'twitter-archive-reader';
import DM from './DM';
import Sentinel from '../../shared/Sentinel/Sentinel';
import { Divider, Fab, Tooltip } from '@material-ui/core';
import { uppercaseFirst, getMonthText } from '../../../helpers';
import JumpToIcon from '@material-ui/icons/LowPriority';
import LANG from '../../../classes/Lang/Language';
import SETTINGS from '../../../tools/Settings';
import { DMEvent } from '../../../tools/interfaces';
import UserCache from '../../../classes/UserCache';
import { specialJoinJSX } from '../../../tools/PlacingComponents';

const LOADED_PER_CHUNK = 100;

type DMProps = {
  messages: DMEvent[];
  from?: string;
  onDmClick?: (id: string) => void;
  hideEvents?: boolean;
};

type DMState = {
  page: DMEvent[];
};

export default class DMContainer extends React.Component<DMProps, DMState> {
  current_page_bottom = 0;
  current_page_top = 0;
  has_bottom = true;
  has_top = true;
  dm_cache: { [id: string]: JSX.Element } = {};
  dm_refs: { [id: string]: React.RefObject<DM> } = {};

  state: DMState;
  disable_scroll_for_next_load = false;

  constructor(props: DMProps) {
    super(props);

    if (this.props.from) {
      let page = 0;

      // Découpage des pages
      const pages: DMEvent[][] = [];
      let current = this.getPage(page);
      pages.push(current);

      while (current.length) {
        current = this.getPage(++page);
        pages.push(current);
      }

      // Search for page
      const index = pages.findIndex(msgs => msgs.findIndex(msg => {
        if (msg.messageCreate || msg.welcomeMessageCreate)
          return (msg.messageCreate || msg.welcomeMessageCreate).id === this.props.from;
        return false;
      }) !== -1);

      if (index !== -1) {
        this.current_page_bottom = this.current_page_top = index;
      }
      else {
        this.current_page_bottom = this.current_page_top = 0;
      }
    }

    this.state = {
      page: this.getPage(this.current_page_bottom)
    };
  }

  componentDidMount() {
    if (this.props.from) {
      this.scrollToDm(this.props.from, 250);
      this.disable_scroll_for_next_load = true;
    }
  }

  getPage(current: number) {
    const start = current * LOADED_PER_CHUNK;
    const end = start + LOADED_PER_CHUNK;

    return this.props.messages.slice(start, end);
  }

  scrollToSelected = () => {
    const id = this.props.from;

    if (id) {
      this.scrollToDm(id);
    }
  }

  nextPage = () => {
    this.current_page_bottom++;

    const msgs = this.getPage(this.current_page_bottom);

    if (!msgs.length) {
      this.has_bottom = false;
    }

    let next_page = [...this.state.page, ...msgs];

    this.setState({
      page: next_page
    });
  };

  backPage = () => {
    // Get the current top message
    const event_top = this.state.page.find(event => event.messageCreate || event.welcomeMessageCreate);

    const dm_top_id = (event_top.messageCreate || event_top.welcomeMessageCreate).id;
    
    this.current_page_top--;

    if (this.current_page_top < 0) {
      this.has_top = false;
      const p = this.state.page;
      this.setState({
        page: p
      });
      return;
    }

    const msgs = this.getPage(this.current_page_top);

    if (!msgs.length) {
      this.has_top = false;
    }

    this.setState({
      page: [...msgs, ...this.state.page]
    });

    if (!this.disable_scroll_for_next_load)
      this.scrollToDm(dm_top_id, 5, "start");

    this.disable_scroll_for_next_load = false;
  };

  scrollToDm(id: string, wait_time = 5, position: ScrollLogicalPosition = "center") {
    // Get element
    const dm_top = this.dm_refs[id];

    if (dm_top) {
      const el = dm_top.current.inner_ref.current;

      setTimeout(() => {
        if (el) {
          (el as HTMLElement).scrollIntoView({ block: position, inline: "nearest" });
        }
      }, wait_time);
    }
  }

  formatDividerDate(e: LinkedDirectMessage) {
    if (SETTINGS.lang === "fr") {
      return (
        <> 
          {e.createdAtDate.getDate()} {" "}
          {uppercaseFirst(getMonthText(String(e.createdAtDate.getMonth() + 1)))} {" "}
          {e.createdAtDate.getFullYear()}
        </>
      );
    }

    return (
      <> 
        {uppercaseFirst(getMonthText(String(e.createdAtDate.getMonth() + 1)))} {" "}
        {e.createdAtDate.getDate()}, {e.createdAtDate.getFullYear()}
      </>
    );
  }

  protected getPreviousOfPageFrom(i: number) {
    const showed = this.state.page;

    for (let j = i-1; j >= 0; j--) {
      const actual = showed[j];
      if (actual.messageCreate || actual.welcomeMessageCreate)
        return actual.messageCreate || actual.welcomeMessageCreate;
    }

    return undefined;
  }

  protected getFutureOfPageFrom(i: number) {
    const showed = this.state.page;

    for (let j = i+1; j < showed.length; j++) {
      const actual = showed[j];
      if (actual.messageCreate || actual.welcomeMessageCreate)
        return actual.messageCreate || actual.welcomeMessageCreate;
    }

    return undefined;
  }

  protected formatNewConversationName(event: ConversationNameUpdate) {
    const user = UserCache.getFromCache(event.initiatingUserId);
    let initiator = "#" + event.initiatingUserId;
    if (user) {
      initiator = user.name;
    }

    return (
      <div className={classes.event}>
        <div className={classes.event_text}>
          <strong>{initiator}</strong> {LANG.changes_conversation_name_to} <strong>{event.name}</strong>.
        </div>
      </div>
    );
  }

  protected formatParticipantJoin(event: ParticipantJoin) {
    const user = UserCache.getFromCache(event.initiatingUserId);
    let initiator = "#" + event.initiatingUserId;
    if (user) {
      initiator = user.name;
    }

    const invited = event.userIds.map(u => UserCache.getFromCache(u));
    let invited_names = event.userIds.map(u => "#" + u);
    for (let i = 0; i < invited.length; i++) {
      if (invited[i]) {
        invited_names[i] = invited[i].name;
      }
    }

    return (
      <div className={classes.event}>
        <div className={classes.event_text}>
          <strong>{initiator}</strong> {LANG.invited} {specialJoinJSX(invited_names, { class_element: "bold" })} 
          {" "} {LANG.to_this_conversation}.
        </div>
      </div>
    );
  }

  protected formatParticipantLeave(event: ParticipantLeave) {
    const leaved = event.userIds.map(u => UserCache.getFromCache(u));
    let leaved_names = event.userIds.map(u => "#" + u);
    for (let i = 0; i < leaved.length; i++) {
      if (leaved[i]) {
        leaved_names[i] = leaved[i].name;
      }
    }

    return (
      <div className={classes.event}>
        <div className={classes.event_text}>
          {specialJoinJSX(leaved_names, { class_element: "bold" })} {leaved_names.length > 1 ? LANG.left_plural : LANG.left}.
        </div>
      </div>
    );
  }

  protected formatConversationJoin(event: JoinConversation) {
    const user = UserCache.getFromCache(event.initiatingUserId);
    let initiator = "#" + event.initiatingUserId;
    if (user) {
      initiator = user.name;
    }

    return (
      <div className={classes.event}>
        <div className={classes.event_text}>
          <strong>{initiator}</strong> {LANG.added_you}.
        </div>
      </div>
    );
  }

  render() {
    const showed = this.state.page;

    let last_owner = "";

    return <div className={classes.root}>
      <Sentinel onVisible={this.backPage} triggerMore={this.has_top} />

      {showed.map((e, i) => {      
        if (!e.messageCreate && !e.welcomeMessageCreate) {
          if (this.props.hideEvents) {
            return "";
          }

          let content: any = "";
          if (e.conversationNameUpdate) {
            content = this.formatNewConversationName(e.conversationNameUpdate);
          }
          else if (e.joinConversation) {
            content = this.formatConversationJoin(e.joinConversation);
          }
          else if (e.participantsJoin) {
            content = this.formatParticipantJoin(e.participantsJoin);
          }
          else if (e.participantsLeave) {
            content = this.formatParticipantLeave(e.participantsLeave);
          }
          return (
            <React.Fragment key={i}>
              {content}
            </React.Fragment>
          );
        }
        
        const msg = (e.messageCreate || e.welcomeMessageCreate) as LinkedDirectMessage;
        const actual = last_owner;
        last_owner = msg.senderId;

        const future = this.getFutureOfPageFrom(i);
        const previous = this.getPreviousOfPageFrom(i);
        let divider: JSX.Element = undefined;
        let show_date = false;
        // If more than one day since previous message
        if (previous && previous.createdAtDate.getTime() < msg.createdAtDate.getTime() - (1000 * 60 * 60 * 24)) {
          divider = <div className={classes.divider}>
            <Divider className="divider-big-margin" />
            <div className={classes.divider_text}>
              {this.formatDividerDate(msg)}
            </div>
          </div>;
        }

        // For invisible messages, no need to recalc if dm should have date or dividers.
        if (i > 30 && (i - 30) < showed.length && msg.id in this.dm_cache) {
          return (divider ? 
            <div key={"divider" + msg.id}>
              {divider} {this.dm_cache[msg.id]}
            </div> : 
            this.dm_cache[msg.id]
          );
        }

        // If more than 5 minutes since last msg or if sender ID is different 
        if (!future || msg.senderId !== future.senderId || future.createdAtDate.getTime() > msg.createdAtDate.getTime() + (1000 * 60 * 5)) {
          show_date = true;
        }

        this.dm_cache[msg.id] = <DM 
          key={msg.id} 
          msg={msg} 
          showPp={last_owner !== actual} 
          showDate={show_date} 
          onClick={this.props.onDmClick} 
          selected={this.props.from === msg.id}
          ref={this.dm_refs[msg.id] = React.createRef<DM>()}
        />;

        return (divider ? 
          <div key={"divider" + msg.id}>
            {divider} {this.dm_cache[msg.id]}
          </div> : 
          this.dm_cache[msg.id]
        );
      })}

      <Sentinel onVisible={this.nextPage} triggerMore={this.has_bottom} />

      {this.props.from && <Tooltip 
        classes={{
          tooltip: classes.big_text,
          popper: classes.big_text
        }} 
        title={LANG.jump_to_message}
        placement="left"
      >
        <Fab color="primary" className={classes.fab_jump} onClick={this.scrollToSelected}>
          <JumpToIcon />
        </Fab>
      </Tooltip>}
    </div>;
  }
}
