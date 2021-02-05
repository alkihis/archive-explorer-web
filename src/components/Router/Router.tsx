import { BrowserRouter as Router, Route, Redirect, Switch } from "react-router-dom";
import React, { Suspense } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@material-ui/core";
import SETTINGS from "../../tools/Settings";
import RouterWrapper from "./RouterWrapper";
import { checkCredentials } from "../../helpers";
import { BigPreloader, CenterComponent } from "../../tools/PlacingComponents";
import LANG, { AvailableLanguages } from "../../classes/Lang/Language";

/** Routes: Lazy loading every route. */
const HomePage = React.lazy(() => import("../StaticPresentation/StaticPresentation"));
const Explore = React.lazy(() => import("../vues/Explore/Explore"));
const Archive = React.lazy(() => import("../vues/Archive/Archive"));
const Login = React.lazy(() => import("../vues/Login/Login"));
const FinalizeLogin = React.lazy(() => import("../FinalizeLogin/FinalizeLogin"));
const NotFound = React.lazy(() => import("../shared/NotFound/NotFound"));
const LanguageChanger = React.lazy(() => import("../LanguageChanger/LanguageChanger"));
const DirectMessages = React.lazy(() => import("../vues/DirectMessages/DirectMessages"));
const More = React.lazy(() => import("../vues/More/More"));
const FavoriteExplorer = React.lazy(() => import("../vues/FavoriteExplorer/FavoriteExplorer"));

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
          <DialogTitle>{LANG.login_error_title}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {LANG.login_error_text}
            </DialogContentText>
            <DialogContentText>
              {LANG.login_error_persists}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => SETTINGS.logout()} color="primary">
              {LANG.logout}
            </Button>
          </DialogActions>
        </div>
      );
    }
    // null
    else {
      return (
        <div>
          <DialogTitle>{LANG.server_unavailable}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {LANG.server_unavailable_text}
            </DialogContentText>

            <DialogContentText>
              {LANG.try_again_later}.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => SETTINGS.reload()} color="primary">
              {LANG.reload}
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
            <DialogTitle>{LANG.login_in}...</DialogTitle>
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
        <Suspense fallback={<SuspenseWaiting />}>
          <Switch>
            <Route path="/archive/" component={Archive} />
            <Route path="/tweets/" component={Explore} />
            <Route path="/favorites/" component={FavoriteExplorer} />
            <Route path="/dms/" component={DirectMessages} />
            <Route path="/more/" component={More} />
            <Route path="/" exact component={HomePage} />

            {/* Langs autochange */}
            {Object.keys(AvailableLanguages)
              .map(lang => <Route key={lang} path={`/${lang}/`} component={LanguageChanger} />)
            }

            {/* Not found page */}
            <Route component={NotFound} />
          </Switch>
        </Suspense>
        <RouterWrapper />
      </Router>
    );
  }

  unloggedRouter() {
    return (
      <Router>
        <Suspense fallback={<SuspenseWaiting />}>
          <Switch>
            <Route path="/" exact component={HomePage} />
            <Route path="/finalize" component={FinalizeLogin} />
            <Route path="/login" component={Login} />

            <Route render={props => <Redirect to={{ pathname: "/", state: { from: props.location }}} />} />
          </Switch>
        </Suspense>
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
        {!this.state.modal_shown &&
          (this.logged ?
            this.routerLogged() :
            this.unloggedRouter()
          )
        }
      </div>
    );
  }
}

function SuspenseWaiting() {
  return (
    <CenterComponent style={{height: '100vh'}}>
      <BigPreloader />
    </CenterComponent>
  );
}

export default AppRouter;
