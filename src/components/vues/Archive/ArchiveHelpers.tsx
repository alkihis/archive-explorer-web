import React from 'react';
import LANG from '../../../classes/Lang/Language';
import { ArchiveReadState } from 'twitter-archive-reader';
import { makeStyles, Avatar } from '@material-ui/core';
import SETTINGS from '../../../tools/Settings';

export function truncateText(str: string, threshold = 40, limit_start = 13, limit_end = 10) {
  const l = str.length;
    if (l > threshold) {
      const p1 = str.slice(0, limit_start);
      const p2 = str.slice(l - limit_end, l);
      
      return `${p1}...${p2}`;
    }
    return str;
}

export function loadingMessage(loading_state: ArchiveReadState | "prefetch" | "read_save") {
  switch (loading_state) {
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

const useStylesAvatar = makeStyles(theme => ({
  large: {
    width: 128,
    height: 128,
    marginTop: -60,
    [theme.breakpoints.down('sm')]: {
      width: 96,
      height: 96,
      marginTop: -48,
    },
  },
}));

export function AvatarArchive() {
  const classes = useStylesAvatar();
  const archive = SETTINGS.archive;

  const [url, setUrl] = React.useState<string>(undefined);

  
  React.useEffect(() => {
    if (!url && archive.medias.has_medias) {
      // Download picture from archive
      const profile_pic = archive.medias.getProfilePictureOf(archive.user, false) as Promise<Blob>;
  
      profile_pic && profile_pic.then(img => {
        if (img) {
          setUrl(URL.createObjectURL(img));
        }
      }).catch(() => {});
    }
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  // eslint-disable-next-line 
  }, [url]);

  return (
    <Avatar 
      style={{ gridArea: 'p' }} 
      alt={archive.user.screen_name} 
      src={url ?? archive.user.profile_img_url} 
      className={classes.large}
    >
      {archive.user.name.slice(0, 1)}
    </Avatar>
  );
}
