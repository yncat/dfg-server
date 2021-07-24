export interface ErrorReporter {
  report: (message: string) => void;
}

export class ConsoleReporter implements ErrorReporter {
  public report(error: Error) {
    console.log(error.message);
  }
}

export function reportErrorWithDefaultReporter(error:Error):void{
  return createDefaultReporter().report(error);
}

export function createDefaultErrorReporter(){
  return new ConsoleReporter();
}
