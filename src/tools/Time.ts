
export default class Time {
  public static unit: 'ms' | 's' | 'm' | 'h' | 'd' | 'w' = 'ms';

  static ms(n: number) {
    switch (this.unit) {
      case 'ms':
        return n;
      case 's':
        return n * 1000;
      case 'm':
        return n * 1000 * 60;
      case 'h':
        return n * 1000 * 60 * 60;
      case 'd':
        return n * 1000 * 60 * 60 * 24;
      case 'w':
        return n * 1000 * 60 * 60 * 24 * 7;
    }
  }

  static seconds(n: number) {
    return 1000 * this.ms(n);
  }

  static minutes(n: number) {
    return 60 * this.seconds(n);
  }

  static hours(n: number) {
    return 60 * this.minutes(n);
  }

  static days(n: number) {
    return 24 * this.hours(n);
  }

  static weeks(n: number) {
    return 7 * this.days(n);
  }
}
