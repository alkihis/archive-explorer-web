import { BrowserRouter as Router, Route, Redirect, Switch, RouteComponentProps } from "react-router-dom";
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
import More from "../vues/More/More";
import { StaticContext } from "react-router";
import StaticPresentation from "../StaticPresentation/StaticPresentation";

type RouterState = { 
  /** True if login modal should be shown.
   * False if login modal is hidden. 
   * Null will stop the page affichage. */
  modal_shown: boolean | null, 
  /** 
   * True if the user is logged and validated. True by default (to enable page showing),
   * but if user is not logged, automatically set to false.
   * When credentials are checked, must be updated.
   * 
   * Null mean server is not accessible.
   */
  validation_status: boolean | null
};

class AppRouter extends React.Component<{}, RouterState> {
  state: RouterState;

  protected logged = !!SETTINGS.token;

  constructor(props: any) {
    super(props);

    this.state = { 
      modal_shown: null,
      validation_status: true
    };
  }

  componentDidMount() {
    // Si un utilisateur est enregistré et qu'on a un token
    if (SETTINGS.user && SETTINGS.twitter_user && this.logged) {
      // un utilisateur est valide, check en arrière plan
      this.setState({
        modal_shown: false
      });

      checkCredentials()
        .then(is_logged => {
          if (!is_logged) {
            // C'est pas bon, l'utilisateur doit se déconnecter, 
            // token invalide ou API injoignable
            this.setState({
              validation_status: is_logged,
              modal_shown: true
            });
          }
        })
    }
    // Processus de connexion classique 
    // (si user not defined, pas censé arrivé)
    else if (this.logged) {
      this.setState({
        modal_shown: true
      });

      checkCredentials()
        .then(is_logged => {
          if (is_logged) {
            // Tout s'est bien passé, l'utilisateur a un token ok
            this.setState({
              modal_shown: false
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
    else {
      this.setState({
        modal_shown: false
      });
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
            <Route path="/archive/" component={Archive} />  
            <Route path="/explore/" component={Explore} />
            <Route path="/settings/" component={Settings} />  
            <Route path="/dms/" component={DirectMessages} />  
            <Route path="/more/" component={More} />  
            <Route path="/" exact component={StaticPresentation} />
            <Route component={NotFound} />
          </Switch>
          <RouterWrapper />
        </div>
      </Router>
    );
  }

  unloggedRouter() {
    const renderUnloggedRoute = (props: RouteComponentProps<any, StaticContext, any>) => {
      if (props.location.pathname.startsWith('/login')) {
        return <Login />;
      }
      else if (props.location.pathname.startsWith('/finalize')) {
        return <FinalizeLogin {...props} />;
      }
      else if (props.location.pathname === "/") {
        // Homepage (static)
        return <StaticPresentation />;
      }
      else {
        return <Redirect
          to={{
            pathname: "/",
            state: { from: props.location }
          }}
        />;
      }
    };

    return (
      <Router>
        <Route render={renderUnloggedRoute} />
      </Router>
    );
  }

  render() {
    if (this.state.modal_shown === null) {
      // n'affiche rien, composant en cours de chargement
      return <div />;
    }

    return (
      <div>
        {this.state.modal_shown && this.renderDialogLogin()}
        {!this.state.modal_shown ?
          (this.logged ? 
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
