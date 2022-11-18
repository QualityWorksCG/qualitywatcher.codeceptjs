import stringify from "fast-safe-stringify";
import { Case, QualityWatcherResult, Status } from "./qualitywatcher.interface";

const REGEX_SUITE_AND_TEST_ID = /\bS(\d+)C(\d+)\b/g;

export const logger = (message) => {
    let messageOut =
        message instanceof Object ? stringify(message, null, 2) : message;
    console.log(`  ${messageOut}`);
};

export const msToTime = (ms) => {
    let seconds = Number((ms / 1000).toFixed(1));
    let minutes = Number((ms / (1000 * 60)).toFixed(1));
    let hours = Number((ms / (1000 * 60 * 60)).toFixed(1));
    let days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);
    if (seconds < 60) return seconds + "s";
    else if (minutes < 60) return minutes + "m";
    else if (hours < 24) return hours + "h";
    else return days + "d";
};

export const getBrowserInfo = (testResults) => {
    const { browserName, browserVersion, osName, osVersion, cypressVersion } =
        testResults;

    return `

**Browser Info:**

-----
> ${browserName}(${browserVersion}) on ${osName}(${osVersion})
> Cypress: ${cypressVersion}`;
};


export const checkForEnvironmentalVariables = () => {
    const missingEnvVars = [];
    if (!process.env.QUALITYWATCHER_API_KEY) {
        missingEnvVars.push("QUALITYWATCHER_API_KEY");
    }

    if (missingEnvVars?.length > 0) {
        const errorMessage = `Missing environmental variable/s: ${missingEnvVars.join(
            ", "
        )}`;
        logger(errorMessage);
        throw new Error(errorMessage);
    }
}

export const createTestData = (testResult: {
    case?: Case;
    suiteId?: number;
    testId?: number;
    status: string;
    duration: number;
    error?: string;
}): QualityWatcherResult => {
    const testData: QualityWatcherResult = {
        case: testResult?.case ? testResult.case : undefined,
        suite_id: testResult.suiteId ? testResult.suiteId : undefined,
        test_id: testResult.testId ? testResult.testId : undefined,
        status: testResult.status as Status,
        time: testResult.duration,
        comment: testResult.error,
    };
    return testData;
};

export const getSuiteAndCaseIds = (title) => {
    let suiteAndCaseIds;
    let suiteId;
    let caseId;
    while ((suiteAndCaseIds = REGEX_SUITE_AND_TEST_ID.exec(title)) != null) {
        suiteId = suiteAndCaseIds[1];
        caseId = suiteAndCaseIds[2];
    }
    return {
        suite_id: Number(suiteId),
        test_id: Number(caseId),
    };
}

export const humanizeStep = (steps: {
    name: string;
    actor: string;
    args: any[];
    prefix: string;
}[]) => {

    const humanizedSteps = steps.map((step) => {
        let humanizedStep = `${step.prefix} ${step.actor} ${camelToTitle(step.name)} `;
        if (step.args?.length > 0) {
            humanizedStep += `"${step.args.join(", ")}"`;
        }
        return humanizedStep;
    });

    return humanizedSteps.join('\n')
};

const camelToTitle = (camelCase) => camelCase
    .replace(/([A-Z])/g, (match) => ` ${match.toLowerCase()}`)
    .replace(/^./, (match) => match.toLowerCase())
    .trim()