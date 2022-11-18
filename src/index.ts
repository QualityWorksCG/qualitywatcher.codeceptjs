import { format } from "date-fns";
import { event, container, output } from 'codeceptjs';
import { ReportOptions, Status, QualityWatcherPayload } from "./qualitywatcher.interface";
import { QualityWatcher } from './qualitywatcher';
import { checkForEnvironmentalVariables, createTestData, getSuiteAndCaseIds, humanizeStep } from "./util";
const helpers = container.helpers();

const supportedHelpers = [
    'WebDriver',
    'Appium',
    'Nightmare',
    'Puppeteer',
    'Playwright',
    'TestCafe',
    'REST'
];

const defaultReporterOptions: ReportOptions = {
    projectId: null,
    description: '',
    testRunName: '',
    complete: false,
    includeAllCases: false,
    includeCaseWithoutId: false,
};

let helper;

for (const helperName of supportedHelpers) {
    if (Object.keys(helpers).indexOf(helperName) > -1) {
        helper = helpers[helperName];
    }
}

module.exports = function (config: {
    reporterOptions: ReportOptions;
}) {

    const options = Object.assign(defaultReporterOptions, config.reporterOptions);


    checkForEnvironmentalVariables();

    if (options.projectId === 0 || options.projectId === undefined) throw new Error('Please provide QualityWatcher projectId to the reporter options');
    if (options.testRunName === '') options.testRunName = `New test run on${format(new Date(), 'yyyy-MM-dd HH:mm:ss')};`
    if (options.description === '') options.description = 'CodeceptJS Test Run';

    let failedTests = [];
    const passedTests = [];
    const errors = {};
    const prefixTag = "@S";
    const prefixTagReg = /S\d+C\d+/;
    const defaultElapsedTime = '1000';
    const ids = [];

    event.dispatcher.on(event.test.started, async (test) => {
        if (test.body) {
            if (test.body.includes('addExampleInTable')) {
                const qTag = /"qualitywatcherTag":"(@S\d+C\d+)"/.exec(test.title);
                if (qTag) {
                    test.tags.push(qTag[1]);
                }
            }
        }
        test.startTime = Date.now();
    });

    const failedTestCaseIds = new Set();

    event.dispatcher.on(event.test.failed, async (test, err) => {
        test.endTime = Date.now();
        test.elapsed = Math.round(test.endTime - test.startTime);
        if (test.tags.length === 0 && options.includeCaseWithoutId) {
            // add testDetails
            const data = createTestData({
                case: {
                    suiteTitle: test.parent.title || 'CodeceptJS',
                    testCaseTitle: test.title,
                    steps: humanizeStep(test.step),
                },
                status: Status.Failed,
                duration: test.elapsed === 0 ? defaultElapsedTime : test.elapsed,
                error: err.message,
            });

            failedTests.push(data);

        } else {
            test.tags.forEach((tag) => {
                const qIds = getSuiteAndCaseIds(tag);
                if (prefixTagReg.test(tag)) {

                    if (!failedTestCaseIds.has(qIds.test_id)) {
                        // else it also failed on retry so we shouldnt add in a duplicate
                        failedTestCaseIds.add({
                            ...qIds,
                        });

                        // add testDetails
                        const data = createTestData({
                            testId: qIds.test_id,
                            suiteId: qIds.suite_id,
                            status: Status.Failed,
                            duration: test.elapsed === 0 ? defaultElapsedTime : test.elapsed,
                            error: err.message,
                        });

                        failedTests.push(data);
                    }
                    errors[tag.split(prefixTag)[1]] = err;
                }
            });
        }

    });

    event.dispatcher.on(event.test.passed, (test) => {
        test.endTime = Date.now();
        test.elapsed = Math.round(test.endTime - test.startTime);
        if (test.tags.length === 0 && options.includeCaseWithoutId) {
            // add testDetails
            const data = createTestData({
                case: {
                    suiteTitle: test.parent.title || 'CodeceptJS',
                    testCaseTitle: test.title,
                    steps: humanizeStep(test.steps),
                },
                status: Status.Passed,
                duration: test.elapsed === 0 ? defaultElapsedTime : test.elapsed,
            });

            passedTests.push(data);
        } else {
            test.tags.forEach(tag => {
                if (tag.includes(prefixTag)) {
                    const qIds = getSuiteAndCaseIds(tag);
                    // remove duplicates caused by retries
                    if (failedTestCaseIds.has({
                        test_id: qIds.test_id,
                    })) {
                        failedTests = failedTests.filter(({ test_id }) => test_id !== qIds.test_id);
                    }

                    // add testDetails
                    const data = createTestData({
                        testId: qIds.test_id,
                        suiteId: qIds.suite_id,
                        status: Status.Passed,
                        duration: test.elapsed === 0 ? defaultElapsedTime : test.elapsed,
                    });

                    passedTests.push(data);
                }
            });
        }
    });

    event.dispatcher.once(event.all.after, async () => {
        const mergedTests = failedTests.concat(passedTests);

        if (mergedTests.length === 0) {
            output.plugin('QualityWatcher', 'No tests found');
            return;
        }

        const payload = getPayload(options, mergedTests);

        const qualityWatcherOptions = {
            password: process.env.QUALITYWATCHER_API_KEY,
            projectId: options?.projectId,
        };

        try {
            const qualitywatcher = new QualityWatcher(qualityWatcherOptions);
            const response = await qualitywatcher.publishResults(payload);
        } catch (err) {
            output.error(err);
        }
    });
};

function getPayload(reporterOptions, results): QualityWatcherPayload {
    const suites = [...new Set(results.map((result) => result?.suite_id))].filter(Boolean) as number[];
    const body = {
        projectId: Number(reporterOptions?.projectId),
        include_all_cases: reporterOptions?.includeAllCases,
        testRunName: `${reporterOptions?.testRunName
            } automated test run - ${new Date()}`,
        description: reporterOptions?.description,
        suites,
        results: results,
        complete: reporterOptions?.complete,
    };

    return body;
}
