# QualityWatcher Reporter for CodeceptJS

Publishes [CodeceptJS](https://codecept.io/) runs on QualityWatcher.

## Install

```shell
npm install @qualitywatcher/codeceptjs-reporter -save-dev
```

## Usage


1. Get API Key from QualityWatcher  
 
    1. Go to your QualityWatcher account
    2. Hover over your profile avatar and click "Profile Settings"
    3. Select the "API Key" menu item
    4. Click the "Generate API Key" button
    5. Copy your API Key, we will use this for posting the results


2. Create a .env file in the root of your project and add API KEY, or update an existing .env


        ```shell
        touch .env
        echo "QUALITYWATCHER_API_KEY=[API Key]" >> .env

        # For windows:
        # type NUL > .env
        # echo QUALITYWATCHER_API_KEY=[API Key]  > .env
        ```


3. Install [dotenv](https://www.npmjs.com/package/dotenv) and require it in your plugin file (if you don't have this already)

        ```ts
        import * as dotenv from 'dotenv';

        //...

        dotenv.config();
        ```

> Include dotenv in "codecept.conf.ts"

4. Add QualityWatcher has a CodeceptJS plugin in `codecept.conf.ts`


        ```ts
        // codecept.conf.ts

        //...
        plugins: {
            qualitywatcher: {
            enabled: true,
            require: '@qualitywatcher/codeceptjs-reporter',
            reporterOptions: {
                projectId: 1,
                testRunName: 'CodeceptJS',
                description: 'CodeceptJS test run',
                includeAllCases: true,
                complete: true,
                includeCaseWithoutId: true
            }
          },
        },
        //...

        ```

5. Send reports to QualityWatcher

    a. Update your CodeceptJS tests to include the IDs of your QualityWatcher suite and test case that they belongs to. You should include this as a tag. Example `@S#C#`

    ```ts
        Scenario('@S1C1 Verify login with valid username and password', ({ I }) => {
             I.amOnPage('/');
             // ...
        });
    ```

    b. You can also send results to QualityWatcher by running as tests as normal without including any test suite and case ID

> Once `includeCaseWithoutId` is configured to `true`, test cases that doesn't have a mapped SUITE and CASE ID, they will automatically be created in QualityWatcher