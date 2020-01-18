import Tasks from "./Tasks";

const Logger = new class ErrorLogger {
  protected stack: any[] = [];

  // constructor() {
  //   setInterval(() => {
  //     this.emit();
  //   }, 1000 * 20); // Every 20 secs
  // }

  // eslint-disable-next-line
  push(...things: any[]) {
    // Disabled for now
    // this.stack.push(...things);
  }

  protected emit() {
    if (this.stack.length) {
      try {
        Tasks.emitError(this.stack);
      } catch (e) { }
    }
    this.stack = [];
  }
}();

export default Logger;
