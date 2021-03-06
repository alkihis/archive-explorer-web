import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import Error from '@material-ui/icons/Error';
import Grid from '@material-ui/core/Grid';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { Fab, CircularProgress } from '@material-ui/core';
import { blue, red } from '@material-ui/core/colors';
import sign_in_twitter from '../../../assets/sign-in-with-twitter-link.png';
import APIHELPER, { API_URLS } from '../../../tools/ApiHelper';
import { RequestTokenRequest } from '../../../tools/interfaces';
import { setPageTitle } from '../../../helpers';
import classes from './Login.module.scss';
import { IMG_PREFIX, IMG_LIST } from '../../../const';
import LANG from '../../../classes/Lang/Language';

const classes_a = classes;
const IMG_CHOOSEN = IMG_PREFIX + IMG_LIST[Math.floor(Math.random()*IMG_LIST.length)];

const useStyles = makeStyles(theme => ({
  root: {
    height: '100vh',
  },
  image: {
    backgroundImage: `url(${IMG_CHOOSEN})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  paper: {
    margin: theme.spacing(8, 4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  wrapper: {
    margin: theme.spacing(1),
    position: 'relative',
    marginTop: "30px",
  },
  buttonSuccess: {
    backgroundColor: blue[500],
    '&:hover': {
      backgroundColor: blue[700],
    },
  },
  buttonError: {
    backgroundColor: red[500],
    '&:hover': {
      backgroundColor: red[700],
    },
  },
  fabProgress: {
    color: red[300],
    position: 'absolute',
    top: -6,
    left: -6,
    zIndex: 1,
  },
  alignC: {
    textAlign: 'center',
  },
  progress: {
    margin: theme.spacing(2),
  },
  twitterImg: {
    
  }
}));

export default function Login() {
  setPageTitle("Login");
  const classes = useStyles({});

  return (
    <Grid container component="main" className={classes.root}>
      <CssBaseline />
      <Grid item xs={false} sm={4} md={7} className={classes.image} />
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <FolderOpenIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Archive Explorer
          </Typography>

          <Typography component="h3" variant="h6" className={classes_a.catch_phrase}>
            {LANG.tiny_access_text}
          </Typography>

          <div className={classes.form}>
            <div className={classes.wrapper + " " + classes.alignC}>
              <LoginButton classes={classes} />
            </div>
        
            <Box mt={5}>
              <Typography variant="body2" color="textSecondary" align="center" className={classes_a.legal_text}>
                {LANG.using} <span className="bold">{LANG.sign_in_with_twitter}</span>, {LANG.you_allow}
                <span className="bold"> Archive Explorer</span> {LANG.login_details_store_end}. 
              </Typography>
            </Box>
          </div>
        </div>
      </Grid>
    </Grid>
  );
}

const LoginButton: React.FC<{classes: any}> = (props: { classes: any }) => {
  const [loading, setLoading] = React.useState(true);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [twitter_button, setLink] = React.useState("");

  function handleButtonClick() {
    if (!loading && !success) {
      setSuccess(false);
      setLoading(true);
      setError(false);
      
      // Load through API
      runGetter();
    }
  }

  function runGetter() {
    APIHELPER.request(API_URLS.twitter_request_token, { method: 'POST', auth: false })
      .then((data: RequestTokenRequest) => {
        setLoading(false);

        setLink(data.url);
        localStorage.setItem('save_token_secret', data.oauth_token_secret);
      })
      .catch(e => {
        console.error("Error while fetching request token:", e);
        setLoading(false);
        setError(true);
      });
  }

  if (loading) {
    runGetter();
  }

  return (
    <React.Fragment>
      {loading ? 
        <CircularProgress className={props.classes.progress} />
        : (error ? <div>
            <Fab
              color="primary"
              className={error ? props.classes.buttonError : props.classes.buttonSuccess}
              onClick={handleButtonClick}
            >
              <Error />
            </Fab>
            <p>
              {LANG.error_occured}.
            </p>
          </div>
          : "")
      }
      {twitter_button ? <div>
        <a href={twitter_button} className={classes_a.twitter_link}>
          <img src={sign_in_twitter} alt={LANG.sign_in_with_twitter} className={props.classes.twitterImg + " " + classes_a.twitter_img} />
        </a>
      </div> : ""}
    </React.Fragment>
  )
};
