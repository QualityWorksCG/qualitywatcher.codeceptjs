export enum Status {
  Passed = "passed",
  Failed = "failed",
  Skipped = "skipped",
  Pending = "pending",
}

export interface QualityWatcherResult {
  case?: Case;
  suite_id: number;
  test_id: number;
  comment: String;
  status: Status;
  time: number;
}

export interface Case {
  suiteTitle: string;
  testCaseTitle: string;
  steps: string;
}

export interface QualityWatcherPayload {
  testRunName: string;
  description: string;
  include_all_cases: boolean;
  projectId: number;
  complete: boolean;
  suites: number[];
  results: QualityWatcherResult[];
}

export interface QualityWatcherOptions {
  url?: string;
  password: string;
  projectId: number;
}

export interface ReportOptions {
  projectId: number;
  testRunName: string;
  description: string;
  includeAllCases: boolean;
  complete: boolean;
  includeCaseWithoutId: boolean;
}
