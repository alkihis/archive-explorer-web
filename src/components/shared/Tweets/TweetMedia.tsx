import React from 'react';
import classes from './TweetMedia.module.scss';
import { PartialTweetEntity, MediaGDPREntity } from 'twitter-archive-reader';
import { Dialog } from '@material-ui/core';

type TweetMediaProp = {
  entities: PartialTweetEntity | { media?: MediaGDPREntity[] }
};

type TweetMediaState = {
  image_full: number | null
}

export default class TweetMedia extends React.Component<TweetMediaProp, TweetMediaState> {
  state: TweetMediaState = {
    image_full: null
  };

  renderImages() {
    return (this.media as MediaGDPREntity[]).map((m, i) => {
      return <img key={`img${i}`}
        alt="Tweet attachment" 
        src={m.media_url_https} 
        className={classes['img' + (i + 1)]} 
        onClick={() => this.setState({ image_full: i })}
      />;
    });
  }

  renderVideo(type: "gif" | "mp4", full = false) {
    const m = this.media[0] as MediaGDPREntity;

    const valids = m.video_info.variants.filter(e => e.bitrate && e.url.endsWith('.mp4'));

    const bitrates = valids.map(e => Number(e.bitrate));
    const better = bitrates.indexOf(Math.max(...bitrates));

    let better_variants = valids[better];

    // If any variant is valid
    if (!better_variants) {
      console.warn("No good variant", m.video_info.variants, valids);
      better_variants = m.video_info.variants[0];
    }

    if (type === "gif") {
      return <video 
        about="GIF" 
        className={classes.video + (full ? " " + classes.full : "")} 
        loop 
        autoPlay 
        src={better_variants.url} 
        onClick={full ? undefined : () => this.setState({ image_full: 0 })}
      />;
    }
    else {
      return <video 
        about="Video" 
        className={classes.video + (full ? " " + classes.full : "")} 
        controls 
        src={better_variants.url} 
        // onClick={full ? undefined : () => this.setState({ image_full: 0 })}
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
      obj = <img alt="Full" src={image_url} className={classes.full_img} />;
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
    return this.props.entities.media;
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
