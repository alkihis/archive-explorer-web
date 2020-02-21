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
        toast(LANG.an_error_occurred);
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
          Classic archive helps to read your tweets offline with a simple web viewer containing in archive files.
        </DialogContentText>

        <DialogContentText color="error">
          Those kind of archives does not contains anything except tweets. Do not substitute current archive with a classic archive,
          or you will lose direct messages, medias, user informations like advertiser data, screen name history, email address and more.
        </DialogContentText>

        <DialogContentText color="error">
          Classic archives are and should be only a way to view your tweets offline and are not supposed to be more.
        </DialogContentText>
      </React.Fragment>
    );
  }

  function renderInLoad() {
    return (
      <React.Fragment>
        <DialogContentText>
          Please wait during archive creation. This might take a while.
        </DialogContentText>
        
        <CenterComponent style={{ marginTop: 15 }}>
          <CircularProgress size={24} />
        </CenterComponent>
      </React.Fragment>
    );
  }

  function renderBaked() {
    return (
      <React.Fragment>
        <DialogContentText>
          Your archive is ready.
        </DialogContentText>

        <DialogContentText>
          <Link href={link} download="archive.zip">
            Download it here
          </Link>.
        </DialogContentText>
      </React.Fragment>
    );
  }

  return (
    <Dialog open={!!props.open} onClose={loading ? undefined : props.onClose}>
      <DialogTitle>
        Convert to classic archive
      </DialogTitle>

      <DialogContent>
        {!link && !loading && renderInfo()}
        {link && !loading && renderBaked()}
        {loading && renderInLoad()}
      </DialogContent>

      <DialogActions>
        {!link && !loading && <React.Fragment>
          <Button color="primary" onClick={createArchive}>
            Create offline archive
          </Button>  
        </React.Fragment>}

        {!loading && <React.Fragment>
          <Button color="secondary" onClick={props.onClose}>
            Close
          </Button>  
        </React.Fragment>}
      </DialogActions>
    </Dialog>
  );
}
