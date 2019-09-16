import React from 'react';
import ReactDOM from 'react-dom';
import classes from './DMContainer.module.scss';
import { LinkedDirectMessage } from 'twitter-archive-reader';
import DM from './DM';
import Sentinel from '../../shared/Sentinel/Sentinel';
import { Divider } from '@material-ui/core';
import { uppercaseFirst, getMonthText } from '../../../helpers';

const LOADED_PER_CHUNK = 100;

type DMProps = {
  messages: LinkedDirectMessage[];
  from?: string;
  onDmClick?: (id: string) => void;
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

  constructor(props: DMProps) {
    super(props);

    if (this.props.from) {
      let i = 0;
      let page = 0;
  
      for (const msg of this.props.messages) {
        if (i > LOADED_PER_CHUNK) {
          page++;
          i = 0;
        }
  
        if (msg.id === this.props.from) {
          this.current_page_bottom = this.current_page_top = page;
          break;
        }
  
        i++;
      }
    }

    this.state = {
      page: this.getPage(this.current_page_bottom)
    };
  }

  componentDidMount() {
    if (this.props.from) {
      this.scrollToDm(this.props.from);
    }
  }

  getPage(current: number) {
    const start = current * LOADED_PER_CHUNK;
    const end = start + LOADED_PER_CHUNK;

    return this.props.messages.slice(start, end);
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
    const dm_top_id = this.state.page[0].id;
    
    
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

    this.scrollToDm(dm_top_id);
  };

  scrollToDm(id: string) {
    // Get element
    const dm_top = this.dm_refs[id];

    if (dm_top) {
      const el = ReactDOM.findDOMNode(dm_top.current);

      setTimeout(() => {
        if (el) {
          (el as HTMLElement).scrollIntoView({ block: "center", inline: "nearest" });
        }
      }, 5);
    }
  }

  render() {
    const showed = this.state.page;

    let last_owner = "";

    return <div className={classes.root}>
      <Sentinel onVisible={this.backPage} triggerMore={this.has_top} />

      {showed.map((e, i) => {        
        const actual = last_owner;
        last_owner = e.senderId;

        const future = showed[i + 1];
        const previous = showed[i - 1];
        let divider: JSX.Element = undefined;
        let show_date = false;
        // Si ça fait plus de 1 jour depuis le message précédent
        if (previous && previous.createdAtDate.getTime() < e.createdAtDate.getTime() - (1000 * 60 * 60 * 24)) {
          divider = <div className={classes.divider}>
            <Divider className="divider-big-margin" />
            <div className={classes.divider_text}>
              {
                uppercaseFirst(getMonthText(String(e.createdAtDate.getMonth() + 1)))
              } {e.createdAtDate.getDate()}, {e.createdAtDate.getFullYear()}
            </div>
          </div>;
        }

        // Cache uniquement les messages techniquement non visibles
        if (i > 30 && (i - 30) < showed.length && e.id in this.dm_cache) {
          return (divider ? 
            <div key={"divider" + e.id}>
              {divider} {this.dm_cache[e.id]}
            </div> : 
            this.dm_cache[e.id]
          );
        }

        // Si ça fait plus de 5 minutes ou si on change de pertsonne
        if (!future || e.senderId !== future.senderId || future.createdAtDate.getTime() > e.createdAtDate.getTime() + (1000 * 60 * 5)) {
          show_date = true;
        }

        this.dm_cache[e.id] = <DM 
          key={e.id} 
          msg={e} 
          showPp={last_owner !== actual} 
          showDate={show_date} 
          onClick={this.props.onDmClick} 
          selected={this.props.from === e.id}
          ref={this.dm_refs[e.id] = React.createRef<DM>()}
        />;

        return (divider ? 
          <div key={"divider" + e.id}>
            {divider} {this.dm_cache[e.id]}
          </div> : 
          this.dm_cache[e.id]
        );
      })}

      <Sentinel onVisible={this.nextPage} triggerMore={this.has_bottom} />
    </div>;
  }
}
