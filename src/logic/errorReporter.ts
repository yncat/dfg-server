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
  public report(text: string): Promise<void> {
    const URL = process.env.SLACK_WEBHOOK_URL;
    if (URL === undefined || URL === "") {
      return;
    }
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
        return response.json();
      })
      .then((json) => {
        console.log(`Report to slack succeeded: ${JSON.stringify(json)}`);
      })
      .catch((reason: unknown) => {
        console.log(reason);
      });
  }
}

function convertError(error: Error): string {
  return error.message;
}

export function reportErrorWithDefaultReporter(error: Error): void {
  createDefaultTextReporter().report(convertError(error));
}

export function createDefaultTextReporter(): TextReporter {
  return new ConsoleReporter();
}
