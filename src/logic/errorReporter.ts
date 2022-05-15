import fetch from "node-fetch";

export interface TextReporter {
  report: (text: string) => void;
}

export class ConsoleReporter implements TextReporter {
  public report(text: string): void {
    console.log(text);
  }
}

export class SlackReporter implements TextReporter {
  public report(text: string): void {
    if (!slackIsAvailable) {
      return;
    }
    const URL = process.env.SLACK_WEBHOOK_URL;
    const body = { text: text };
    fetch(URL, {
      method: "post",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `reporting to slack failed with http status ${response.status}`
          );
        }
        return response.blob();
      })
      .then(() => {})
      .catch((reason: unknown) => {
        console.log(reason);
      });
  }
}

function convertError(error: Error): string {
  return `${error.message}\nstacktrace:\n${error.stack}`;
}

export function reportErrorWithDefaultReporter(error: Error): void {
  createDefaultTextReporter().report(convertError(error));
}

export function reportTextWithDefaultReporter(text: string): void {
  createDefaultTextReporter().report(text);
}

export function slackIsAvailable(): boolean {
  return (
    process.env.SLACK_WEBHOOK_URL !== undefined &&
    process.env.SLACK_WEBHOOK_URL !== ""
  );
}

export function createDefaultTextReporter(): TextReporter {
  if (!slackIsAvailable()) {
    return new ConsoleReporter();
  }

  return process.env.NODE_ENV === "production"
    ? new SlackReporter()
    : new ConsoleReporter();
}

export function catchErrors(block: () => void): void {
  try {
    block();
  } catch (e) {
    reportErrorWithDefaultReporter(e as Error);
  }
}
