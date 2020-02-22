import React from 'react';
import classes from './DMContainer.module.scss';
import { LinkedDirectMessage, ConversationNameUpdate, ParticipantJoin, ParticipantLeave, JoinConversation, DirectMessageEventsContainer } from 'twitter-archive-reader';
import DM from './DM';
import Sentinel from '../../shared/Sentinel/Sentinel';
import { Divider, Fab, Tooltip } from '@material-ui/core';
import { uppercaseFirst, getMonthText } from '../../../helpers';
import JumpToIcon from '@material-ui/icons/LowPriority';
import LANG from '../../../classes/Lang/Language';
import SETTINGS from '../../../tools/Settings';
import UserCache from '../../../classes/UserCache';
import { specialJoinJSX } from '../../../tools/PlacingComponents';
import { EventEmitter } from 'events';

const LOADED_PER_CHUNK = 100;

type DMProps = {
  messages: LinkedDirectMessage[];
  from?: string;
  onDmClick?: (id: string) => void;
  hideEvents?: boolean;
};

type DMState = {
  page: LinkedDirectMessage[];
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
  position_before_render: [number, number];

  protected events = new EventEmitter();

  constructor(props: DMProps) {
    super(props);

    if (this.props.from) {
      let page = 0;

      // Découpage des pages
      const pages: LinkedDirectMessage[][] = [];
      let current = this.getPage(page);
      pages.push(current);

      while (current.length) {
        current = this.getPage(++page);
        pages.push(current);
      }

      // Search for page
      const index = pages.findIndex(msgs => msgs.findIndex(msg => msg.id === this.props.from) !== -1);

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

    

    const last_added = msgs.pop();

    if (last_added && !this.disable_scroll_for_next_load) {
      const current_vals = this.position_before_render;
      const wait_time = 5;
      
      const scroller = () => {
        if (current_vals === this.position_before_render) {
          setTimeout(scroller, wait_time + 100);
        }
        else {
          this.documentScrollToOldHeight(...this.position_before_render);
        }
      };  
      setTimeout(scroller, wait_time);
    }

    this.disable_scroll_for_next_load = false;

    this.setState({
      page: [...msgs, ...this.state.page]
    });
  };

  scrollToDm(id: string, wait_time = 5, position: ScrollLogicalPosition = "center") {
    const scroller = () => {
      const dm_top = this.dm_refs[id];

      if (dm_top) {
        let el = dm_top.current.inner_ref.current;
        if (el) {
          (el as HTMLElement).scrollIntoView({ block: position, inline: "nearest" });
        }
        else {
          setTimeout(scroller, wait_time + 100);
        }
      }
      else {
        setTimeout(scroller, wait_time + 100);
      }
    };

    setTimeout(scroller, wait_time);
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

  protected getEventContent(e: DirectMessageEventsContainer) {
    let items: React.ReactNode[] = [];
    let count = 0;

    if (e.conversationNameUpdate) {
      for (const value of e.conversationNameUpdate) {
        items.push(<React.Fragment key={count}>
          {this.formatNewConversationName(value)}
        </React.Fragment>);
        count++
      }
    }
    else if (e.joinConversation) {
      for (const value of e.joinConversation) {
        items.push(<React.Fragment key={count}>
          {this.formatConversationJoin(value)}
        </React.Fragment>);
        count++;
      }
    }
    else if (e.participantsJoin) {
      for (const value of e.participantsJoin) {
        items.push(<React.Fragment key={count}>
          {this.formatParticipantJoin(value)}
        </React.Fragment>);
        count++
      }
    }
    else if (e.participantsLeave) {
      for (const value of e.participantsLeave) {
        items.push(<React.Fragment key={count}>
          {this.formatParticipantLeave(value)}
        </React.Fragment>);
        count++;
      }
    }

    return items;
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

  get documentHeight() {
    return Math.max(
      document.documentElement["clientHeight"],
      document.body["scrollHeight"],
      document.documentElement["scrollHeight"],
      document.body["offsetHeight"],
      document.documentElement["offsetHeight"]
    );
  }

  documentScrollToOldHeight(old_scroll: number, old_height: number) {
    const current_height = this.documentHeight;
    window.scrollTo(0, old_scroll + current_height - old_height);
    setTimeout(() => {
      // workaround
      window.scrollTo(0, old_scroll + current_height - old_height);
    }, 0);
  }

  render() {
    const showed = this.state.page;

    let last_owner = "";
    let first = true;

    this.position_before_render = [
      window.scrollY,
      this.documentHeight,
    ];

    return <div className={classes.root}>
      <Sentinel onVisible={this.backPage} triggerMore={this.has_top} />

      {showed.map((e, i) => {   
        const actual = last_owner;
        last_owner = e.senderId;

        // For invisible messages, no need to recalc. Serve cache.
        if (i > 25 && (i - 25) < showed.length && e.id in this.dm_cache) {
          return this.dm_cache[e.id];
        }

        const future = showed[i+1];
        const previous = showed[i-1];
        let divider: JSX.Element = undefined;
        let show_date = false;
        // If more than one day since previous message
        if (previous && previous.createdAtDate.getTime() < e.createdAtDate.getTime() - (1000 * 60 * 60 * 24)) {
          divider = <div className={classes.divider}>
            <Divider className="divider-big-margin" />
            <div className={classes.divider_text}>
              {this.formatDividerDate(e)}
            </div>
          </div>;
        }

        let dm_content: any = undefined;

        // If more than 5 minutes since last msg or if sender ID is different 
        if (!future || e.senderId !== future.senderId || future.createdAtDate.getTime() > e.createdAtDate.getTime() + (1000 * 60 * 5)) {
          show_date = true;
        }

        const dm = <DM 
          key={e.id} 
          msg={e} 
          showPp={last_owner !== actual} 
          showDate={show_date} 
          onClick={this.props.onDmClick} 
          selected={this.props.from === e.id}
          ref={this.dm_refs[e.id] = React.createRef<DM>()}
        />;

        dm_content = (divider ? 
          <div key={"divider" + e.id}>
            {divider} {dm}
          </div> : 
          dm
        );

        let additionnal_content_begin: any = undefined;
        let additionnal_content_end: any = undefined;
        // If first message, check for previous events
        if (first) {
          first = false;
          if (!this.props.hideEvents && e.events && e.events.before) {
            additionnal_content_begin = (
              <React.Fragment>
                {this.getEventContent(e.events.before)}
              </React.Fragment>
            );
          }
        }
        
        // For all messages, check for events after message
        if (!this.props.hideEvents && e.events && e.events.after) {
          additionnal_content_end = (
            <React.Fragment>
              {this.getEventContent(e.events.after)}
            </React.Fragment>
          );
        }

        return this.dm_cache[e.id] = (
          <React.Fragment key={e.id}>
            {additionnal_content_begin}
            {dm_content}
            {additionnal_content_end}
          </React.Fragment>
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
