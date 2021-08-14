export interface ErrorReporter {
  report: (error: Error) => void;
}

export class ConsoleReporter implements ErrorReporter {
  public report(error: Error):void {
    console.log(error.message);
  }
}

export function reportErrorWithDefaultReporter(error: Error): void {
  return createDefaultErrorReporter().report(error);
}

export function createDefaultErrorReporter():ErrorReporter {
  return new ConsoleReporter();
}
