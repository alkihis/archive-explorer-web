import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import React, { Suspense } from 'react';
import RouterWrapper from "./RouterWrapper";
import { BigPreloader, CenterComponent } from "../../tools/PlacingComponents";
import { AvailableLanguages } from "../../classes/Lang/Language";

/** Routes: Lazy loading every route. */
const HomePage = React.lazy(() => import("../StaticPresentation/StaticPresentation"));
const Explore = React.lazy(() => import("../vues/Explore/Explore"));
const Archive = React.lazy(() => import("../vues/Archive/Archive"));
const NotFound = React.lazy(() => import("../shared/NotFound/NotFound"));
const LanguageChanger = React.lazy(() => import("../LanguageChanger/LanguageChanger"));
const DirectMessages = React.lazy(() => import("../vues/DirectMessages/DirectMessages"));
const More = React.lazy(() => import("../vues/More/More"));
const FavoriteExplorer = React.lazy(() => import("../vues/FavoriteExplorer/FavoriteExplorer"));

class AppRouter extends React.Component {
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

  render() {
    return (
      <div>
        {this.routerLogged()}
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
