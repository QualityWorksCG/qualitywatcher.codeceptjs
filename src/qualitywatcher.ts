import {
  QualityWatcherOptions,
  QualityWatcherPayload,
} from "./qualitywatcher.interface";
import * as Axios from "axios";
import colors from "colors/safe";
import { logger } from "./util";

export class QualityWatcher {
  private url: String;
  private options: QualityWatcherOptions;

  constructor(options: QualityWatcherOptions) {
    this.options = options;
    this.url =
      "https://api.qualitywatcher.com/prod/nimble/v1/test-runner/add-automated-test-execution";
  }

  public async publishResults(payload: QualityWatcherPayload) {
    logger(
      colors.green(colors.bold(`(${colors.underline("QualityWatcher")})\n`))
    );
    logger(colors.grey("-  Publishing results..."));
    try {
      const response = await Axios.default.request({
        method: "post",
        url: `${this.url}`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bear ${this.options.password}`,
        },
        data: JSON.stringify(payload),
      });
      logger(
        `${colors.grey("-  Results published: ")} ${colors.green(
          `${response?.data?.link || "See QualityWatcher for details"}`
        )}`
      );
    } catch (error) {
      logger(colors.red(`-  There was an error publishing results: ${error}`));
      if (error?.response) {
        const { data } = error?.response;
        if (data.error.code === 400) {
          logger(colors.red(`-  Bad Request: ${data.error.message}`));
          return;
        } else {
          logger(colors.red(`-  ${data.error.message}`));
          return;
        }
      } else {
        if (error.status === 500) {
          logger(colors.red(`- Ensure that your API key is correct.`));
          return;
        }
      }
    }
  }
}

