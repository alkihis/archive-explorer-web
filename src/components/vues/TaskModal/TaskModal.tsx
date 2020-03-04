import classes from './TaskModal.module.scss';
import React from 'react';
import Tasks, { TaskInformation, TaskBaseMessage } from '../../../tools/Tasks';
import { Dialog, AppBar, Toolbar, Typography, Slide, Button, Container } from '@material-ui/core';
import { TransitionProps } from '@material-ui/core/transitions';
import Task from './Task';
import { CenterComponent, BigPreloader } from '../../../tools/PlacingComponents';
import EmptyMessage from '../../shared/EmptyMessage/EmptyMessage';
import TimelineIcon from '@material-ui/icons/Timeline';
import CompletedIcon from '@material-ui/icons/Check';
import SubscribedIcon from '@material-ui/icons/Sync';
import UnSubbedIcon from '@material-ui/icons/CloudQueue';
import LANG from '../../../classes/Lang/Language';

const Transition = React.forwardRef<unknown, TransitionProps>(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

type TaskModalProps = {
  open: boolean;
  onClose: Function;
};

type TaskModalState = {
  key: string;
  open: boolean;
  subscribed: TaskInformation[];
  unsub?: TaskInformation[];
};

export default class TaskModal extends React.Component<TaskModalProps, TaskModalState> {
  constructor(props: TaskModalProps) {
    super(props);

    this.state = { 
      key: String(Math.random()), 
      open: props.open,
      subscribed: [],
      unsub: null
    };
  }

  componentDidMount() {
    // @ts-ignore
    Tasks.addEventListener('progression', this.handleProgress);
    // @ts-ignore
    Tasks.addEventListener('remove', this.handleRemove);
  }

  componentWillUnmount() {
    // @ts-ignore
    Tasks.removeEventListener('progression', this.handleProgress);
    // @ts-ignore
    Tasks.removeEventListener('remove', this.handleRemove);
  }

  componentDidUpdate(prev_props: TaskModalProps) {
    if (prev_props.open !== this.props.open) {
      // Will reset key
      let subscribed: TaskInformation[] = [];
      const key = String(Math.random());

      if (this.props.open) {
        // Charge
        subscribed = Tasks.subscribed;

        Tasks.all.then(ts => {
          // Le composant a changé d'état ouvert/fermé
          if (this.state.key !== key) {
            return;
          }

          const ids = new Set(subscribed.map(t => t.id));
          // Fait la différence entre souscrit et actuelles
          let unsub = ts.filter(t => !ids.has(t.id));

          if (this.state.unsub) {
            unsub = [...this.state.unsub, ...unsub];
          }

          this.setState({ unsub });
        })
        .catch(() => {
          // impossible de charger
          this.setState({ unsub: undefined });
        })
      }

      this.setState({
        key,
        open: this.props.open,
        subscribed,
        unsub: null
      });
    }
  }

  handleClose = () => {
    this.setState({
      open: false
    });
    this.props.onClose();
  }

  handleProgress = (p: CustomEvent<TaskInformation>) => {
    // handle 
    const t = this.state.subscribed.findIndex(t => t.id === p.detail.id);

    if (t !== -1) {
      const s = this.state.subscribed;
      s[t] = p.detail;

      this.setState({
        subscribed: s
      });
    }
  } 

  handleRemove = (p: CustomEvent<TaskBaseMessage>) => {
    // handle remove task
    // Remove task from subs/unsubs
    const t = this.state.subscribed.filter(t => t.id !== p.detail.id);
    const u = this.state.unsub ? this.state.unsub.filter(t => t.id !== p.detail.id) : [];

    // Actualise composant
    this.setState({
      subscribed: t,
      unsub: u
    });
  } 

  onSubChange = (is_sub: boolean, id: string) => {
    if (is_sub) {
      const old = this.state.unsub.find(t => t.id === id);

      if (old) {
        const unsub = this.state.unsub.filter(t => t.id !== id);
        const sub = [...this.state.subscribed, old];

        Tasks.subscribe(id);

        this.setState({
          unsub,
          subscribed: sub
        });
      }
    }
    else {
      const old = this.state.subscribed.find(t => t.id === id);

      if (old) {
        const subscribed = this.state.subscribed.filter(t => t.id !== id);

        // Si la tâche est terminée, elle disparaît
        let unsub: TaskInformation[];
        if (old.percentage >= 100) {
          unsub = this.state.unsub;
        }
        else {
          unsub = this.state.unsub ? [...this.state.unsub, old] : [old];
        }

        Tasks.unsubscribe(id);

        this.setState({
          unsub,
          subscribed
        });
      }
    }
  };

  onCancel = (id: string) => {
    const task = this.state.subscribed.findIndex(t => t.id === id);

    if (task === -1) {
      if (this.state.unsub) {
        const unsubbed = this.state.unsub.findIndex(t => t.id === id);

        if (unsubbed === -1) {
          return;
        }

        // Cancel
        const unsub = this.state.unsub.filter(t => t.id !== id);

        Tasks.cancel(id);

        this.setState({
          unsub
        });
      }
      return;
    }

    const subscribed = this.state.subscribed.filter(t => t.id !== id);
    Tasks.cancel(id);
    this.setState({
      subscribed
    });
  };

  generateOverTasks() {
    const over = this.over_tasks;

    return over.map(t => <Task 
      data={t} 
      key={"oversub" + t.id}
      subscribed
      onSubChange={this.onSubChange} 
      onCancel={this.onCancel}
    />);
  }

  generateSubscribed() {
    const not_over = this.state.subscribed.filter(t => t.percentage < 100);

    if (not_over.length === 0) {
      return (
        <div className={classes.no_sub}>
          <Typography variant="h6" className={classes.no_sub_text}>
            {LANG.any_subscription}.
          </Typography>
        </div>
      );
    }

    return not_over.map(t => <Task 
      data={t} 
      key={"sub" + t.id}
      subscribed
      onSubChange={this.onSubChange} 
      onCancel={this.onCancel}
    />);
  }

  generateUnSub() {
    if (Array.isArray(this.state.unsub)) {
      return this.state.unsub.map(t => <Task 
        data={t} 
        key={"unsub" + t.id}
        onSubChange={this.onSubChange} 
        onCancel={this.onCancel}
      />);
    }

    // Error
    return <div className={classes.error_load}>
      {LANG.unable_fetch_tasks}
    </div>;
  }

  generateTasks() {
    // Subscribed tasks
    if (!this.state.open) {
      return <div />;
    }

    const is_completed_tasks = this.over_tasks.length > 0;
    const is_running_unsub_task = (this.state.unsub && this.state.unsub.length > 0) || this.state.unsub === undefined;

    return (
      <div>  
        <Typography variant="h5" className={classes.title}>
          <SubscribedIcon className={classes.icon} /> <span>{LANG.subscribed}</span>
        </Typography>
        {this.generateSubscribed()}
    
        {is_running_unsub_task && <Typography variant="h5" className={classes.title}>
         <UnSubbedIcon className={classes.icon} /> <span>{LANG.other_running_tasks}</span>
        </Typography>}
        {this.generateUnSub()}

        {is_completed_tasks && <Typography variant="h5" className={classes.title}>
          <CompletedIcon className={classes.icon} /> <span>{LANG.completed_upper}</span>
        </Typography>}
        {this.generateOverTasks()}
      </div>
    );
  }

  emptyTask() {
    return (
      <EmptyMessage 
        main={LANG.empty_task_list}
        second={LANG.can_be_started_with_explorer}
        icon={TimelineIcon} 
      />
    );
  }

  loadingState() {
    return (
      <CenterComponent className={classes.loader}>
        <BigPreloader />
      </CenterComponent>
    );
  }

  get render_root() {
    const is_empty = this.state.subscribed.length === 0 && this.state.unsub && this.state.unsub.length === 0;

    if (this.state.unsub === null) {
      return this.loadingState();
    }
    else if (is_empty) {
      return this.emptyTask();
    }
    else if (this.state.open) {
      return <Container className={classes.root} key={this.state.key}>
        {this.generateTasks()}
      </Container>;
    }

    return "";
  }

  render() {
    return (
      <Dialog 
        fullScreen 
        open={this.state.open} 
        onClose={this.handleClose} 
        TransitionComponent={Transition}
        classes={{
          paper: classes.paper_base
        }}
      >
        <AppBar className={classes.app_bar}>
          <Toolbar className="background-flat-image-linear">
            <Typography variant="h6" className={classes.nav_title}>
              {LANG.tasks}
            </Typography>
            <Button color="inherit" onClick={this.handleClose}>
              {LANG.close}
            </Button>
          </Toolbar>
        </AppBar>

        {this.render_root}
      </Dialog>
    );
  }

  get over_tasks() {
    return this.state.subscribed.filter(t => t.percentage >= 100)
  }
}

