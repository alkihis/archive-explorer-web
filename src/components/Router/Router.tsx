import { BrowserRouter as Router, Route, Redirect, Switch } from "react-router-dom";
import React from 'react';
import Explore from "../vues/Explore/Explore";
import RouterWrapper from "./RouterWrapper";
import Archive from "../vues/Archive/Archive";
import SETTINGS from "../../tools/Settings";
import Login from "../vues/Login/Login";
import FinalizeLogin from "../FinalizeLogin/FinalizeLogin";
import NotFound from "../shared/NotFound/NotFound";
import { checkCredentials } from "../../helpers";
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@material-ui/core";
import { BigPreloader } from "../../tools/PlacingComponents";
import Settings from "../vues/Settings/Settings";
import DirectMessages from "../vues/DirectMessages/DirectMessages";
import Search from "../vues/Search/Search";

class AppRouter extends React.Component {
  state: { logged: boolean, will_validate: boolean, validation_status: boolean | null };

  constructor(props: any) {
    super(props);

    this.state = { 
      logged: !!SETTINGS.token, 
      will_validate: !!SETTINGS.token,
      validation_status: true
    };

    // console.log(this.state);
  }

  componentDidMount() {
    if (this.state.will_validate) {
      checkCredentials()
        // Fais attendre (DEBUG)
        .then(is_logged => {
          return new Promise(resolve => setTimeout(resolve, 0))
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
              validation_status: is_logged
            });
          }
        })
    }
  }

  apiError() {
    if (this.state.validation_status === false) {
      return (
        <div>
          <DialogTitle>Login error</DialogTitle>
          <DialogContent>
            <DialogContentText>
              You credentials seems to be invalid.
              Try to log out and log in again.
            </DialogContentText>
            <DialogContentText>
              If the problem persists, try again later.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => SETTINGS.logout()} color="primary">
              Log out
            </Button>
          </DialogActions>
        </div>  
      );
    }
    // null
    else {
      return (
        <div>
          <DialogTitle>Server unavailable</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Archive Explorer could not dialog with its server-side.
              You may be offline, or the server is temporary unavailable.
            </DialogContentText>

            <DialogContentText>
              Try again later.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => SETTINGS.reload()} color="primary">
              Reload
            </Button>
          </DialogActions>
        </div>  
      );
    }
  }

  renderDialogLogin() {
    return (
      <Dialog
        open={true}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        {this.state.validation_status ? 
        /* L'utilisateur doit attendre que l'API réponde */
          <div>
            <DialogTitle>Login in...</DialogTitle>
            <DialogContent style={{ padding: '30px 100px' }}>
              <BigPreloader />
            </DialogContent>
          </div>  
        : 
        /* L'utilisateur n'a pas le choix: Il doit se déconnecter */
          this.apiError()
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
            <Route path="/explore/" component={Explore} />
            <Route path="/settings/" component={Settings} />  
            <Route path="/dms/" component={DirectMessages} />  
            <Route path="/search/" component={Search} />  
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
        {this.state.will_validate && this.renderDialogLogin()}
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