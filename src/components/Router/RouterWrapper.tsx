import React, { Component, ChangeEvent } from 'react';
import { Link, withRouter } from 'react-router-dom';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import HomeIcon from '@material-ui/icons/Home';
import QuestionIcon from '@material-ui/icons/QuestionAnswer';
import ArchiveIcon from '@material-ui/icons/Archive';
import './RouterWrapper.scss';

class RouterWrapper extends Component {
  state = {
    value: 0,
    pathMap: [
      '/',
      '/about/',
      '/archive/'
    ]
  };

  componentWillReceiveProps(newProps: any) {
    const { pathname } = newProps.location;
    const { pathMap } = this.state;

    const value = pathMap.indexOf(pathname);

    if (value > -1) {
      this.setState({
        value
      });
    }
  }

  handleChange = (_: ChangeEvent, value: any) => {
    this.setState({ value });
  };

  render() {
    const { value, pathMap } = this.state;

    return (
      <BottomNavigation
        value={value}
        onChange={this.handleChange.bind(this)}
        showLabels
        className="nav primary stick-to-bottom"
      >
        <BottomNavigationAction label="Home" icon={<HomeIcon />} component={Link} to={pathMap[0]} />
        <BottomNavigationAction label="About" icon={<QuestionIcon />} component={Link} to={pathMap[1]} />
        <BottomNavigationAction label="Archive" icon={<ArchiveIcon />} component={Link} to={pathMap[2]} />
      </BottomNavigation>
    );
  }
}

// @ts-ignore
export default withRouter(RouterWrapper);