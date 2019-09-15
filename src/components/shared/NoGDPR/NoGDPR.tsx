import React from 'react';
import classes from './NoGDPR.module.scss';
import { CenterComponent } from '../../../tools/PlacingComponents';
import { Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@material-ui/core';
import { Link } from 'react-router-dom';

// STEPS IMG
import step2 from '../../../assets/steps/2.png';
import step3 from '../../../assets/steps/3.png';
import step4 from '../../../assets/steps/4.png';
import step5 from '../../../assets/steps/5.png';
import step6 from '../../../assets/steps/6.png';
import step7 from '../../../assets/steps/7.png';
import step8 from '../../../assets/steps/8.png';

export default class NoGDPR extends React.Component<{ icon: any, message?: string }, { open: boolean }> {
  state = {
    open: false
  };

  closeModal() {
    this.setState({ open: false });
  }

  openModal() {
    this.setState({ open: true });
  }

  downloadGDPRText() {
    return (
      <div>
        <Typography className={classes.steptitle}>
          1 - Log in on <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter.com</a>.
        </Typography>

        <Typography className={classes.steptitle}>
          2 - Click on the three dots, "More", right above the tweet button.
        </Typography>

        <img className={classes.step} alt="Step" src={step2} />

        <Typography className={classes.steptitle}>
          3 - Select "Settings and privacy".
        </Typography>

        <img className={classes.step} alt="Step" src={step3} />

        <Typography className={classes.steptitle}>
          4 - On the newly appeared menu, choose "Privacy and safety".
        </Typography>

        <img className={classes.step} alt="Step" src={step4} />

        <Typography className={classes.steptitle}>
          5 - Scroll at the end of the container, and click on "Personalization and data".
        </Typography>

        <img className={classes.step} alt="Step" src={step5} />

        <Typography className={classes.steptitle}>
          6 - Again, scroll until the end and select "See your Twitter data".
        </Typography>

        <img className={classes.step} alt="Step" src={step6} />

        <Typography className={classes.steptitle}>
          7 - You should see a password input. Enter your password and click "Confirm".
        </Typography>

        <img className={classes.step} alt="Step" src={step7} />

        <Typography className={classes.steptitle}>
          8 - You can now click on the first "Request data" button.
        </Typography>

        <img className={classes.step} style={{height: '150px'}} alt="Step" src={step8} />

        <DialogContentText>
          Link will come into your mailbox. 
          It may time some times (up to several days) to generate. 
          Please be patient.
        </DialogContentText>
      </div>
    );
  }

  render() {
    const Icon = this.props.icon;

    return (
      <div>
        {/* Dialog download */}
        <Dialog
          open={this.state.open}
          onClose={() => this.closeModal()}
          scroll="body"
        >
          <DialogTitle id="scroll-dialog-title">Download GDPR archive</DialogTitle>
          <DialogContent>
            {this.downloadGDPRText()}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.closeModal()} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Real component, text */}
        <div className="center-absolute">
          <CenterComponent className={classes.text_lighten}>
            <Icon className={classes.icon} />

            <Typography variant="h4" style={{marginTop: "1rem", marginBottom: ".7rem", textAlign: 'center'}}>
              GDPR archive is required
            </Typography>

            {this.props.message && <Typography variant="h6">
              {this.props.message}
            </Typography>}

            <Typography variant="h6">
              Please load an valid GDPR archive in <Link to="/" className={classes.link}>
                <Typography variant="inherit" color="primary">
                  Archive page
                </Typography>
              </Link>.
            </Typography>

            <div style={{marginTop: "1rem"}}>
              <Button color="primary" onClick={() => this.openModal()}>How to download an GDPR archive ?</Button>
            </div>
          </CenterComponent>
        </div>
      </div>
    )
  }
}
