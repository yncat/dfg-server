import fetch from "node-fetch";

export interface TextReporter {
  report: (text: string) => Promise<void>;
}

export class ConsoleReporter implements TextReporter {
  public report(text: string): Promise<void> {
    return new Promise<void>((resolve) => {
      console.log(text);
      resolve();
    });
  }
}

export class SlackReporter implements TextReporter {
  public async report(text: string): Promise<void> {
    if (!slackIsAvailable) {
      return;
    }
    const URL = process.env.SLACK_WEBHOOK_URL;
    const body = { text: text };
    const response = await fetch(URL, {
      method: "post",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error(
        `reporting to slack failed with http status ${response.status}`
      );
    }
    await response.blob();
  }
}

function convertError(error: Error): string {
  return `${error.message}\nstacktrace:\n${error.stack}`;
}

export function reportErrorWithDefaultReporter(error: Error): Promise<void> {
  return createDefaultTextReporter().report(convertError(error));
}

export function reportTextWithDefaultReporter(text: string): Promise<void> {
  return createDefaultTextReporter().report(text);
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
    void reportErrorWithDefaultReporter(e as Error);
  }
}
