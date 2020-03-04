import React from "react";
import { Grid, CircularProgress, Typography, CardContent, Button, Link as MUILink, Container, Tabs, withStyles } from "@material-ui/core";
import LoginIcon from '@material-ui/icons/Refresh';
import SETTINGS from "./Settings";
import { Link } from "react-router-dom";
import LANG from "../classes/Lang/Language";
import FindUseful from "../components/StaticPresentation/FindUseful";
import './PlacingComponents.scss';
import { VERSION } from "../const";

export const CenterComponent = (props: any) => {
  return (
    <Grid container direction="column" justify="center" {...props} alignItems="center">
      {props.children}
    </Grid>
  );
};

export const BigPreloader: React.FC<any> = (props: any) => {
  return (
    <CenterComponent {...props}>
      <CircularProgress style={{width: '70px', height: '70px'}} thickness={2} />
    </CenterComponent>
  );
};

export const Marger: React.FC<{ size: number | string }> = props => {
  return <div style={{
    width: '100%',
    height: 1,
    marginTop: props.size,
    marginBottom: props.size
  }} />;
}

export function internalError(message: string, additionnal_text = "", login_again = false) {
  return (
    <div>
      <CardContent>
        <Typography variant="h3" gutterBottom>
          {LANG.error}
        </Typography>

        <hr/>

        <Typography variant="h5" component="h2" style={{marginBottom: '2.5rem'}}>
          {message}
        </Typography>
        <p>
          {additionnal_text}
        </p>

        {login_again ? (
          <Link to="/login">
            <Button onClick={() => SETTINGS.logout(false)} color="primary" style={{width: '100%', marginTop: '1.5rem'}}>
              <LoginIcon style={{marginRight: '3%'}} /> {LANG.login_again}
            </Button>
          </Link>
        ) : "" }
      </CardContent>
    </div>
  );
}

export function specialJoinJSX(array: string[], options: { 
  sep?: string, 
  final_joiner?: string, 
  class_element?: string, 
  class_joiner?: string 
} = {}) : JSX.Element {
  options = Object.assign({ sep: ", ", final_joiner: " " + LANG.and + " ", class_joiner: "no-bold" }, options);

  if (array.length < 2) {
    return <span className={options.class_element}>{array[0]}</span>;
  }

  const e: JSX.Element[] = [];

  let i = 0;
  let last = array.length - 1;

  for (const element of array) {
    e.push(<span className={options.class_element} key={String(Math.random())}>{element}</span>);

    if ((i + 1) === last) {
      e.push(<span key={String(Math.random())} className={options.class_joiner}>{options.final_joiner}</span>);
    }
    else if (i < last) {
      e.push(<span key={String(Math.random())} className={options.class_joiner}>{options.sep}</span>);
    }

    i++;
  }

  return <span>{e}</span>;
}

export function Copyright({ version }: { version?: boolean }) {
  return (
    <div className={"copyright" + (version ? " small-padding" : "")}>
      <Typography align="center" className="main-twitter-link">
        <img 
          src="/assets/Twitter_Bird.svg" 
          alt="Twitter logo" 
          className="twitter-bird"
        />
        <MUILink href="https://twitter.com/ArchivExplorer" rel="noopener noreferrer" target="_blank">
          @ArchivExplorer
        </MUILink>
      </Typography>

      <Typography variant="body2" color="textSecondary" align="center">
        {LANG.ae_made_by} <a 
          href="https://alkihis.fr/" 
          rel="noopener noreferrer" 
          target="_blank"
        >
          Alkihis
        </a> • <a 
          href="https://twitter.com/alkihis/" 
          rel="noopener noreferrer" 
          target="_blank"
          className="twitter-link"
        >
          @Alkihis
        </a>.
      </Typography>

      <FindUseful />

      <div className="github-links">
        <GithubLogo url="https://github.com/alkihis/archive-explorer-node" text={LANG.server} />

        <GithubLogo url="https://github.com/alkihis/archive-explorer-web" text={LANG.client} />

        <GithubLogo url="https://github.com/alkihis/twitter-archive-reader" text={LANG.archive_reader} />
      </div>

      {version && <Container className="version">
        Archive Explorer version {VERSION}
      </Container>}
    </div>
  );
}


function GithubLogo(props: { url: string, text: string }) {
  return (
    <a rel="noopener noreferrer" target="_blank" className="github-container" href={props.url}>
      <img src="/assets/github_logo.png" alt="" className="github-img" />
      <span className="github-text">{props.text}</span>
    </a>
  );
}

export function ClassicHeader(props: { title: string, divider?: boolean | React.ReactNode, }) {
  return (
    <React.Fragment>
      <header className="linear-header-text no-dark">
        <Typography variant="h2" className="tweet-font">
          {props.title}
        </Typography>
      </header>
      {props.divider && <div 
        className="linear-header-divider background-flat-image-linear no-dark"
      >
        {props.divider}
      </div>}
    </React.Fragment>
  );
}

export const ClassicTabs = withStyles({
  root: {
    backgroundImage: 'linear-gradient(270deg, #08ccc3 0%, #0078D7 100%)',
    backgroundColor: 'unset !important',
    color: 'white !important',
  },
  indicator: {
    backgroundColor: 'white',
  },
})(Tabs);
