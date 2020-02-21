import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, CircularProgress, Link } from '@material-ui/core';
import { CenterComponent } from '../../../tools/PlacingComponents';
import ClassicArchiveMaker from '../../../tools/ClassicArchiveMaker';
import SETTINGS from '../../../tools/Settings';
import { toast } from '../../shared/Toaster/Toaster';
import LANG from '../../../classes/Lang/Language';

// TODO TRANSLATE
export default function ConvertArchiveModal(props: { open?: boolean, onClose: () => void, }) {
  const [loading, setLoading] = React.useState(false);
  const [link, setLink] = React.useState("");

  React.useEffect(() => {
    if (link) {
      URL.revokeObjectURL(link);
    }

    setLoading(false);
    setLink("");
    // eslint-disable-next-line
  }, [props.open]);

  function createArchive() {
    if (loading)
      return;

    setLoading(true);

    ClassicArchiveMaker.make(SETTINGS.archive)
      .then(blob => {
        setLink(URL.createObjectURL(blob));
      })
      .catch(e => {
        toast(LANG.an_error_occurred, "error");
        console.error(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function renderInfo() {
    return (
      <React.Fragment>
        <DialogContentText>
          {LANG.create_archive_title}
        </DialogContentText>

        <DialogContentText color="error">
          {LANG.create_archive_p1}
          <br />
          <strong>
            {LANG.create_archive_p2}
          </strong>
        </DialogContentText>

        <DialogContentText color="error">
          {LANG.create_archive_p3}
        </DialogContentText>
      </React.Fragment>
    );
  }

  function renderInLoad() {
    return (
      <React.Fragment>
        <DialogContentText>
          {LANG.archive_generation_wait}
        </DialogContentText>
        
        <CenterComponent style={{ marginTop: 15 }}>
          <CircularProgress size={48} />
        </CenterComponent>
      </React.Fragment>
    );
  }

  function getLinkName() {
    const user = SETTINGS.archive.user;
    const [year, month, day] = [
      new Date().getFullYear(),
      String(new Date().getMonth() + 1).padStart(2, "0"),
      String(new Date().getDate()).padStart(2, "0"),
    ];

    return `${user.screen_name}-${year}-${month}-${day}.zip`;
  }

  function renderBaked() {
    return (
      <React.Fragment>
        <DialogContentText>
          {LANG.your_archive_is_ready}.
        </DialogContentText>

        <DialogContentText>
          <strong>
            <Link href={link} download={getLinkName()}>
              {LANG.click_here_to_download_it}
            </Link>.
          </strong>
        </DialogContentText>
      </React.Fragment>
    );
  }

  return (
    <Dialog open={!!props.open} onClose={loading ? undefined : props.onClose}>
      <DialogTitle>
        {LANG.create_classic_archive}
      </DialogTitle>

      <DialogContent>
        {!link && !loading && renderInfo()}
        {link && !loading && renderBaked()}
        {loading && renderInLoad()}
      </DialogContent>

      <DialogActions>
        {!link && !loading && <React.Fragment>
          <Button color="primary" onClick={createArchive}>
            {LANG.create}
          </Button>  
        </React.Fragment>}

        {!loading && <React.Fragment>
          <Button color="secondary" onClick={props.onClose}>
            {LANG.close}
          </Button>  
        </React.Fragment>}
      </DialogActions>
    </Dialog>
  );
}
