import React from "react";
import { Grid, CircularProgress, Typography, CardContent, Button } from "@material-ui/core";
import LoginIcon from '@material-ui/icons/Refresh';
import SETTINGS from "./Settings";

export const CenterComponent = (props: any) => {
  return (
    <Grid container direction="column" justify="center" {...props} alignItems="center">
      {props.children}
    </Grid>
  );
};

export const BigPreloader: React.FC = (props) => {
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
          Error
        </Typography>

        <hr/>

        <Typography variant="h5" component="h2" style={{marginBottom: '2.5rem'}}>
          {message}
        </Typography>
        <p>
          {additionnal_text}
        </p>

        {login_again ? (
          <Button onClick={() => SETTINGS.logout()} color="primary" style={{width: '100%', marginTop: '1.5rem'}}>
            <LoginIcon style={{marginRight: '3%'}} /> Login again
          </Button>
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
  options = Object.assign({ sep: ", ", final_joiner: " and ", class_joiner: "no-bold" }, options);

  if (array.length < 2) {
    return <span>{array[0]}</span>;
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
