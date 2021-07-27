export interface ErrorReporter {
  report: (error: Error) => void;
}

export class ConsoleReporter implements ErrorReporter {
  public report(error: Error) {
    console.log(error.message);
  }
}

export function reportErrorWithDefaultReporter(error: Error): void {
  return createDefaultErrorReporter().report(error);
}

export function createDefaultErrorReporter() {
  return new ConsoleReporter();
}
