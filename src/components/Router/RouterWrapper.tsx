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
import { Badge } from '@material-ui/core';
import TaskModal from '../vues/TaskModal/TaskModal';
import Tasks, { TaskInformation, TaskBaseMessage } from '../../tools/Tasks';

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
    task_opens: false,
    tasks_running: 0
  };

  internal_progress: Set<string> = new Set;

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

  componentDidMount() {
    // @ts-ignore
    Tasks.addEventListener('progression', this.handleTaskProgress);
    // @ts-ignore
    Tasks.addEventListener('unsubscribe', this.handleUnsubscribe);
     // @ts-ignore
    Tasks.addEventListener('remove', this.handleUnsubscribe);
  }

  componentWillUnmount() {
    // @ts-ignore
    Tasks.removeEventListener('progression', this.handleTaskProgress);
    // @ts-ignore
    Tasks.removeEventListener('unsubscribe', this.handleUnsubscribe);
    // @ts-ignore
    Tasks.removeEventListener('remove', this.handleUnsubscribe);
  }

  handleTaskProgress = (e: CustomEvent<TaskInformation>) => {
    if (e.detail.percentage >= 100) {
      if (this.internal_progress.has(e.detail.id)) {
        this.internal_progress.delete(e.detail.id);

        this.setState({
          tasks_running: this.internal_progress.size
        });
      }
    }
    else {
      if (!this.internal_progress.has(e.detail.id)) {
        this.internal_progress.add(e.detail.id);

        this.setState({
          tasks_running: this.internal_progress.size
        });
      }
    }
  };

  handleUnsubscribe = (e: CustomEvent<TaskBaseMessage>) => {
    this.internal_progress.delete(e.detail.id);
    this.setState({
      tasks_running: this.internal_progress.size
    });
  };

  calculateCurrentValue(props: { location: { pathname: string } }) {
    const { pathname } = props.location;
    const { pathMap } = this.state;

    const value = pathMap.indexOf(pathname);

    return value;
  }

  handleChange = (_: ChangeEvent, value: any) => {
    // N'auth pas task
    if (value in this.state.pathMap)
      this.setState({ value });
  };

  handleModalOpen = () => {
    this.setState({ task_opens: true });
  }

  handleModalClose = () => {
    this.setState({ task_opens: false });
  }

  renderModalTasks() {
    return <TaskModal open={this.state.task_opens} onClose={this.handleModalClose} />;
  }

  renderTaskIcon() {
    if (this.state.tasks_running === 0) {
      return <TasksIcon />;
    }
    
    return (
      <Badge badgeContent={this.state.tasks_running} color="primary">
        <TasksIcon />
      </Badge>
    );
  }

  render() {
    const { value, pathMap } = this.state;

    return (
      <div>
        {this.renderModalTasks()}

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
          <BottomNavigationAction label="Tasks" icon={this.renderTaskIcon()} onClick={() => this.handleModalOpen()} />
        </BottomNavigation>
      </div>
    );
  }
}

// @ts-ignore
export default withRouter(RouterWrapper);
