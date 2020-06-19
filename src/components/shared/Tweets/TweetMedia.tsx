import React, { SyntheticEvent } from 'react';
import classes from './TweetMedia.module.scss';
import { PartialTweetEntity, MediaGDPREntity, PartialTweet } from 'twitter-archive-reader';
import { Dialog } from '@material-ui/core';
// @ts-ignore
import { Lightbox as ModalImage } from "react-modal-image";
import LANG from '../../../classes/Lang/Language';
import { TweetContext } from './TweetContext';
import { Status } from 'twitter-d';
import SETTINGS from '../../../tools/Settings';

type TweetMediaState = {
  image_full: number | null
}

export default class TweetMedia extends React.Component<{}, TweetMediaState> {
  static contextType = TweetContext;
  context!: PartialTweet | Status;

  state: TweetMediaState = {
    image_full: null
  };

  image_refs: string[] | undefined;
  replacements: { [media_url: string]: string } | undefined;

  componentWillUnmount() {
    // Clean possibly created object URLs
    if (this.image_refs)
      for (const el of this.image_refs) {
        URL.revokeObjectURL(el);
      }
  }

  async onMediaError(this: [this, MediaGDPREntity, string?], evt: SyntheticEvent<HTMLImageElement | HTMLVideoElement>) {
    const [that, media, possible_media_url] = this;
    const media_url = possible_media_url ?? media.media_url_https;

    // If media is already replaced, do nothing
    if (that.replacements && media_url in that.replacements) {
      return;
    }

    // Look for image in archive
    const element = evt.currentTarget;

    // Get media from archive
    try {
      const blob = await SETTINGS.archive.medias.fromTweetMediaEntity(media, false) as Blob;

      if (!that.image_refs) {
        that.image_refs = [];
      }
      if (!that.replacements) {
        that.replacements = {};
      }

      const url = URL.createObjectURL(blob);
      that.image_refs.push(url);
      that.replacements[media_url] = url;

      element.src = url;
      console.log('image replaced for tweet', media.source_status_id, url);
    } catch (e) {
      console.log('media does not exists', e);
    }
  }

  getRealUrlForImage(url: string) {
    if (!this.replacements) {
      return url;
    }

    if (url in this.replacements) {
      return this.replacements[url];
    }
    return url;
  }

  get entities() : PartialTweetEntity | { media?: MediaGDPREntity[] } {
    if (this.context.extended_entities) {
      if (this.context.extended_entities.media && this.context.extended_entities.media.length) {
        return this.context.extended_entities as { media?: MediaGDPREntity[] };
      }
    }

    if (this.context.entities && this.context.entities.media && this.context.entities.media.length) {
      return this.context.entities as PartialTweetEntity; 
    }

    return { media: [] };
  }

  get allow_local() {
    return SETTINGS.use_tweets_local_medias && SETTINGS.archive.medias.has_medias;
  }

  get allow_local_videos() {
    return SETTINGS.use_tweets_local_videos && this.allow_local;
  }

  renderImages() {
    return (this.media as MediaGDPREntity[]).map((m, i) => {
      return <img key={`img${i}`}
        alt="Tweet attachment" 
        src={this.getRealUrlForImage(m.media_url_https)} 
        onError={this.allow_local ? this.onMediaError.bind([this, m]) : undefined}
        className={classes['img' + (i + 1)]} 
        onClick={() => this.setState({ image_full: i })}
      />;
    });
  }

  renderVideo(type: "gif" | "mp4", full = false) {
    const m = this.media[0] as MediaGDPREntity;
    // Remove the possible query string
    m.video_info.variants.forEach(e => e.url = e.url.split('?', 2)[0]);

    const valids = m.video_info.variants.filter(e => e.bitrate !== undefined && e.url.endsWith('.mp4'));

    const bitrates = valids.map(e => Number(e.bitrate));
    const better = bitrates.indexOf(Math.max(...bitrates));

    let better_variants = valids[better];

    // If any variant is valid
    if (!better_variants) {
      console.warn("No good variant", m.video_info.variants, valids);
      better_variants = m.video_info.variants[0];
    }

    const best_url = better_variants.url;
    const url = this.getRealUrlForImage(best_url);

    if (type === "gif") {
      const is_ios = navigator.userAgent.includes('iPhone OS');

      return (
        <video 
          controls={is_ios}
          autoPlay={!is_ios}
          about="GIF" 
          playsInline
          loop 
          className={classes.video + (full ? " " + classes.full : "")} 
          src={url} 
          onError={this.allow_local_videos ? this.onMediaError.bind([this, m, best_url]) : undefined}
          onClick={full ? undefined : () => this.setState({ image_full: 0 })}
        />
      );
    }
    else {
      return <video 
        about="Video" 
        className={classes.video + (full ? " " + classes.full : "")} 
        controls 
        src={url} 
        onError={this.allow_local_videos ? this.onMediaError.bind([this, m, best_url]) : undefined}
      />;
    }
  }

  rightClass() {
    switch (this.media.length) {
      case 2:
        return "two";
      case 3:
        return "three";
      case 4:
        return "four";
    }

    return "one";
  }

  renderModal(image: number) {
    const used_entity = this.media;
    let obj: any;

    if (
      used_entity.length === 1 && 
      (used_entity[0] as MediaGDPREntity).type && 
      (used_entity[0] as MediaGDPREntity).type !== "photo"
    ) {
      const media = used_entity[0] as MediaGDPREntity;
      obj = this.renderVideo(media.type === "animated_gif" ? "gif" : "mp4", true);
    }
    else {
      const image_url = used_entity[image].media_url_https;
      // obj = <img alt="Full" src={image_url} className={classes.full_img} />;
      
      // With modal image
      return (
        <ModalImage 
          large={this.getRealUrlForImage(image_url)}
          alt={LANG.full_image}
          onClose={() => this.setState({ image_full: null })}
          hideDownload
          hideZoom
        />
      );
    }

    return (
      <Dialog classes={
        {paper: classes.paper}
      } onClose={() => this.setState({ image_full: null })} open={true}>
        {obj}
      </Dialog>
    );
  }

  get media() {
    return this.entities.media;
  }

  render() {
    const used_entity = this.media;

    let data: JSX.Element | JSX.Element[];
    if (
      used_entity.length === 1 && 
      (used_entity[0] as MediaGDPREntity).type && 
      (used_entity[0] as MediaGDPREntity).type !== "photo"
    ) {
      const media = used_entity[0] as MediaGDPREntity;
      data = this.renderVideo(media.type === "animated_gif" ? "gif" : "mp4");
    }
    else {
      data = this.renderImages();
    }

    const to_inject = this.rightClass();

    return (
      <div>
        {this.state.image_full !== null && this.renderModal(this.state.image_full)}
        <div className={classes.root + " " + (to_inject ? classes[to_inject] : "")}>
          {data}
        </div>
      </div>
    );
  }
}
