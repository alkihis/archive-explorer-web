import React from "react";
import { Grid, CircularProgress, Typography, CardContent, Button } from "@material-ui/core";
import LoginIcon from '@material-ui/icons/Refresh';
import SETTINGS from "./Settings";

export const CenterComponent = (props: any) => {
  return (
    <Grid container direction="row" justify="center" {...props} alignItems="center">
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
