import { BrowserRouter as Router, Route, Redirect, Switch } from "react-router-dom";
import React from 'react';
import About from "../About/About";
import Home from "../Home/Home";
import RouterWrapper from "./RouterWrapper";
import Archive from "../Archive/Archive";
import SETTINGS from "../../tools/Settings";
import Login from "../Login/Login";
import FinalizeLogin from "../FinalizeLogin/FinalizeLogin";
import NotFound from "../NotFound/NotFound";
import { checkCredentials } from "../../helpers";
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@material-ui/core";
import { BigPreloader } from "../../tools/PlacingComponents";

class AppRouter extends React.Component {
  state: { logged: boolean, will_validate: boolean, validation_status: boolean };

  constructor(props: any) {
    super(props);

    this.state = { 
      logged: !!SETTINGS.token, 
      will_validate: !!SETTINGS.token,
      validation_status: true
    };

    console.log(this.state);
  }

  componentDidMount() {
    if (this.state.will_validate) {
      checkCredentials()
        // Fais attendre (DEBUG)
        .then(is_logged => {
          return new Promise(resolve => setTimeout(resolve, 1000))
            .then(() => is_logged);
        })
        .then(is_logged => {
          if (is_logged) {
            // Tout s'est bien passé, l'utilisateur a un token ok
            this.setState({
              logged: true,
              will_validate: false
            });
          }
          // C'est pas bon, l'utilisateur doit se déconnecter, 
          // token invalide ou API injoignable
          else {
            this.setState({
              validation_status: false
            });
          }
        })
    }
  }

  renderDialogLogin(is_open: boolean) {
    return (
      <Dialog
        open={is_open}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        {this.state.validation_status ? 
        /* L'utilisateur doit attendre que l'API réponde */
          <div>
            <DialogTitle id="alert-dialog-title">{"Login in..."}</DialogTitle>
            <DialogContent style={{ padding: '30px 100px' }}>
              <BigPreloader />
            </DialogContent>
          </div>  
        : 
        /* L'utilisateur n'a pas le choix: Il doit se déconnecter */
          <div>
            <DialogTitle id="alert-dialog-title">{"Error"}</DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                API is unavailable or your login token is invalid. 
                Try to log out and log in again.
                If the problem persists, try again later.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => SETTINGS.logout()} color="primary">
                Log out
              </Button>
            </DialogActions>
          </div>  
        }
      </Dialog>
    );
  }

  routerLogged() {
    return (
      <Router>
        <div className="Router">
          <Switch>
            <Route path="/" exact component={Archive} />  
            <Route path="/explore/" component={Home} />
            <Route path="/settings/" component={Archive} />  
            <Route path="/dms/" component={Archive} />  
            <Route path="/search/" component={Archive} />  
            <Route component={NotFound} />
          </Switch>
          <RouterWrapper />
        </div>
      </Router>
    );
  }

  unloggedRouter() {
    return (
      <Router>
        <Route
          render={props =>
            props.location.pathname.startsWith('/login') ? (
              <Login />
            ) : (
              props.location.pathname.startsWith('/finalize') ? 
              <FinalizeLogin {...props} />
              : (
                <Redirect
                  to={{
                    pathname: "/login/",
                    state: { from: props.location }
                  }}
                />
              )
            )
          }
        />
      </Router>
    );
  }

  render() {
    return (
      <div>
        {this.renderDialogLogin(this.state.will_validate)}
        {!this.state.will_validate ?
          (this.state.logged ? 
            this.routerLogged() : 
            this.unloggedRouter()
          ) :
          ""
        }
      </div>
    );
  }
}
  
  export default AppRouter;