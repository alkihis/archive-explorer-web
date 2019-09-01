import React, { Component, ChangeEvent } from 'react';
import { Link, withRouter, RouteComponentProps } from 'react-router-dom';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import ExploreIcon from '@material-ui/icons/Explore';
import MailIcon from '@material-ui/icons/Mail';
import ArchiveIcon from '@material-ui/icons/FolderShared';
import TasksIcon from '@material-ui/icons/CheckBox';
import SettingsIcon from '@material-ui/icons/Settings';
import SearchIcon from '@material-ui/icons/Search';
import './RouterWrapper.scss';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@material-ui/core';
import SETTINGS from '../../tools/Settings';

class RouterWrapper extends Component {
  state = {
    value: 0,
    pathMap: [
      '/',
      '/explore/',
      '/search/',
      '/dms/',
      '/settings/',
    ],
    modal_open: false
  };

  constructor(props: RouteComponentProps) {
    super(props);
    this.state.value = this.calculateCurrentValue(props);

    props.history.listen(location => {
      const value = this.calculateCurrentValue({ location });

      if (value > -1 && value !== this.state.value) {
        this.setState({
          value
        });
      }
    });
  }

  calculateCurrentValue(props: { location: { pathname: string } }) {
    const { pathname } = props.location;
    const { pathMap } = this.state;

    const value = pathMap.indexOf(pathname);

    return value;
  }

  handleChange = (_: ChangeEvent, value: any) => {
    this.setState({ value });
  };

  render() {
    const { value, pathMap } = this.state;

    return (
      <div>
        <BottomNavigation
          value={value}
          onChange={this.handleChange.bind(this)}
          showLabels
          className="nav primary stick-to-bottom"
        >
          <BottomNavigationAction label="Archive" icon={<ArchiveIcon />} component={Link} to={pathMap[0]} />
          <BottomNavigationAction label="Explore" icon={<ExploreIcon />} component={Link} to={pathMap[1]} />
          <BottomNavigationAction label="Search" icon={<SearchIcon />} component={Link} to={pathMap[2]} />
          <BottomNavigationAction label="Direct Messages" icon={<MailIcon />} component={Link} to={pathMap[3]} />
          <BottomNavigationAction label="Settings" icon={<SettingsIcon />} component={Link} to={pathMap[4]} />
          <BottomNavigationAction label="Tasks" icon={<TasksIcon />} />
        </BottomNavigation>
      </div>
    );
  }
}

// @ts-ignore
export default withRouter(RouterWrapper);
