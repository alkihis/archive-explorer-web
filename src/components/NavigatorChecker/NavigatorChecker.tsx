import React from 'react';
import { makeStyles, Card, CardContent, Typography, Link, CardActions, Button, Slide } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  wrapper: {
    position: 'fixed',
    bottom: -7,
    width: '96vw',
    maxWidth: '1200px',
    zIndex: 999,
    marginLeft: 'auto',
    marginRight: 'auto',
    left: 0,
    right: 0,
  },
  root: {
    backgroundColor: theme.palette.type === 'light' ? '#ffffff' : '#5a5a5a',
    border: '2px solid #08bec694',
    boxSizing: 'border-box',
    paddingBottom: 7,
    borderRadius: 8,
  },
  content: {
    paddingBottom: 0,
  },
  header: {
    fontWeight: 700,
    letterSpacing: '-0.05rem',
    padding: '5px 0 10px 0',
  },
  subHeader: {
    letterSpacing: '-0.05rem',
  },
  text: {

  },
  closeBtn: {
    transition: 'opacity .5s',
    transitionDelay: '2.5s',
  },
}));

export default function NavigatorChecker() {
  const [shown, setShown] = React.useState(false);
  const [buttonShown, setButtonShown] = React.useState(false);
  const [badNav, setBadNav] = React.useState<"old" | "no-grid" | "edge">("edge");
  const classes = useStyles();

  React.useEffect(() => {
    if (localStorage.getItem('badNavigatorShown') === 'true') {
      return;
    }

    let bad = false;
    // Check if navigator is outdated
    const user_agent = navigator.userAgent;
    if (user_agent.match(/\bEdge\/1\d\./)) {
      // Old version of edge !
      setBadNav("edge");
      bad = true;
    }
    else {
      if (!CSS.supports('display', 'grid')) {
        // Site will not be displayed correctly
        setBadNav("no-grid");
        bad = true;
      }
      else if (
        !CSS.supports('object-fit', 'cover') ||
        !Promise.prototype.finally
      ) {
        // Site may not display correctly
        setBadNav("old");
        bad = true;
      } 

      // navigator is okay
    }

    if (bad) {
      setTimeout(() => {
        setShown(true);
        setButtonShown(true);
      }, 500);
    }
  }, []);

  function textEdge() {
    return (
      <React.Fragment>
        <Typography variant="h6" className={"tweet-font " + classes.subHeader}>
          You are using an old version of Microsoft Edge.
        </Typography>

        <Typography className={"tweet-font " + classes.text}>
          Please consider upgrading to the {" "}
          <Link target="_blank" rel="noopener noreferrer" href="https://support.microsoft.com/help/4501095/download-the-new-microsoft-edge-based-on-chromium">
            new version of Microsoft Edge, based on Chromium
          </Link>, or change your browser to display this website properly.
        </Typography>
      </React.Fragment>
    );
  }

  function textOld() {
    return (
      <React.Fragment>
        <Typography variant="h6" className={"tweet-font " + classes.subHeader}>
          You are using an old web browser.
        </Typography>

        <Typography className={"tweet-font " + classes.text}>
         Website may not be displayed properly, please consider upgrading your navigator in order to have a better web experience. 
        </Typography>
        <Typography className={"tweet-font " + classes.text}>
          Usually, update process can be found in navigator settings, or through device software update.
        </Typography>
      </React.Fragment>
    );
  }

  function textNoGrid() {
    return (
      <React.Fragment>
        <Typography variant="h6" className={"tweet-font " + classes.subHeader}>
          Your navigator is incompatible with Archive Explorer.
        </Typography>

        <Typography className={"tweet-font " + classes.text}>
          Website will not be shown properly, please consider upgrading your browser in order display this website the correct way.
        </Typography>
        <Typography className={"tweet-font " + classes.text}>
          Step into your navigator settings, and check for updates.
        </Typography>
      </React.Fragment>
    );
  }

  return (
    <div className={classes.wrapper}>
      <Slide direction="up" in={shown} mountOnEnter unmountOnExit>
        <Card className={classes.root} elevation={4}>
          <CardContent className={classes.content}>
            <Typography variant="h5" className={"tweet-font " + classes.header}>
              Navigator is obsolete
            </Typography>
            
            {badNav === "old" && textOld()}
            {badNav === "no-grid" && textNoGrid()}
            {badNav === "edge" && textEdge()}
          </CardContent>
          <CardActions style={{ display: 'grid', justifyContent: 'end' }}>
            <Button 
              className={classes.closeBtn} 
              color="secondary" 
              style={{ opacity: buttonShown ? 1 : 0 }} 
              onClick={() => {
                setShown(false);
                localStorage.setItem('badNavigatorShown', 'true');
              }}
            >
              Close
            </Button>
          </CardActions>
        </Card>
      </Slide>
    </div>
  );
}
