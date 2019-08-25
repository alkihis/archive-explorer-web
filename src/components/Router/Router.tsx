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

function AppRouter() {
  if (SETTINGS.token) {
    // On est connecté
    return (
      <Router>
        <div className="Router">
          <Switch>
            <Route path="/" exact component={Home} />  
            <Route path="/about/" component={About} />
            <Route path="/archive/" component={Archive} />  
            <Route path="/login/" component={Login} />  
            <Route component={NotFound} />
          </Switch>
          <RouterWrapper />
        </div>
      </Router>
    );
  }
  else {
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
}
  
  export default AppRouter;