import io from 'socket.io-client';
import { SERVER_URL } from '../const';
import SETTINGS from './Settings';
import EventTarget, { defineEventAttribute } from 'event-target-shim';
import APIHELPER, { API_URLS } from './ApiHelper';
import { toast } from '../components/shared/Toaster/Toaster';
import LANG from '../classes/Lang/Language';

export interface TaskInformation extends TaskBaseMessage {
  percentage: number;
  done: number;
  remaining: number;
  failed: number;
  total: number;
  error?: string;
  type: TaskType;
  /** Twitter errors encountered. */
  twitter_errors?: { [code: string]: [number, string] };
  end_message?: boolean;
}

export interface TaskBaseMessage {
  id: string;
  type?: TaskType;
}

export interface TaskEnd extends TaskBaseMessage {
  errors?: { [code: string]: [number, string] };
}

export type TaskType = "tweet" | "mute" | "block";

interface TaskRequestError extends TaskBaseMessage {
  msg: string;
}

/*
type TaskMessageTypes = "task end" | "task cancel" | "progression" | "error";
*/

class TaskManager extends EventTarget {
  subscriptions: {
    [id: string]: TaskInformation
  } = {};

  protected socket: SocketIOClient.Socket;
  protected __ready: Promise<void>;
  protected on_login = false;
  protected reconnect_attemps = 0;

  socket_io_fail: boolean = false;

  constructor() {
    super();
    this.socket = io(SERVER_URL, { reconnectionAttempts: 5, autoConnect: false });
    this.resetSocketIo();
  }

  async start(ids: string[], type: TaskType) {
    if (ids.length === 0)
      return;

    try {
      const { status, task } = await APIHELPER.request(API_URLS.task_create, {
        method: 'POST',
        body_mode: 'json',
        parameters: { ids: ids.join(','), type }
      });
  
      if (status && task) {
        toast(LANG.task_started, "success");
  
        this.subscriptions[task] = {
          done: 0,
          total: ids.length,
          remaining: ids.length,
          percentage: 0,
          id: task,
          failed: 0,
          type
        };
  
        this.subscribe(task);
      }
      else {
        throw new Error("Unknown error");
      }
    } catch (e) {
      if (e && Array.isArray(e) && e[1].code === 13) {
        // Too many tasks
        toast(LANG.task_rate_limit, "error");
      }
      else {
        throw e;
      }
    }
  }

  emitError(things: any[]) {
    this.socket.emit('error log', things);
  }

  subscribe(id: string) {
    // console.log("Subscribing", id);
    this.socket.emit('task', id, SETTINGS.token);
    this.makeEvent('subscribe', { id });

    if (!this.socket.connected) {
      toast(LANG.connection_lost_subscribe, "warning");
    }
  }

  unsubscribe(id: string) {
    // console.log("Unsub", id);
    if (this.has(id))
      this.socket.emit('remove', id, SETTINGS.token);

    this.remove(id);
    this.makeEvent('unsubscribe', { id });
  }

  remove(id: string) {
    delete this.subscriptions[id];
    this.makeEvent('remove', { id });
  }

  has(id: string) {
    return id in this.subscriptions;
  }

  info(id: string) {
    return this.subscriptions[id];
  }

  async cancel(id: string) {
    if (this.has(id)) {
      this.remove(id);
    }

    await APIHELPER.request(API_URLS.task_destroy + `${id}`, { method: 'POST' });

    toast(LANG.task_cancelled, "info");
  }

  async stopAll() { 
    const ids = Object.keys(this.subscriptions);

    for (const id of ids) {
      this.remove(id);
    }

    await APIHELPER.request(API_URLS.task_destroy_all, { method: 'POST' });

    toast(LANG.tasks_stopped, "info");
  }

  /** All tasks running (even non subcribed). Fires APIErrors when failing to get tasks. */
  get all() : Promise<TaskInformation[]> {
    return APIHELPER.request(API_URLS.task_all);
  }

  protected refresh(id: string, data: TaskInformation) {
    // launch events...
    if (this.subscriptions[id]) {
      data = { ...this.subscriptions[id], ...data };
    }
    this.subscriptions[id] = data;
    this.makeEvent('progression', data);

    if (data.percentage >= 100 && !data.end_message) {
      toast(`${LANG.task} #${id} ${LANG.has_ended}.`, "success");
      data.end_message = true;
    }
  }

  get subscribed() {
    return Object.values(this.subscriptions);
  }

  get ready() {
    return this.__ready;
  }

  protected resetSocketIo(auto_reconnect = true) {
    this.socket.removeAllListeners(); // Do not fire disconnect
    this.socket.disconnect();
    this.socket_io_fail = false;

    if (auto_reconnect) {
      return this.initSocketIo();
    }
    else {
      return undefined;
    }
  }

  protected initSocketIo() {
    return this.__ready = new Promise((resolve, reject) => {
      this.on_login = true;
      this.socket.connect();

      // When connection is OK
      this.socket.on('connect', () => {
        this.reconnect_attemps = 0;
        if (!this.on_login && SETTINGS.has_server_errors) {
          toast(LANG.connection_reopened, "info");
        }

        resolve(); 
        this.on_login = false;
      });

      // On initial connection fail (after all attempts)
      this.socket.on('connect_error', () => { 
        reject(); 
        this.socket_io_fail = true; 
        this.on_login = false;
      });

      // On lost connection (listeners are removed before disconnect, in case of a reset)
      this.socket.on('disconnect', () => {
        if (SETTINGS.has_server_errors) {
          toast(LANG.connection_lost, "warning");
        }
      });

      // After all reconnecting attemps
      this.socket.on('reconnect_failed', () => {
        this.reconnect_attemps++;

        setTimeout(() => {
          this.socket.connect();
        }, 1000 * 10 * this.reconnect_attemps);
      });
    }).then(() => {
      // Apply all the listeners needed
      this.socket.on('progression', (task: TaskInformation) => {
        // console.log("Message received", task);

        this.refresh(task.id, task);
        if (task.error) {
          // Task is over, stopping
          console.error("Error task", task.error);
        }
      });

      this.socket.on('task error', (task: TaskRequestError) => {
        console.log("Error task", task);

        // Request a task, but it didn't exists / user not authorized
        this.remove(task.id);
      });

      this.socket.on('error', (e: any) => {
        console.log("Error unknown", e);
      });

      this.socket.on('task end', (task: TaskEnd) => {
        // console.log("Task end", task);

        if (this.has(task.id)) {
          const data = this.info(task.id);
          data.percentage = 100;
          
          if (task.errors && Object.keys(task.errors).length) {
            data.twitter_errors = task.errors;
            console.warn(
              `Twitter errors encountered in task #${task.id}:\n`, 
              Object.entries(task.errors)
                .map(([code, val]) => `[${val[0]} times]: Code ${code} (${val[1]})`)
                .join(',\n')
            );
          }
          this.refresh(task.id, data);
        }
      });

      this.socket.on('task cancel', (task: TaskBaseMessage) => {
        // console.log("Task cancelled", task);

        this.remove(task.id);
      });
    });
  }

  protected makeEvent(name: string, data: any) {
    this.dispatchEvent(new CustomEvent(name, { detail: data }));
  }
}

defineEventAttribute(TaskManager.prototype, 'subscribe');
defineEventAttribute(TaskManager.prototype, 'unsubscribe');
defineEventAttribute(TaskManager.prototype, 'remove');
defineEventAttribute(TaskManager.prototype, 'progression');

const Tasks = new TaskManager();
export default Tasks;

window.DEBUG.TaskManager = Tasks;
