export interface ErrorReporter {
  report: (message: string) => void;
}

export class ConsoleReporter implements ErrorReporter {
  public report(message: string) {
    console.log(message);
  }
}
