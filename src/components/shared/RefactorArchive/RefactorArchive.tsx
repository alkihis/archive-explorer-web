import React from 'react';
import classes from './RefactorArchive.module.scss';
import { Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@material-ui/core';

// STEPS IMG
import step1_mac from '../../../assets/refactor_mac/1.png';
import step2_mac from '../../../assets/refactor_mac/2.png';
import step3_mac from '../../../assets/refactor_mac/3.png';
import step4_mac from '../../../assets/refactor_mac/4.png';
import step5_mac from '../../../assets/refactor_mac/5.png';
import step6_mac from '../../../assets/refactor_mac/6.png';
import step7_mac from '../../../assets/refactor_mac/7.png';

import step1_win from '../../../assets/refactor_windows/1.png';
import step2_win from '../../../assets/refactor_windows/2.png';
import step3_win from '../../../assets/refactor_windows/3.png';
import step4_win from '../../../assets/refactor_windows/4.png';
import step5_win from '../../../assets/refactor_windows/5.png';
import step6_win from '../../../assets/refactor_windows/6.png';

export default class RefactorArchiveButton extends React.Component<{ message?: string, className?: string }, { open: boolean }> {
  state = {
    open: false
  };

  closeModal() {
    this.setState({ open: false });
  }

  openModal() {
    this.setState({ open: true });
  }

  render() {
    return (
      <div className={this.props.className}>
        {/* Dialog download */}
        <RefactorModal open={this.state.open} onClose={() => this.closeModal()} />

        {/* Button */}
        <Button color="primary" onClick={() => this.openModal()}>
          {this.props.message ? this.props.message : "How to fix my archive ?"}
        </Button>
      </div>
    )
  }
}

export const RefactorModal: React.FC<{ open: boolean, onClose: () => void }> = props => {
  const device_mac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);

  const RefactorText = () => {
    return device_mac ? RefactorMac() : RefactorWin();
  }

  const RefactorWin = () => {
    return (
      <div>
        <Typography className={classes.steptitle}>
          1 - Extract the archive using a right-click, then "Extract all".
        </Typography>

        <img className={classes.step} alt="Step" src={step1_win} />

        <Typography className={classes.steptitle}>
          2 - Click on "Extract" on the bottom right of the window.
        </Typography>

        <img className={classes.step} alt="Step" src={step2_win} />

        <Typography className={classes.steptitle}>
          3 - In the automatically created directory, delete the folder named "tweet_media",
          using a right-click, and click on "Delete".
        </Typography>

        <img className={classes.step} alt="Step" src={step3_win} />

        <Typography className={classes.steptitle}>
          4 - Select all elements from the directory using <span className="bold">CTRL + A</span>.
        </Typography>

        <img className={classes.step} alt="Step" src={step4_win} />

        <Typography className={classes.steptitle}>
          5 - Right-click on any element, select "Send to..." then "Compressed folder" to create a new archive.
        </Typography>

        <img className={classes.step} alt="Step" src={step5_win} />

        <Typography className={classes.steptitle}>
          6 - Use the newly created archive in Archive Explorer.
        </Typography>

        <img className={classes.step} alt="Step" src={step6_win} />
      </div>
    );
  }

  const RefactorMac = () => {
    return (
      <div>
        <Typography className={classes.steptitle}>
          1 - Extract the archive using a double click.
        </Typography>

        <img className={classes.step} alt="Step" src={step1_mac} />

        <Typography className={classes.steptitle}>
          2 - Wait for archive extraction. If extraction fails at the end, it may be possible that the archive is
          too big for macOS archiver. 
          Try installing <a href="https://www.keka.io/en/" target="_blank" rel="noopener noreferrer">Keka</a>, then
          double-finger (right) click on the archive, move the cursor to "Open with", and choose Keka.
        </Typography>

        <img className={classes.step} alt="Step" src={step2_mac} />

        <Typography className={classes.steptitle}>
          3 - Open the newly created folder.
        </Typography>

        <img className={classes.step} alt="Step" src={step3_mac} />

        <Typography className={classes.steptitle}>
          4 - Find a folder named "tweet_media", and delete it ("Move to trash").
        </Typography>

        <img className={classes.step} alt="Step" src={step4_mac} />

        <Typography className={classes.steptitle}>
          5 - Select all elements from the directory using <span className="bold">CMD + A</span>.
          
        </Typography>

        <img className={classes.step} alt="Step" src={step5_mac} />

        <Typography className={classes.steptitle}>
          6 - Double-finger (right) click and select "Compress".
        </Typography>

        <img className={classes.step} alt="Step" src={step6_mac} />

        <Typography className={classes.steptitle}>
          7 - Use the newly created archive in Archive Explorer.
        </Typography>

        <img className={classes.step} alt="Step" src={step7_mac} />

        <DialogContentText>
          Link will come into your mailbox. 
          It may take some time (between one hour to several days) to generate. 
          Please be patient.
        </DialogContentText>
      </div>
    );
  }

  return (
      <Dialog
        open={props.open}
        onClose={props.onClose}
        scroll="body"
      >
        <DialogTitle id="scroll-dialog-title">Fix the Twitter Archive</DialogTitle>
        <DialogContent>
          {RefactorText()}
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
  );
};
