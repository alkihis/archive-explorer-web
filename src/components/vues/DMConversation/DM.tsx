import classes from './DM.module.scss';
import React from 'react';
import { LinkedDirectMessage } from 'twitter-archive-reader';
import SETTINGS from '../../../tools/Settings';
import { Avatar } from '@material-ui/core';
import UserCache from '../../../classes/UserCache';
import { dateFormatter } from '../../../helpers';
import { REGEX_URL } from '../../../const';
// @ts-ignore
import { Lightbox as ModalImage } from "react-modal-image";
import LANG from '../../../classes/Lang/Language';
import { BASE_API_URL } from '../../../tools/ApiHelper';

type DMProp = {
  msg: LinkedDirectMessage;
  showPp?: boolean;
  showDate?: boolean;
  onClick?: (id: string) => void;
  selected?: boolean;
}

type DMState = {
  img: string;
  img_full: boolean;
};

export default class DM extends React.Component<DMProp, DMState> {
  registered_urls: {[url: string]: string} = {};
  inner_ref = React.createRef<HTMLDivElement>()

  state: DMState = {
    img: null,
    img_full: false
  };

  renderModal() {
    const used_entity = this.state.img;

    // With modal image
    return (
      <ModalImage 
        medium={used_entity}
        large={used_entity}
        alt={LANG.full_image}
        onClose={() => this.setState({ img_full: null })}
      />
    );
  }

  get is_you() {
    return this.props.msg.senderId === SETTINGS.archive.user.id;
  }

  get dm() {
    return this.props.msg;
  }

  get is_group() {
    return !this.dm.recipientId || this.dm.recipientId === "0";
  }

  renderText(text: string) {
    const splitted = text.split(REGEX_URL).filter(e => !e.match(REGEX_URL));
    const urls: string[] = [];
    const regex = new RegExp(REGEX_URL);
    
    let matches: RegExpExecArray;

    // eslint-disable-next-line
    while (matches = regex.exec(text)) {
      urls.push(matches[0]);
    }

    // Assemblage
    let i = 0;
    const parts: JSX.Element[] = [];
    while (i < splitted.length) {
      parts.push(
        <span key={String(i) + "-0"}>
          {splitted[i]}
        </span>
      );

      if (i in urls) {
        parts.push(
          <a key={String(i) + "-1"} href={urls[i]} target="_blank" rel="noopener noreferrer">
            {urls[i]}
          </a>
        );
      }

      i++;
    }

    return parts;
  }

  generateText() {
    const media = this.state.img;
    const text = this.dm.text.replace(/&gt;/g, '>').replace(/&lt;/g, '<');

    return (
      <div className={classes.text}>
        {media && <img className={classes.img} alt="" src={media} onClick={() => this.setState({ img_full: true })} />}
        {this.props.onClick ? text : this.renderText(text)}
      </div>
    );
  }

  componentDidMount() {
    const media = this.dm.mediaUrls[0];

    if (media && media.startsWith('https://ton.twitter.com/')) {
      SETTINGS.archive.dmImageFromUrl(media, this.is_group)
        .then(blob => {
          this.setState({
            img: this.registered_urls[media] = URL.createObjectURL(blob)
          });
        })
        .catch(() => {
          // Image does not exists, try to go through proxy if the logged user is valid
          if (SETTINGS.archive.user.id === SETTINGS.user.twitter_id) {
            this.setState({
              img: BASE_API_URL + "batch/dm_proxy?url=" + encodeURIComponent(media)
            });
          }
        });
    }
    else if (media) {
      this.setState({
        img: media
      });
    }
  }

  componentWillUnmount() {
    Object.values(this.registered_urls).map(u => URL.revokeObjectURL(u));
  }

  showDate() {
    return <div className={classes.date}>{dateFormatter(SETTINGS.lang === "fr" ? 'd/m/Y, H:i' : 'Y-m-d, H:i', this.props.msg.createdAtDate)}</div>;
  }
  
  onDmClick = () => {
    if (this.props.onClick) {
      this.props.onClick(this.dm.id);
    }
  };

  render() {
    const user = UserCache.getFromCache(this.props.msg.senderId);

    return (
      <div ref={this.inner_ref} className={classes.position + " " + (this.is_you ? classes.you : "")}>
        <div className={classes.root + 
          " " + (this.is_you ? classes.root_you : classes.root_other) +
          " " + (this.props.showPp ? classes.marginT : "")}>
          
          {this.props.showPp && <Avatar 
            className={classes.avatar} 
            src={user ? user.profile_image_url_https.replace('_normal', '') : undefined}
          >
            {user ? "" : "#"}
          </Avatar>}
          
          <div 
            className={classes.msg + 
              " " + (this.is_you ? classes.msg_you : classes.msg_other) +
              " " + (!this.props.showPp ? classes.no_img : "") + 
              " " + (this.props.onClick ? classes.pointer : "") + 
              " " + (this.props.selected ? classes.msg_selected : "")
            }
            onClick={this.onDmClick}
          >
            {this.generateText()}

            {this.props.showDate && this.showDate()}
          </div>
        </div>

        {this.state.img_full && this.renderModal()}
      </div>
    )
  }
}
