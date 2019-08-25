import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import Error from '@material-ui/icons/Error';
import Grid from '@material-ui/core/Grid';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { Fab, CircularProgress } from '@material-ui/core';
import { blue, red } from '@material-ui/core/colors';
import sign_in_twitter from '../../assets/sign-in-with-twitter-link.png';
import APIHELPER from '../../tools/ApiHelper';
import { RequestTokenRequest } from '../../tools/interfaces';

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      <Link color="inherit" href="https://alkihis.fr/">
        Alkihis
      </Link>{', '}
      {new Date().getFullYear()}
      {'. Built with '}
      <Link color="inherit" href="https://material-ui.com/">
        Material-UI.
      </Link>
    </Typography>
  );
}

const useStyles = makeStyles(theme => ({
  root: {
    height: '100vh',
  },
  image: {
    backgroundImage: 'url(https://source.unsplash.com/random)',
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
    backgroundColor: theme.palette.secondary.main,
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
  const classes = useStyles({});

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
    APIHELPER.request('users/request', undefined, 'POST')
      .then((data: RequestTokenRequest) => {
        setLoading(false);

        setLink(data.url);
        localStorage.setItem('save_token_secret', data.oauth_token_secret);
      })
      .catch(e => {
        setLoading(false);
        setError(true);
      });
  }

  if (loading) {
    runGetter();
  }

  return (
    <Grid container component="main" className={classes.root}>
      <CssBaseline />
      <Grid item xs={false} sm={4} md={7} className={classes.image} />
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          <div className={classes.form}>
            <div className={classes.wrapper + " " + classes.alignC}>
              {loading ? <CircularProgress className={classes.progress} />
              : (error ? <div>
                  <Fab
                    aria-label="save"
                    color="primary"
                    className={error ? classes.buttonError : classes.buttonSuccess}
                    onClick={handleButtonClick}
                  >
                    <Error />
                  </Fab>
                  <p>
                    An error occured.
                  </p>
                </div>
                : "")
              }
              {twitter_button ? <div>
                <a href={twitter_button}>
                  <img src={sign_in_twitter} alt="Sign in with Twitter" className={classes.twitterImg} />
                </a>
              </div> : ""}
            </div>
        
            <Box mt={5}>
              <Copyright />
            </Box>
          </div>
        </div>
      </Grid>
    </Grid>
  );
}