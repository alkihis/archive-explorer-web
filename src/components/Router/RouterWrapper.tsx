import React, { Component, ChangeEvent } from 'react';
import { Link, withRouter, RouteComponentProps } from 'react-router-dom';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import TwitterIcon from '@material-ui/icons/Twitter';
import MailIcon from '@material-ui/icons/Mail';
import ArchiveIcon from '@material-ui/icons/FolderShared';
import MoreIcon from '@material-ui/icons/MoreHoriz';
import FavoriteIcon from '@material-ui/icons/Star';
import classes from './RouterWrapper.module.scss';
import LANG from '../../classes/Lang/Language';

interface RouterWrapperProps extends RouteComponentProps {}
interface RouterWrapperState {
  value: number,
  pathMap: string[],
  task_opens: boolean,
  tasks_running: number,
  shown: boolean,
}

class RouterWrapper extends Component<RouterWrapperProps, RouterWrapperState> {
  state: RouterWrapperState = {
    value: 0,
    pathMap: [
      '/archive/',
      '/tweets/',
      '/dms/',
      '/favorites/',
      '/more/',
    ],
    task_opens: false,
    tasks_running: 0,
    shown: true
  };

  constructor(props: RouteComponentProps) {
    super(props);
    this.state.value = this.calculateCurrentValue(props);

    if (props.location.pathname === "/") {
      this.state.shown = false;
    }

    this.handleChange = this.handleChange.bind(this);

    props.history.listen(location => {
      const value = this.calculateCurrentValue({ location });

      if (value > -1 && value !== this.state.value) {
        this.setState({
          value,
          shown: location.pathname !== '/'
        });
      }
      else if (
        (this.state.shown && location.pathname === "/") ||
        (!this.state.shown && location.pathname !== "/")
      ) {
        this.setState({
          shown: location.pathname !== "/"
        });
      }
    });
  }

  calculateCurrentValue(props: { location: { pathname: string } }) {
    const { pathname } = props.location;
    const { pathMap } = this.state;

    return pathMap.indexOf(pathname);
  }

  handleChange = (_: ChangeEvent<{}>, value: any) => {
    // N'auth pas task
    if (value in this.state.pathMap)
      this.setState({ value });
  };

  render() {
    const { value, pathMap } = this.state;

    if (!this.state.shown) {
      return <div />;
    }

    return (
      <div>
        <BottomNavigation
          value={value}
          onChange={this.handleChange}
          showLabels
          className={"nav primary " + classes.stick_to_bottom + " " + classes.bottom_bar}
        >
          <BottomNavigationAction label={LANG.archive} icon={<ArchiveIcon />} component={Link} to={pathMap[0]} />
          <BottomNavigationAction label={LANG.tweets_menu} icon={<TwitterIcon />} component={Link} to={pathMap[1]} />
          <BottomNavigationAction label={LANG.direct_messages} icon={<MailIcon />} component={Link} to={pathMap[2]} />
          <BottomNavigationAction label={LANG.favorites} icon={<FavoriteIcon />} component={Link} to={pathMap[3]} />
          <BottomNavigationAction label={LANG.more} icon={<MoreIcon />} component={Link} to={pathMap[4]} />
        </BottomNavigation>
      </div>
    );
  }
}

export default withRouter(RouterWrapper);
