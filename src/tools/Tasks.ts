import io from 'socket.io-client';
import { SERVER_URL } from '../const';
import SETTINGS from './Settings';
import EventTarget, { defineEventAttribute } from 'event-target-shim';
import APIHELPER from './ApiHelper';
import { toast } from '../components/shared/Toaster/Toaster';

export interface TaskInformation extends TaskBaseMessage {
  percentage: number;
  done: number;
  remaining: number;
  failed: number;
  total: number;
  error?: string;
}

export interface TaskBaseMessage {
  id: string;
}

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

  socket_io_fail: boolean = false;

  constructor() {
    super();
    this.socket = io(SERVER_URL, { reconnectionAttempts: 10, autoConnect: false });
    this.resetSocketIo();
  }

  async start(tweets_ids: string[]) {
    if (tweets_ids.length === 0)
      return;

    const { status, task } = await APIHELPER.request('tasks/create.json', {
      method: 'POST',
      body_mode: 'json',
      parameters: { tweets: tweets_ids.join(',') }
    });

    if (status && task) {
      toast("Task has been started.", "success");

      this.subscriptions[task] = {
        done: 0,
        total: tweets_ids.length,
        remaining: tweets_ids.length,
        percentage: 0,
        id: task,
        failed: 0
      };

      this.subscribe(task);
    }
    else {
      throw "Unknown error";
    }
  }

  subscribe(id: string) {
    console.log("Subscribing", id);
    this.socket.emit('task', id, SETTINGS.token);
    this.makeEvent('subscribe', { id });
  }

  unsubscribe(id: string) {
    console.log("Unsub", id);
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

    await APIHELPER.request(`tasks/destroy/${id}.json`, { method: 'POST' });

    toast("Task has been cancelled.", "info");
  }

  async stopAll() { 
    const ids = Object.keys(this.subscriptions);

    for (const id of ids) {
      this.remove(id);
    }

    await APIHELPER.request('tasks/destroy/all.json', { method: 'POST' });

    toast("All tasks has been stopped.", "info");
  }

  /** All tasks running (even non subcribed). Fires APIErrors when failing to get tasks. */
  get all() : Promise<TaskInformation[]> {
    return APIHELPER.request('tasks/details/all');
  }

  protected refresh(id: string, data: TaskInformation) {
    // launch events...
    this.subscriptions[id] = data;
    this.makeEvent('progression', data);

    if (data.percentage >= 100) {
      toast(`Task #${id} has ended.`, "success");
    }
  }

  get subscribed() {
    return Object.values(this.subscriptions);
  }

  get ready() {
    return this.__ready;
  }

  protected resetSocketIo(auto_reconnect = true) {
    this.socket.disconnect();
    this.socket.removeAllListeners();
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
      this.socket.connect();
      this.socket.on('connect', resolve);
      this.socket.on('connect_error', () => { 
        reject(); 
        this.socket_io_fail = true; 
      });
    }).then(() => {
      // Apply all the listeners needed
      this.socket.on('progression', (task: TaskInformation) => {
        console.log("Message received", task);

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

      this.socket.on('task end', (task: TaskBaseMessage) => {
        console.log("Task end", task);

        if (this.has(task.id)) {
          this.info(task.id).percentage = 100;
        }
      });

      this.socket.on('task cancel', (task: TaskBaseMessage) => {
        console.log("Task cancelled", task);

        this.remove(task.id);
      });
    });
  }

  protected makeEvent(name: string, data: any) {
    this.dispatchEvent(new CustomEvent(name, { detail: data }));
  }
};

defineEventAttribute(TaskManager.prototype, 'subscribe');
defineEventAttribute(TaskManager.prototype, 'unsubscribe');
defineEventAttribute(TaskManager.prototype, 'remove');
defineEventAttribute(TaskManager.prototype, 'progression');

const Tasks = new TaskManager;
export default Tasks;

window.DEBUG.tasks = Tasks;
