import React from 'react';
import classes from './NoGDPR.module.scss';
import { CenterComponent } from '../../../tools/PlacingComponents';
import { Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@material-ui/core';
import { Link } from 'react-router-dom';

// STEPS IMG
import step2 from '../../../assets/steps/2.png';
import step3 from '../../../assets/steps/3.png';
import step6 from '../../../assets/steps/6.png';
import step7 from '../../../assets/steps/7.png';
import step8 from '../../../assets/steps/8.png';
import LANG from '../../../classes/Lang/Language';

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

  render() {
    const Icon = this.props.icon;

    return (
      <div>
        {/* Dialog download */}
        <DownloadGDPRModal open={this.state.open} onClose={() => this.closeModal()} />

        {/* Real component, text */}
        <div className="center-absolute">
          <CenterComponent className={classes.text_lighten}>
            <Icon className={classes.icon + " icon-error-color"} />

            <Typography 
              variant="h4" 
              className="background-text-error-linear tweet-font" 
              style={{
                marginTop: "1rem", 
                marginBottom: ".7rem", 
                textAlign: 'center',
                fontWeight: 700,
                letterSpacing: '-0.05rem'
              }}
            >
              {LANG.gdpr_required}
            </Typography>

            {this.props.message && <Typography variant="h6">
              {this.props.message}
            </Typography>}

            <Typography variant="h6">
              {LANG.load_valid_gdpr_in} <Link to="/" className={classes.link}>
                <Typography variant="inherit" color="primary">
                  {LANG.archive_page}
                </Typography>
              </Link>.
            </Typography>

            <div style={{marginTop: "1rem"}}>
              <Button color="primary" onClick={() => this.openModal()}>{LANG.how_to_download_gdpr} ?</Button>
            </div>
          </CenterComponent>
        </div>
      </div>
    )
  }
}

export const DownloadGDPRModal: React.FC<{ open: boolean, onClose: () => void }> = props => {
  const downloadGDPRText = () => {
    return (
      <div>
        <Typography className={classes.steptitle}>
          1 - {LANG.login_on} <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter.com</a>.
        </Typography>

        <Typography className={classes.steptitle}>
          2 - {LANG.dl_gdpr_step_2}.
        </Typography>

        <img className={classes.step} alt="Step" src={step2} />

        <Typography className={classes.steptitle}>
          3 - {LANG.dl_gdpr_step_3}.
        </Typography>

        <img className={classes.step} alt="Step" src={step3} />

        <Typography className={classes.steptitle}>
          4 - {LANG.dl_gdpr_step_4}.
        </Typography>

        <img className={classes.step} alt="Step" src={step6} />

        <Typography className={classes.steptitle}>
          5 - {LANG.dl_gdpr_step_5}.
        </Typography>

        <img className={classes.step} alt="Step" src={step7} />

        <Typography className={classes.steptitle}>
          6 - {LANG.dl_gdpr_step_6}.
        </Typography>

        <img className={classes.step} style={{height: '150px'}} alt="Step" src={step8} />

        <DialogContentText>
          {LANG.dl_gdpr_step_end}
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
        <DialogTitle id="scroll-dialog-title">{LANG.download_your_archive}</DialogTitle>
        <DialogContent>
          {downloadGDPRText()}
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} color="primary">
            {LANG.close}
          </Button>
        </DialogActions>
      </Dialog>
  );
};
