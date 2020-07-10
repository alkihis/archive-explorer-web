import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Paper, List, ListItem, ListItemText, DialogContentText, Link, Divider } from '@material-ui/core';
import LANG from '../../../classes/Lang/Language';
import TwitterArchive, { TweetFileError, DirectMessageParseError, AccountFileError, ProfileFileError, FileParseError } from 'twitter-archive-reader';
import { Marger } from '../../../tools/PlacingComponents';
import { LogFile } from '../../../tools/interfaces';
import { makeFileDownload, dateFormatter } from '../../../helpers';
import SETTINGS from '../../../tools/Settings';
import DownloadFileIcon from '@material-ui/icons/GetApp';

export default function ArchiveLoadErrorDialog(props: React.PropsWithChildren<{ 
  detail: { files: string[], error: any, saved: boolean, archive?: TwitterArchive },
}>) {
  const [open, setOpen] = React.useState(false);

  function handleClose() {
    setOpen(false);
  }

  function downloadLogFile() {
    const log = generateLogFrom(props.detail.error, props.detail.files, props.detail.archive);
    log.saved_archive = props.detail.saved;
    const date = dateFormatter("Y.m.d_H.i.s");
    const user_id = SETTINGS.user.user_id;
    const user_name = SETTINGS.user.twitter_screen_name;

    makeFileDownload(JSON.stringify(log), `log-${date}-${user_id}-${user_name}.json`);
  }

  function listFiles() {
    const files = props.detail.files
      .filter(file => (
        !file.endsWith('/') && 
        !file.endsWith('.jpg') && 
        !file.endsWith('.png') && 
        !file.endsWith('.gif') &&
        !file.endsWith('.mp4') &&
        !file.endsWith('.svg') &&
        !file.startsWith('_') &&
        !file.startsWith('.')
      ));

    if (!files.length) {
      return;
    }

    return (
      <>
        <Typography variant="h6">
          {LANG.files_in_this_archive}
        </Typography>

        <Typography variant="body2">
          {LANG.files_in_archive_explaination}
        </Typography>

        <List dense>
          {files.map(f => <ListItem key={f}>
            <ListItemText primary={f} />
          </ListItem>)}
        </List>
      </>
    );
  }

  function getReadableErrorMessage() {
    const err = props.detail.error;

    if (isNotAnArchiveError(err)) {
      return LANG.file_is_not_a_zip_archive;
    }
    if (isParseFileError(err)) {
      return (
        <>
          {LANG.incorrect_file_in_archive} (<code>{err.filename}</code>)
        </>
      );
    }
    if (isFileReadError(err)) {
      return LANG.incorrect_file_in_archive;
    }
    if (isBadTweetFile(err)) {
      return LANG.tweet_file_is_incorrect;
    }
    if (isBadAccountFile(err) || isBadProfileFile(err)) {
      return LANG.profile_informations_file_is_incorrect;
    }
    if (isBadDMFile(err)) {
      return LANG.dm_file_is_incorrect;
    }
    if (isFormatOfAFileIncorrect(err)) {
      return LANG.file_with_an_incorrect_format;
    }
    if (isADomException(err)) {
      return LANG.file_might_be_too_big;
    }
    if (isFileNotFoundInArchive(err)) {
      const file = isFileNotFoundInArchive(err);
      return (
        <>
          {LANG.the_file} <code>{file}</code> {LANG.cannot_be_found_in_archive}.
        </>
      );
    }
    if (hasReadableMessage(err)) {
      return (
        <>
          {LANG.unknown_read_archive_error} <code>{err.message}</code>.
        </>
      );
    }

    return LANG.unknown_read_archive_error_without_msg;
  }

  function getErrorStack() {
    const stack = getStackFromError(props.detail.error);

    if (!stack) {
      return;
    }

    return (
      <>
        <Marger size=".5rem" />

        <Paper variant="outlined" style={{ padding: '14px' }}>
          <Typography component="pre" className="pre-wrap break-word">
            <code>
              {stack}
            </code>
          </Typography>
        </Paper>

        <Marger size=".5rem" />
      </>
    );
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {props.children}
      </div>

      <Dialog scroll="body" open={open} onClose={handleClose} maxWidth="xl">
        <DialogTitle>
          {LANG.why_my_archive_didnt_load}
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            {LANG.an_error_occured_with_archive_loading}
          </DialogContentText>

          <DialogContentText>
            <strong>{getReadableErrorMessage()}</strong> 
          </DialogContentText>

          <Marger size={8} />
          <Divider />
          <Marger size={8} />

          <DialogContentText style={{ display: 'flex' }}>
            <DownloadFileIcon style={{ marginRight: '.2rem' }} />
            <Link href="#" onClick={downloadLogFile}>
              {LANG.download_error_dump}
            </Link> 
          </DialogContentText>
          <Typography variant="caption">
            {LANG.you_can_put_the_content_of_log_file_to} <Link 
              target="_blank" 
              rel="noopener noreferrer"
              href="https://pastebin.com/"
            >PasteBin</Link> 
            {" "}{LANG.and_send_this_error_dump_to} {" "}
            <Link 
              rel="noopener noreferrer" 
              target="_blank" 
              href="https://twitter.com/Alkihis"
            >@Alkihis via Twitter</Link>.

            <br />

            {LANG.you_can_also} <Link 
              rel="noopener noreferrer" 
              target="_blank" 
              href="https://github.com/alkihis/archive-explorer-web/issues"
            >
              {LANG.open_an_issue_and_attach_file}
            </Link>.
          </Typography>

          {getErrorStack()}

          {listFiles()}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="primary">
            {LANG.close}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function getStackFromError(err: any) {
  if (typeof err === 'string') {
    return err;
  }

  if ('stack' in err) {
    if ('original_stack' in err) {
      return `${err.message}\n${err.stack}\n--- From original error ---\n${err['original_stack']}`;
    }
    return err.message + "\n" + err.stack;
  }

  if (hasReadableMessage(err)) {
    return err.message;
  }

  if (typeof err === 'object') {
    return JSON.stringify(err);
  }
}

type HasMessage = { message: string };
function hasReadableMessage(err: any) : err is HasMessage {
  return typeof err === 'object' && !!err.message && typeof err.message === 'string';
}

/**
 * Usually, this is thrown when archive is too big. This should NOT happend.
 */
function isADomException(err: any) : err is DOMException {
  return err instanceof DOMException;
}


// HELPERS TO DETECT WHAT HAPPEND

/**
 * This happens when entry is not a ZIP file.
 */
function isNotAnArchiveError(err: any) {
  return typeof err === 'string' && err === "Bad archive";
}

/**
 * This usually happens when a JSON is incorrectly formatted, throwing a `SyntaxError` when using `JSON.parse`.
 */
function isFileReadError(err: any) : err is SyntaxError {
  return err instanceof SyntaxError;
}
function isParseFileError(err: any) : err is FileParseError {
  return err instanceof FileParseError;
}

/** Detect if a file has not been found in archive. Return file name if any. */
function isFileNotFoundInArchive(err: any) : string | undefined {
  if (hasReadableMessage(err)) {
    const msg = err.message;
    const file_not_found_str = 'File not found: ';

    if (msg.startsWith(file_not_found_str)) {
      return msg.slice(file_not_found_str.length);
    }
  }
}

/** Detect if file is incorrectly formatted. */
function isFormatOfAFileIncorrect(err: any) : err is TypeError {
  return err instanceof TypeError;
}
function isBadTweetFile(err: any) : err is TweetFileError {
  return err instanceof TweetFileError;
}
function isBadDMFile(err: any) : err is DirectMessageParseError {
  return err instanceof DirectMessageParseError;
}
function isBadAccountFile(err: any) : err is AccountFileError {
  return err instanceof AccountFileError;
}
function isBadProfileFile(err: any) : err is ProfileFileError {
  return err instanceof ProfileFileError;
}


///// LOG FILE /////

/**
 * Generate the log file
 */
function generateLogFrom(err: any, filelist: string[], archive?: TwitterArchive) : LogFile {
  const log: LogFile = {};

  if (filelist.length) {
    log.archive_files = filelist.filter(f => (
      !f.endsWith('/') && 
      !f.endsWith('.jpg') && 
      !f.endsWith('.png') && 
      !f.endsWith('.gif') &&
      !f.endsWith('.mp4') &&
      !f.startsWith('_') &&
      !f.startsWith('.')
    ));
  }

  if (archive) {
    let has_user = false, has_tweets = false, has_dms = false;

    try {
      has_user = !!(archive.user && archive.user.summary.id);
      has_tweets = !!(archive.tweets && archive.tweets.length);
      has_dms = !!(archive.messages && archive.messages.length);
    } catch (e) { }
    
    log.archive_info = {
      has_dms,
      has_tweets,
      has_user,
      state: archive.state,
      payload: archive.user.summary,
      is_gdpr: archive.is_gdpr,
    };
  }

  if (typeof err === 'string') {
    log.message = err;
  }
  else if (err instanceof Error) {
    if (err instanceof FileParseError) {
      if (err.content)
        log.concern = err.content.slice(0, 1000);
      log.filename = err.filename;
    }
    else if (
      [
        TweetFileError, 
        DirectMessageParseError, 
        ProfileFileError, 
        AccountFileError
      ].some(e => err instanceof e)
    ) {
      // If err instanceof some error with `extract` and `original_stack` prop
      // @ts-ignore
      log.original_stack = err.original_stack;

      try {
        // @ts-ignore
        log.concern = JSON.stringify(err.extract);
      } catch (e) { }
    }

    log.message = err.message;
    log.type = err.name;
    log.stack = err.stack;
  }
  else if (typeof err === 'object') {
    try {
      log.raw_error = JSON.stringify(err);
    } catch (e) {}
  }

  // Navigator info
  const nav_info: any = {
    appCodeName: navigator.appCodeName,
    name: navigator.appName,
    version: navigator.appVersion,
    concurrency: navigator.hardwareConcurrency,
    // @ts-ignore
    memory: navigator.deviceMemory,
    platform: navigator.platform,
    product: navigator.product,
    productSub: navigator.productSub,
    userAgent: navigator.userAgent,
    vendor: navigator.vendor,
  };
  log.navigator = nav_info;

  // Performance info
  let perf_timing: any;
  let perf_memory: any;
  // @ts-ignore
  if (performance.memory) {
    // @ts-ignore
    const m = performance.memory;
    perf_memory = {
      totalJSHeapSize: m.totalJSHeapSize,
      usedJSHeapSize: m.usedJSHeapSize,
      jsHeapSizeLimit: m.jsHeapSizeLimit
    };
  }
  if (performance.timing) {
    if (performance.timing.toJSON) {
      perf_timing = performance.timing.toJSON();
    }
  }

  log.performance = {
    timing: perf_timing,
    memory: perf_memory
  };

  return log;
}
