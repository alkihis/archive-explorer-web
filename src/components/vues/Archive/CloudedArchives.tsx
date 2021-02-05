import React from 'react';
import Button from '@material-ui/core/Button';
import JSZip from 'jszip';
import LANG from '../../../classes/Lang/Language';
import CloudCircleIcon from '@material-ui/icons/CloudCircle';
import DeleteIcon from '@material-ui/icons/Delete';
import { Typography, Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText, LinearProgress, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, IconButton } from '@material-ui/core';
import { BigPreloader } from '../../../tools/PlacingComponents';
import APIHELPER, { API_URLS } from '../../../tools/ApiHelper';
import { MAX_CLOUDED_ARCHIVES } from '../../../const';
import { AvailableSavedArchives } from './Archive';
import SAVED_ARCHIVES, { SavedArchiveInfo } from '../../../tools/SavedArchives/SavedArchives';
import { toast } from '../../shared/Toaster/Toaster';
import { ArchiveSave } from 'twitter-archive-saver';
import { dateFormatter } from '../../../helpers';
import SETTINGS from '../../../tools/Settings';

export interface CloudedArchiveProps {
  open: boolean;
  onClose: () => any;
  onNewArchiveDownloaded: (uuid: string) => any;
}

interface UploadInfo {
  step: 'compress' | 'chunk_upload' | 'finish';
  chunk_percentage?: number;
  buffer_percentage?: number;
}

export function CloudedArchive(props: CloudedArchiveProps) {
  const [mode, setMode] = React.useState<'list' | 'downloading' | 'upload_choose' | 'uploading'>('list');
  const [uploadInfo, setUploadInfo] = React.useState<UploadInfo>();

  async function onCloudedArchiveClick(archive: UploadedArchive) {
    setMode('downloading');

    try {
      const zip = await APIHELPER.request(API_URLS.cloud_download_archive + '/' + archive.id, {
        end_with_json: false,
        mode: 'blob',
        method: 'GET',
      }) as Blob;

      const extracted_object: ArchiveSave = JSON.parse(
        await
          (await JSZip.loadAsync(zip))
          .file('data.json')
          .async('text')
      );

      const info = await SAVED_ARCHIVES.registerRawArchive(extracted_object, archive.name);
      props.onNewArchiveDownloaded(info.uuid);
    } catch (e) {
      toast(LANG.cloud_download_failure, 'error');
      console.error(e);
    } finally {
      setMode('list');
    }
  }

  async function onSavedArchiveToCloudClick(archive: SavedArchiveInfo) {
    setMode('uploading');
    setUploadInfo({
      step: 'compress',
    });

    try {
      const object_archive = await SAVED_ARCHIVES.getRawArchive(archive.uuid);
      const zip = new JSZip();
      zip.file('data.json', JSON.stringify(object_archive));

      const blob_archive = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 7,
        },
      });

      // Initiate the upload
      const { id: file_id, already_sent } = await APIHELPER.request(API_URLS.cloud_start_upload, {
        parameters: {
          info: archive,
          filename: archive.name,
          size: blob_archive.size,
        },
        method: 'POST',
        body_mode: 'json',
      });

      if (already_sent) {
        return toast(LANG.already_sent, 'warning');
      }

      const CHUNK_LENGTH = 512 * 1024; // 512 Ko
      let current_position = 0;
      let chunk: Blob;

      while ((chunk = blob_archive.slice(current_position, current_position + CHUNK_LENGTH)).size) {
        const percentage = Math.trunc((current_position / blob_archive.size) * 100);
        const buffer_percentage = Math.trunc(((current_position + CHUNK_LENGTH) / blob_archive.size) * 100);
        const chunk_index = Math.trunc(current_position / CHUNK_LENGTH);
        setUploadInfo({
          step: 'chunk_upload',
          chunk_percentage: percentage,
          buffer_percentage,
        });

        await APIHELPER.request(API_URLS.cloud_send_chunk, {
          parameters: {
            chunk_id: chunk_index,
            file_id,
            chunk,
          },
          method: 'POST',
          body_mode: 'multipart',
        });

        current_position += CHUNK_LENGTH;
      }

      setUploadInfo({
        step: 'finish',
        chunk_percentage: 100,
        buffer_percentage: 100,
      });

      // Finalize
      await APIHELPER.request(API_URLS.cloud_end_upload, {
        parameters: { file_id },
        method: 'POST',
      });

      toast(LANG.archive_successfully_uploaded, 'success');
    } catch (e) {
      toast(LANG.cloud_upload_failure, 'error');
      console.error(e);
    } finally {
      setMode('list');
      setUploadInfo(undefined);
    }
  }

  function onWantUploadArchiveClick() {
    setMode('upload_choose');
  }

  function goToList() {
    setMode('list');
  }

  function getOnClose() {
    if (['downloading', 'uploading'].includes(mode)) {
      return undefined;
    }
    return props.onClose;
  }

  return (
    <Dialog
      open={props.open}
      onClose={getOnClose()}
      fullWidth
    >
      {mode === 'list' && <CloudedArchiveList
        onClose={props.onClose}
        onCloudedArchiveClick={onCloudedArchiveClick}
        onWantUploadArchiveClick={onWantUploadArchiveClick}
      />}
      {mode === 'downloading' && <DownloadingArchiveLoader />}
      {mode === 'upload_choose' && <CloudNewArchive
        onClose={props.onClose}
        onPrevious={goToList}
        onLoad={onSavedArchiveToCloudClick}
      />}
      {mode === 'uploading' && uploadInfo !== undefined && <UploadingArchiveLoader {...uploadInfo} />}
    </Dialog>
  );
}

function PreloaderWithText() {
  return (
    <div>
      <BigPreloader />
      <Typography color="textPrimary" style={{marginTop: '30px'}} align="center">
        {LANG.please_wait}
      </Typography>
    </div>
  );
}

function DownloadingArchiveLoader() {
  return (
    <>
      <DialogTitle>{LANG.downloading_clouded_archive}</DialogTitle>
      <DialogContent>
        <div style={{ marginBottom: '1rem' }}>
          <PreloaderWithText />
        </div>
      </DialogContent>
    </>
  );
}

function UploadingArchiveLoader(props: UploadInfo) {
  return (
    <>
      <DialogTitle>{LANG.upload_archive}</DialogTitle>
      <DialogContent>
        {props.chunk_percentage === undefined && <PreloaderWithText />}

        <DialogContentText align="center">
          {props.step === 'compress' && LANG.compressing_archive}
          {props.step === 'chunk_upload' && LANG.uploading_archive}
          {props.step === 'finish' && LANG.finishing_clouding_archive}
        </DialogContentText>

        {props.chunk_percentage !== undefined && <div>
          <LinearProgress
            variant="buffer"
            value={props.chunk_percentage}
            valueBuffer={props.buffer_percentage}
          />

          <DialogContentText align="center" style={{ marginTop: '1rem', marginBottom: '.5rem' }}>
            {props.chunk_percentage}% {LANG.completed}
          </DialogContentText>
        </div>}
      </DialogContent>
    </>
  );
}

interface CloudedArchiveListProps {
  onClose: () => any;
  onCloudedArchiveClick: (archive: UploadedArchive) => any;
  onWantUploadArchiveClick: () => any;
}

interface UploadedArchive {
  id: string,
  name: string,
  info: any,
  date: string,
}

function CloudedArchiveList(props: CloudedArchiveListProps) {
  const [archives, setArchives] = React.useState<UploadedArchive[]>(undefined);

  React.useEffect(() => {
    // Download available archives
    APIHELPER.request(API_URLS.cloud_get_uploaded)
      .then(uploaded => {
        setArchives(uploaded.files);
      });
  }, []);

  async function onArchiveClick(archive: UploadedArchive) {
    const hash = archive.info.hash as string;

    if (await SAVED_ARCHIVES.hasArchiveWithHash(hash)) {
      return toast(LANG.already_saved, 'warning');
    }

    props.onCloudedArchiveClick(archive);
  }

  async function onCloudedArchiveDelete(archive: UploadedArchive) {
    setArchives(archives.filter(a => a !== archive));

    try {
      await APIHELPER.request(API_URLS.cloud_delete_archive + '/' + archive.id, {
        method: 'DELETE',
        end_with_json: false,
      });
      toast(LANG.clouded_archive_removed, 'success');
    } catch (e) {
      toast(LANG.unable_to_delete_cloud_archive, 'error');
      console.error(e);
    }
  }

  return (
    <>
      <DialogTitle>{LANG.list_of_clouded_archives}</DialogTitle>
      <DialogContent>
        {
          archives === undefined ?
            <PreloaderWithText /> :
            <div>
              <DialogContentText>
                {LANG.here_are_the_saved_archives_on_your_cloud_account}
                <br />
                {LANG.click_on_a_clouded_save_to_download_it}
              </DialogContentText>

              {archives.length === 0 && <DialogContentText align="center">
                <strong>{LANG.no_clouded_archive}</strong>
              </DialogContentText>}
              {archives.length > 0 && <List>
                {archives.map(archive => <ListItem button key={archive.id} onClick={() => onArchiveClick(archive)}>
                  <ListItemIcon>
                    <CloudCircleIcon />
                  </ListItemIcon>

                  <ListItemText
                    primary={archive.name}
                    secondary={LANG.format(
                      'cloud_saved_at',
                      dateFormatter(
                        SETTINGS.lang === "fr" ? "d/m/Y H:i" : "Y-m-d H:i",
                        new Date(archive.date),
                      ),
                    )}
                  />

                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="delete" onClick={() => onCloudedArchiveDelete(archive)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>)}
              </List>}
            </div>
        }
      </DialogContent>

      {archives !== undefined && <DialogActions>
        {archives.length < MAX_CLOUDED_ARCHIVES && <Button onClick={props.onWantUploadArchiveClick} color="primary">
          {LANG.cloud_a_new_archive}
        </Button>}
        <Button onClick={props.onClose} color="secondary">
          {LANG.close}
        </Button>
      </DialogActions>}
    </>
  );
}

interface CloudNewArchiveProps {
  onPrevious: () => any;
  onClose: () => any;
  onLoad: (info: SavedArchiveInfo) => any;
}

function CloudNewArchive(props: CloudNewArchiveProps) {
  return (
    <>
      <DialogTitle>{LANG.cloud_a_new_archive}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {LANG.select_archive_from_local_saved_archives}
        </DialogContentText>

        <AvailableSavedArchives
          canDelete={false}
          canSave={false}
          onLoad={props.onLoad}
          hideHeader
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={props.onPrevious} color="primary">
          {LANG.previous}
        </Button>
        <Button onClick={props.onClose} color="secondary">
          {LANG.close}
        </Button>
      </DialogActions>
    </>
  );
}
