# Test Cases — Test Results & Quality — Redmineflux DevOps

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_devops |
| **Module** | Test Results & Quality |
| **TC Range** | TC-RDV-256 to TC-RDV-290 |
| **Total TCs** | 35 |
| **Requirement Coverage** | TEST-001, TEST-002, TEST-003, TEST-004, TEST-005, TEST-006 |
| **Feature Coverage** | rfd-020, rfd-021, rfd-087, rfd-088, rfd-089, rfd-114 |

---

## TC-RDV-256 — Test results display passed, failed, and skipped counts on build detail page

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Results Integration (rfd-020) |
| **Requirement Ref** | TEST-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #321 exists for the "Phoenix Platform" project
- JUnit XML has been ingested for Build #321 with 47 passed, 3 failed, 5 skipped test cases

**Test Data:**
- Build: #321
- Passed: 47, Failed: 3, Skipped: 5
- Total: 55

**Steps:**
1. Navigate to Project → DevOps → Builds
2. Click on Build #321 to open the build detail page
3. Scroll to the "Test Results" section

**Expected Result:**
- The Test Results section displays: "47 passed, 3 failed, 5 skipped"
- The counts are visually distinct (e.g., passed in green, failed in red, skipped in gray)
- A summary bar or donut chart may optionally reflect the distribution
- The section heading or badge clearly identifies this as test result data

---

## TC-RDV-257 — Failed tests show expandable error messages and stack traces

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Results Integration (rfd-020) |
| **Requirement Ref** | TEST-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #321 has 3 failed test cases with error messages and stack traces stored in `redmineflux_devops_test_results`

**Test Data:**
- Failed test 1: `com.example.CartServiceTest#testEmptyCheckout` — error: "NullPointerException at CartService.java:142", stack trace: 8 lines
- Failed test 2: `com.example.PaymentTest#testCardDeclined` — error: "AssertionError: expected [200] but was [500]"
- Failed test 3: `com.example.UserTest#testEmailValidation` — error: "org.junit.ComparisonFailure: expected: 'valid@test.com' was: 'null'"

**Steps:**
1. Navigate to Project → DevOps → Builds → Build #321 → Test Results
2. Locate the list of failed tests
3. Click on `testEmptyCheckout` to expand it
4. Observe the error details
5. Repeat for `testCardDeclined` and `testEmailValidation`

**Expected Result:**
- All 3 failed tests are listed under a "Failed Tests" section
- Each failed test row is expandable (click to expand/collapse)
- Expanded view shows the full error message (e.g., "NullPointerException at CartService.java:142")
- Expanded view shows the full stack trace in a monospace/code font
- Each test row includes the test class name and test method name

---

## TC-RDV-258 — JUnit XML is parsed correctly via REXML

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Results Integration (rfd-020) |
| **Requirement Ref** | TEST-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #322 has been created in Redmine
- A JUnit XML file with a standard testsuites/testsuite/testcase structure is posted via webhook to `POST /devops/builds/322/test_results`

**Test Data:**
- JUnit XML snippet:
  ```xml
  <testsuites>
    <testsuite name="CartServiceTest" tests="3" failures="1" time="1.23">
      <testcase name="testAddItem" classname="com.example.CartServiceTest" time="0.45"/>
      <testcase name="testEmptyCheckout" classname="com.example.CartServiceTest" time="0.31">
        <failure message="NullPointerException">at CartService.java:142</failure>
      </testcase>
      <testcase name="testRemoveItem" classname="com.example.CartServiceTest" time="0.47"/>
    </testsuite>
  </testsuites>
  ```

**Steps:**
1. Send the JUnit XML payload via POST to `POST /devops/builds/322/test_results` with the correct authentication header
2. Navigate to Build #322 detail page → Test Results section

**Expected Result:**
- 3 test cases are ingested: `testAddItem` (passed), `testEmptyCheckout` (failed), `testRemoveItem` (passed)
- `test_name` = "testEmptyCheckout", `test_class` = "com.example.CartServiceTest"
- `error_message` = "NullPointerException", `stack_trace` = "at CartService.java:142"
- `duration_ms` is populated from the `time` attribute (e.g., 310 ms for 0.31 s)
- The REXML parser handles the XML without error

---

## TC-RDV-259 — JUnit ingestion uses bulk insert in batches of 500

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Results Integration (rfd-020) |
| **Requirement Ref** | TEST-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #323 exists
- A JUnit XML containing 1,200 test cases is available for ingestion

**Test Data:**
- Build: #323
- Test cases in XML: 1,200 (all passed)

**Steps:**
1. Send the large JUnit XML (1,200 test cases) via POST to `/devops/builds/323/test_results`
2. Monitor database insertion (via logs or direct DB query if available)
3. Navigate to Build #323 → Test Results

**Expected Result:**
- All 1,200 test cases are ingested successfully
- The `TestResultIngester` service inserts records in batches of 500 (observed via logs showing 3 batch operations: 500 + 500 + 200)
- The total count on Build #323 shows 1,200 passed tests
- No timeouts or memory errors occur during batch ingestion

---

## TC-RDV-260 — Testcase count cap: 5,000 maximum with truncation warning

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Results Integration (rfd-020) |
| **Requirement Ref** | TEST-001 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Build #324 exists
- A JUnit XML containing 5,500 test cases is submitted for ingestion

**Test Data:**
- Build: #324
- Test cases in XML: 5,500

**Steps:**
1. Send the JUnit XML with 5,500 test cases to `/devops/builds/324/test_results`
2. Check the server logs for a truncation warning
3. Navigate to Build #324 → Test Results and observe the count

**Expected Result:**
- Only the first 5,000 test cases are ingested (cap enforced)
- A warning is logged: e.g., "WARNING: Test result count (5500) exceeds maximum (5000); truncated to 5000"
- The Test Results section shows 5,000 test results (not 5,500)
- No server error is thrown; the response indicates partial ingestion with a warning

---

## TC-RDV-261 — Idempotency: duplicate JUnit ingestion does not create duplicate records

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Results Integration (rfd-020) / JUnit Ingestion REST Endpoint (rfd-104) |
| **Requirement Ref** | TEST-001 |
| **Priority** | High |
| **Scenario Type** | Edge |

**Preconditions:**
- Build #322 already has test results ingested from TC-RDV-258

**Test Data:**
- Same JUnit XML as TC-RDV-258
- Same `ingestion_key` SHA256 digest (same payload)

**Steps:**
1. Re-send the identical JUnit XML to `POST /devops/builds/322/test_results` (same payload as before)
2. Navigate to Build #322 → Test Results

**Expected Result:**
- The second ingestion is recognized as a duplicate via `ingestion_key` SHA256 digest
- No duplicate test result records are created in `redmineflux_devops_test_results`
- The response indicates idempotent success (e.g., HTTP 200 with a message "Already processed")
- The test result count on Build #322 remains unchanged (3 tests, not 6)

---

## TC-RDV-262 — Test coverage trend: coverage percentage displayed with trend arrow and sparkline

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Coverage Tracking (rfd-021) |
| **Requirement Ref** | TEST-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- 5 builds exist with coverage data in `redmineflux_devops_coverage_reports`:
  - Build #310: 72%, Build #315: 74%, Build #318: 73%, Build #320: 76%, Build #321: 78%

**Test Data:**
- Coverage trend: 72% → 74% → 73% → 76% → 78% (trending up)

**Steps:**
1. Navigate to Project → DevOps → (Coverage or Metrics section, or the project dashboard widget)
2. Locate the "Test Coverage" widget or section
3. Observe the coverage percentage, trend arrow, and sparkline chart

**Expected Result:**
- Current coverage is displayed as "78%"
- A trend arrow (up) is shown indicating coverage is increasing
- A sparkline SVG chart is rendered showing the coverage trend over the 5 recent builds
- The `CoverageTrend` service has computed the trend correctly

---

## TC-RDV-263 — Coverage reports table is populated from webhook data

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Coverage Tracking (rfd-021) |
| **Requirement Ref** | TEST-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #325 exists and a coverage webhook payload (e.g., from Codecov) is received

**Test Data:**
- Webhook payload: `{ "coverage": 81.5, "build_id": 325, "commit_sha": "abc123ef" }`

**Steps:**
1. Send a coverage webhook payload to the appropriate endpoint (e.g., `POST /devops/webhook/codecov/phoenix-platform`)
2. Navigate to Project → DevOps → Coverage page or the coverage widget

**Expected Result:**
- A new record is added to `redmineflux_devops_coverage_reports` for Build #325
- Coverage percentage "81.5%" appears in the coverage trend chart and widget
- The record is associated with commit SHA "abc123ef"

---

## TC-RDV-264 — Failed test "Create Issue" button pre-fills subject and description

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Failed Test Auto-Create Issue (rfd-087) |
| **Requirement Ref** | TEST-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #321 has a failed test: `testEmptyCheckout` with error "NullPointerException at CartService.java:142" and a 5-line stack trace
- User B (QA role) is logged in

**Test Data:**
- Failed test: `com.example.CartServiceTest#testEmptyCheckout`
- Error: "NullPointerException at CartService.java:142"
- Stack trace: "at CartService.java:142\nat CartService.java:98\nat CartController.java:55"

**Steps:**
1. Log in as User B (QA)
2. Navigate to Project → DevOps → Builds → Build #321 → Test Results
3. Expand the failed test `testEmptyCheckout`
4. Click the "Create Issue" button on the `testEmptyCheckout` row
5. Observe the new issue creation form that opens

**Expected Result:**
- The new issue form is pre-filled with:
  - Subject: "Test failure: com.example.CartServiceTest#testEmptyCheckout" (or similar descriptive subject)
  - Description contains the error message "NullPointerException at CartService.java:142"
  - Description contains the full stack trace
- The issue form is pre-populated; the user can still edit before saving

---

## TC-RDV-265 — Duplicate issue detection: existing linked issue shown instead of creating new one

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Failed Test Auto-Create Issue (rfd-087) |
| **Requirement Ref** | TEST-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #321 has a failed test `testEmptyCheckout`
- A Redmine issue #999 "Test failure: testEmptyCheckout" was previously created and linked to this test result in `redmineflux_devops_test_issue_links`

**Test Data:**
- Failed test: `testEmptyCheckout`
- Existing linked issue: #999

**Steps:**
1. Navigate to Project → DevOps → Builds → Build #321 → Test Results
2. Expand the failed test `testEmptyCheckout`
3. Observe the "Create Issue" button area

**Expected Result:**
- The "Create Issue" button is replaced with a link to the existing issue: e.g., "Issue #999 (open)"
- Clicking the link navigates to issue #999 in Redmine
- A second identical issue is NOT offered for creation (deduplication via `redmineflux_devops_test_issue_links`)

---

## TC-RDV-266 — TestTagParser parses issue IDs from test names for traceability

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test-Requirement Traceability (rfd-088) |
| **Requirement Ref** | TEST-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #326 has been ingested with test cases that include issue ID tags in their names
- Test names contain Redmine issue references

**Test Data:**
- Test name: `testLoginFlow [#101] [#205]` — references issues #101 and #205
- Test name: `testPaymentGateway [#301]` — references issue #301
- Test name: `testProfileUpdate` — no issue reference

**Steps:**
1. Ingest the JUnit XML for Build #326 with the above test names via webhook
2. Navigate to Project → DevOps → Traceability (or the traceability matrix page)

**Expected Result:**
- The `TestTagParser` service parses "[#101]", "[#205]", and "[#301]" from the test names
- `issue_tags` column for `testLoginFlow` is set to "101,205"
- `issue_tags` column for `testPaymentGateway` is set to "301"
- `issue_tags` for `testProfileUpdate` is empty or null (no false positives)

---

## TC-RDV-267 — Traceability matrix shows issue-to-test-case mapping correctly

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test-Requirement Traceability (rfd-088) |
| **Requirement Ref** | TEST-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- TestTagParser has already linked tests to issues (from TC-RDV-266 data)
- Issues #101, #205, #301 exist in the "Phoenix Platform" project

**Test Data:**
- Issue #101 → tested by: `testLoginFlow` (passed)
- Issue #205 → tested by: `testLoginFlow` (passed)
- Issue #301 → tested by: `testPaymentGateway` (failed, Build #326)

**Steps:**
1. Navigate to Project → DevOps → Traceability (or the traceability matrix view)
2. Review the matrix rows and columns

**Expected Result:**
- The matrix shows each issue as a row with linked test cases
- Issue #101 row shows `testLoginFlow` with a "Passed" status indicator
- Issue #301 row shows `testPaymentGateway` with a "Failed" status indicator
- The matrix accurately reflects the latest test result per test case

---

## TC-RDV-268 — Traceability matrix CSV export

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test-Requirement Traceability (rfd-088) |
| **Requirement Ref** | TEST-004 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Traceability matrix has data from TC-RDV-267

**Test Data:**
- N/A (uses existing traceability data)

**Steps:**
1. Navigate to Project → DevOps → Traceability
2. Click the "Export CSV" button
3. Download and open the CSV file

**Expected Result:**
- A CSV file is downloaded with columns for Issue ID, Issue Subject, Test Name, Latest Status
- Data matches the traceability matrix display
- The file is UTF-8 encoded and opens correctly in spreadsheet software

---

## TC-RDV-269 — Traceability CSV export prevents formula injection

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test-Requirement Traceability (rfd-088) |
| **Requirement Ref** | TEST-004 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- A test case named `=HYPERLINK("http://evil.com","Click")` exists with a test result (simulating a malicious test name that could inject a formula into a CSV)

**Test Data:**
- Test name: `=HYPERLINK("http://evil.com","Click")` — CSV formula injection payload

**Steps:**
1. Ingest a JUnit XML with the malicious test name
2. Navigate to Project → DevOps → Traceability
3. Export CSV
4. Open the CSV in a spreadsheet application (e.g., Excel or LibreOffice Calc)

**Expected Result:**
- The formula injection is neutralized; the test name is wrapped in the delimiter-surrounded format (e.g., `",=HYPERLINK(...),"`) or the `=` is escaped/prefixed
- No formula executes in the spreadsheet
- The test name appears as a literal string in the cell

---

## TC-RDV-270 — Test execution history shows pass/fail over last 30 builds

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Execution History (rfd-089) |
| **Requirement Ref** | TEST-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Test `com.example.CartServiceTest#testAddItem` has been run in 35 builds with results stored
- Results: builds #290–#321: all passed; build #308, #314: failed

**Test Data:**
- Test: `testAddItem`
- History: 35 builds available; last 30 shown (builds #292 to #321)
- Failures at build #308 (within last 30) and #314 (within last 30)

**Steps:**
1. Navigate to Project → DevOps → Builds → select a build with `testAddItem` result
2. Click on the test name `testAddItem` to open the test detail/history page
3. Observe the execution history

**Expected Result:**
- The test history page shows a chart/timeline of pass/fail for exactly the last 30 builds (HISTORY_LIMIT = 30)
- Build #308 and #314 are shown as failures in the history
- All other build entries in the last 30 show as passed
- The history is ordered chronologically (oldest to newest or newest to oldest)

---

## TC-RDV-271 — Test execution history renders an SVG sparkline

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Execution History (rfd-089) |
| **Requirement Ref** | TEST-005 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Test `testAddItem` has execution history data as per TC-RDV-270

**Test Data:**
- Test: `testAddItem`

**Steps:**
1. Navigate to the test history page for `testAddItem`
2. Inspect the sparkline chart in the browser's developer tools or view the page source

**Expected Result:**
- An SVG element is present in the page for the sparkline
- The SVG contains visual representations of pass/fail data points
- The SVG renders correctly in supported browsers without JavaScript errors

---

## TC-RDV-272 — Test duration shown with 99th-percentile capping

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Execution History (rfd-089) |
| **Requirement Ref** | TEST-005 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Test `testPaymentGateway` has 30 historical runs; 28 runs completed in 200–400ms; 2 outlier runs took 45,000ms (45s) due to a network timeout

**Test Data:**
- P99 threshold: ~400ms (after excluding the 2 outliers at 45,000ms)
- Outlier durations: 45,000ms (2 occurrences)

**Steps:**
1. Navigate to the test history page for `testPaymentGateway`
2. Observe the duration chart/axis scale and values

**Expected Result:**
- The duration chart axis is capped at approximately the 99th-percentile value (~400ms), not at 45,000ms
- The 2 outlier data points are either capped visually at the P99 ceiling or shown with a special "outlier" indicator
- The chart remains readable and the main distribution is clearly visible
- The stated purpose (preventing outlier distortion) is met

---

## TC-RDV-273 — TestDurationStats computes suite duration trend and slowest-N tests

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Duration Monitoring (rfd-114) |
| **Requirement Ref** | TEST-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- 5 recent builds have test suite duration data:
  - Build #317: 120s, Build #318: 125s, Build #319: 130s, Build #320: 135s, Build #321: 180s (50% slower than baseline of ~120s)
- Individual test durations are available for Build #321

**Test Data:**
- Suite trend: 120s → 125s → 130s → 135s → 180s
- Slowest tests in Build #321: `testDatabaseLoad` (45s), `testFileExport` (32s), `testReportGeneration` (28s)

**Steps:**
1. Navigate to Project → DevOps → (Test Duration or Metrics section)
2. Observe the suite duration trend chart
3. Look for the "Slowest Tests" table or section

**Expected Result:**
- The suite duration trend chart shows the progression from 120s to 180s
- Build #321 (180s) is highlighted as it is 50%+ slower than the baseline (120s)
- The "Slowest Tests" list shows the top N slowest tests in the most recent build, starting with `testDatabaseLoad` at 45s

---

## TC-RDV-274 — Test suites 50% slower than baseline are highlighted

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Duration Monitoring (rfd-114) |
| **Requirement Ref** | TEST-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Baseline suite duration: 120s (average of previous 10 builds)
- Build #321 suite duration: 180s (50% over baseline)
- Build #320 suite duration: 135s (12.5% over baseline — below highlight threshold)

**Test Data:**
- Baseline: 120s
- Build #321: 180s (threshold exceeded)
- Build #320: 135s (threshold not exceeded)

**Steps:**
1. Navigate to Project → DevOps → (Test Duration monitoring section)
2. Observe the build entries in the duration trend

**Expected Result:**
- Build #321 (180s) is visually highlighted (e.g., red row, warning icon, or "Slow" badge)
- Build #320 (135s) is NOT highlighted (12.5% above baseline, below 50% threshold)
- The highlighting threshold is exactly 50% above baseline as per `TestDurationStats` logic

---

## TC-RDV-275 — Test duration monitoring REST endpoint returns programmatic data

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Duration Monitoring (rfd-114) |
| **Requirement Ref** | TEST-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Test duration data exists for the "Phoenix Platform" project
- A valid Redmine API key is available for User D (DevOps Engineer)

**Test Data:**
- API endpoint: `GET /projects/phoenix-platform/devops/test_duration_stats.json`
- API key: valid (User D)

**Steps:**
1. Send `GET /projects/phoenix-platform/devops/test_duration_stats.json` with header `X-Redmine-API-Key: [valid-key]`
2. Inspect the JSON response

**Expected Result:**
- HTTP 200 response
- JSON response includes suite duration trend data (array of build durations)
- JSON response includes slowest-N test list with test name and duration
- Response structure is suitable for programmatic access (e.g., by MCP agents or CI dashboards)

---

## TC-RDV-276 — JUnit XML with XXE payload is rejected safely

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Results Integration (rfd-020) |
| **Requirement Ref** | TEST-001 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Build #327 exists
- A malicious JUnit XML file with an XXE (XML External Entity) payload is prepared

**Test Data:**
- XXE JUnit XML payload:
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE testsuites [
    <!ENTITY xxe SYSTEM "file:///etc/passwd">
  ]>
  <testsuites>
    <testsuite name="&xxe;" tests="1">
      <testcase name="testXXE" classname="evil.Test"/>
    </testsuite>
  </testsuites>
  ```

**Steps:**
1. Send the XXE JUnit XML payload to `POST /devops/builds/327/test_results`
2. Observe the server response
3. Check that the contents of `/etc/passwd` (or any other file) were NOT included in any server response or stored in the database

**Expected Result:**
- The request is rejected or the XXE entity is not resolved
- The REXML parser (or the ingestion layer) processes the XML without expanding the external entity
- No file system access occurs
- The response is either a 400 Bad Request (malformed XML) or the entity reference is treated as a literal string
- No server error (500) is thrown; the application remains stable

---

## TC-RDV-277 — Empty test suite (0 tests) is handled gracefully

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Results Integration (rfd-020) |
| **Requirement Ref** | TEST-001 |
| **Priority** | Low |
| **Scenario Type** | Edge |

**Preconditions:**
- Build #328 exists
- A valid JUnit XML with 0 test cases is submitted

**Test Data:**
- JUnit XML: `<testsuites><testsuite name="EmptySuite" tests="0"/></testsuites>`

**Steps:**
1. Send the empty JUnit XML to `POST /devops/builds/328/test_results`
2. Navigate to Build #328 → Test Results section

**Expected Result:**
- The ingestion request returns HTTP 200 (no error)
- No test result records are created in `redmineflux_devops_test_results`
- The Build #328 Test Results section shows "0 passed, 0 failed, 0 skipped" or a message "No test results for this build"
- No division-by-zero errors or unhandled exceptions occur in the display logic

---

## TC-RDV-278 — Test with a very long name is displayed without breaking layout

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Results Integration (rfd-020) |
| **Requirement Ref** | TEST-001 |
| **Priority** | Low |
| **Scenario Type** | Edge |

**Preconditions:**
- Build #329 has a failed test with a very long name

**Test Data:**
- Test name: `com.example.services.payment.gateway.integration.stripe.v3.StripePaymentGatewayIntegrationServiceTest#testCompletePaymentWorkflowWithRetryLogicAndFallbackMechanismForDeclinedCardsInEuropeanUnionRegion` (180 characters)

**Steps:**
1. Ingest the JUnit XML with the long test name via webhook for Build #329
2. Navigate to Build #329 → Test Results → Failed Tests
3. Observe how the long test name is displayed in the test results table

**Expected Result:**
- The page renders without horizontal scrollbar overflow or broken table layout
- The long test name is either truncated with an ellipsis (...) and full name shown on hover/tooltip, or wrapped gracefully within the cell
- No layout breakage in the Test Results section

---

## TC-RDV-279 — Test coverage trend shows down arrow when coverage declines

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Coverage Tracking (rfd-021) |
| **Requirement Ref** | TEST-002 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Recent builds show declining coverage: Build #317: 82%, Build #318: 80%, Build #319: 78%, Build #320: 75%, Build #321: 71%

**Test Data:**
- Coverage trend: 82% → 80% → 78% → 75% → 71% (declining)

**Steps:**
1. Navigate to Project → DevOps → Coverage widget
2. Observe the trend indicator

**Expected Result:**
- Current coverage is displayed as "71%"
- A down-arrow trend indicator is shown (indicating declining coverage)
- The sparkline SVG shows a descending line from 82% to 71%

---

## TC-RDV-280 — Test results ingestion rate limit: 10 events per 60 seconds per project

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | JUnit Ingestion REST Endpoint (rfd-104) |
| **Requirement Ref** | TEST-001 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- Build IDs #330–#345 exist for "Phoenix Platform"
- The rate limit is 10 events per 60 seconds per project

**Test Data:**
- Send 11 sequential JUnit ingestion requests within 60 seconds for builds #330–#340

**Steps:**
1. Send 10 JUnit XML ingestion requests in rapid succession (within 60 seconds) for builds #330–#339
2. Immediately send an 11th request for build #340

**Expected Result:**
- The first 10 requests return HTTP 200 (success)
- The 11th request returns HTTP 429 Too Many Requests
- A retry-after header or similar rate limit indicator is included in the 429 response
- The server remains stable after the rate limit triggers

---

## TC-RDV-281 — Failed test issue creation: QA can use "Create Issue" button

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Failed Test Auto-Create Issue (rfd-087) |
| **Requirement Ref** | TEST-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- Build #321 has 3 failed tests
- User B (QA role) is logged in with `view_devops` permission

**Test Data:**
- User B: role = QA

**Steps:**
1. Log in as User B (QA)
2. Navigate to Build #321 → Test Results
3. Click "Create Issue" on the `testCardDeclined` failed test

**Expected Result:**
- Per the permissions matrix, QA role has the ability to create issues
- The Redmine new issue form opens pre-populated with the test failure details
- User B can save the issue successfully

---

## TC-RDV-282 — Test results are not visible to non-project members

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Results Integration (rfd-020) |
| **Requirement Ref** | TEST-001 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- Build #321 belongs to "Phoenix Platform" project
- User K is logged in but is NOT a member of "Phoenix Platform"

**Test Data:**
- User K: non-member of "Phoenix Platform"

**Steps:**
1. Log in as User K
2. Attempt to navigate to `GET /projects/phoenix-platform/devops/builds/321` or the test results endpoint

**Expected Result:**
- Response is HTTP 403 Forbidden or redirect to error page
- No test result data is exposed to non-project members
- The `view_devops` permission gate is enforced

---

## TC-RDV-283 — Traceability matrix: untagged tests show no requirement links

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test-Requirement Traceability (rfd-088) |
| **Requirement Ref** | TEST-004 |
| **Priority** | Low |
| **Scenario Type** | Edge |

**Preconditions:**
- Build #326 has test `testProfileUpdate` which has NO issue ID tags in its name

**Test Data:**
- Test name: `testProfileUpdate` — no `[#xxx]` tags

**Steps:**
1. Navigate to Project → DevOps → Traceability
2. Look for `testProfileUpdate` in the traceability matrix

**Expected Result:**
- `testProfileUpdate` does NOT appear as linked to any issue in the traceability matrix
- No false positive issue links are created for untagged tests
- The test may appear in a "Untraced Tests" section (if the UI provides this) or simply not appear in the matrix

---

## TC-RDV-284 — Test execution history limited to exactly 30 builds (HISTORY_LIMIT)

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Execution History (rfd-089) |
| **Requirement Ref** | TEST-005 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Test `testAddItem` has results stored for 50 consecutive builds (#271–#321)

**Test Data:**
- Builds with results: 50 total (#271–#321)
- HISTORY_LIMIT: 30

**Steps:**
1. Navigate to the test history page for `testAddItem`
2. Count the number of data points shown in the history chart

**Expected Result:**
- Exactly 30 data points are shown (the most recent 30 builds: #292–#321)
- Builds #271–#291 are NOT included in the history display
- No pagination or "Load More" is needed (the limit is enforced by the service)

---

## TC-RDV-285 — Test duration REST endpoint requires authentication

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Duration Monitoring (rfd-114) |
| **Requirement Ref** | TEST-006 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- The test duration REST endpoint exists at `GET /projects/phoenix-platform/devops/test_duration_stats.json`

**Test Data:**
- Request: no `X-Redmine-API-Key` header and no session cookie

**Steps:**
1. Send `GET /projects/phoenix-platform/devops/test_duration_stats.json` with no authentication headers

**Expected Result:**
- Response is HTTP 401 Unauthorized or HTTP 403 Forbidden
- No test duration data is returned in the response body

---

## TC-RDV-286 — Test results ingestion endpoint requires authentication

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | JUnit Ingestion REST Endpoint (rfd-104) |
| **Requirement Ref** | TEST-001 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Build #330 exists

**Test Data:**
- Request: POST to `/devops/builds/330/test_results` with a valid JUnit XML body but no `X-Redmine-API-Key` header

**Steps:**
1. Send a JUnit XML POST request to `/devops/builds/330/test_results` with no authentication
2. Observe the response

**Expected Result:**
- Response is HTTP 401 or HTTP 403
- No test records are ingested for Build #330
- The endpoint is protected by `accept_api_auth` per rfd-004

---

## TC-RDV-287 — Test coverage widget shows "No Data" when no builds with coverage exist

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Coverage Tracking (rfd-021) |
| **Requirement Ref** | TEST-002 |
| **Priority** | Low |
| **Scenario Type** | Edge |

**Preconditions:**
- A brand new project "Orion API" with zero builds and no coverage reports in `redmineflux_devops_coverage_reports`

**Test Data:**
- Project: "Orion API"
- Coverage reports: 0

**Steps:**
1. Navigate to the "Orion API" project → DevOps → Coverage widget or page

**Expected Result:**
- The coverage widget renders without an error
- A "No coverage data available" empty state message is shown
- No percentage or trend arrow is displayed (no data to show)
- The SVG sparkline is either absent or renders a flat/empty chart

---

## TC-RDV-288 — JUnit ingestion: `rake ingest_junit` task works as an alternative ingestion path

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | JUnit Ingestion REST Endpoint (rfd-104) |
| **Requirement Ref** | TEST-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #331 exists
- A valid JUnit XML file is available on the server at `/tmp/junit_results.xml`
- Rake tasks are accessible on the Redmine server

**Test Data:**
- Build ID: 331
- JUnit file: `/tmp/junit_results.xml` (10 tests, all passed)

**Steps:**
1. Run the rake task: `bundle exec rake ingest_junit BUILD_ID=331 FILE=/tmp/junit_results.xml`
2. Navigate to Build #331 → Test Results

**Expected Result:**
- The rake task completes without errors
- 10 test results are ingested for Build #331
- The Test Results section for Build #321 shows "10 passed, 0 failed, 0 skipped"

---

## TC-RDV-289 — Test history page loads for a test that has never failed

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test Execution History (rfd-089) |
| **Requirement Ref** | TEST-005 |
| **Priority** | Low |
| **Scenario Type** | Edge |

**Preconditions:**
- Test `testStaticConfig` has been run in 20 builds and has passed every time

**Test Data:**
- Test: `testStaticConfig`
- History: 20 builds, all passed

**Steps:**
1. Navigate to the test history page for `testStaticConfig`

**Expected Result:**
- The history page loads successfully (HTTP 200)
- All 20 data points in the history chart show "passed"
- The sparkline renders as a flat line at the "pass" level
- No error is thrown for an all-pass history

---

## TC-RDV-290 — Traceability matrix CSV correctly handles test names containing commas

| Field | Value |
|-------|-------|
| **Module** | Test Results & Quality |
| **Feature** | Test-Requirement Traceability (rfd-088) |
| **Requirement Ref** | TEST-004 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- A test result exists with a test name containing a comma: `testOrder,Payment [#101]`

**Test Data:**
- Test name: `testOrder,Payment [#101]`

**Steps:**
1. Navigate to Project → DevOps → Traceability
2. Export CSV
3. Open the downloaded CSV file in a text editor and spreadsheet application

**Expected Result:**
- The CSV properly quotes the test name: `"testOrder,Payment [#101]"` to prevent the comma from being interpreted as a delimiter
- The spreadsheet renders the test name in a single cell, not split across two cells
- The issue link (#101) is preserved in the same row
