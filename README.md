# Product Return Request

## Team Members
- Mathew Budnik
- Kamaria Noble
- Sebastian Tamayo
- Manal Wadif
- Nicole Steffen

## Project Description
Customers currently request product returns via email or phone calls, requiring support staff to manually verify purchase dates against the 30-day policy and check final-sale eligibility. This manual process leads to delayed responses, repeated status inquiries, and duplicate requests from impatient customers.

The Product Return Request system lets a customer submit a single return request that is automatically validated against the 30-day return window and final-sale exclusions. Defective items valued over $200 are routed to a supervisor for approval, customers can track their request status, and transaction history is preserved for auditability.

## Repository Structure
```
backend/
├── returnRules.js           # business rules + input validation (pure logic, no AWS)
├── returnRules.test.js      # 20-case local test suite
└── TEST_RESULTS.md          # test suite results
docs/
├── 01-project-foundation/   # business problem/scope, team charter, GitHub evidence
├── 02-requirements/         # stakeholders, requirements, user stories, business rules
├── 03-system-design/        # main transaction, workflow, state model, data dictionary, architecture
├── 04-ui-accessibility/     # accessibility review (NFR-1, NFR-2, NFR-4)
└── 05-deployment/           # AWS deployment evidence + final test matrix
index.js                     # AWS Lambda HTTP adapter (POST + GET)
app.js / transaction-form.html / styles.css   # frontend
```

## System Design Artifacts
- [Transaction Workflow](docs/03-system-design/workflow-v1.pptx)
- [State Model](docs/03-system-design/state-model-v1.pptx)
- [Three-Tier Architecture & Responsibilities](docs/03-system-design/architecture-v1.pptx)
- [Data Dictionary](docs/03-system-design/data-dictionary.md)

## Deployment (AWS)
The Product Return Request system is deployed on AWS (Learner Lab, region `us-east-1`).

| Item | Link |
|---|---|
| Frontend (AWS Amplify) | https://staging.d1sg7ta5nv9m14.amplifyapp.com |
| API Gateway invoke URL | https://iqpj8rd7ff.execute-api.us-east-1.amazonaws.com |
| API routes | `POST /api/returns` (submit), `GET /api/returns/{returnId}` (look up by confirmation number) |
| Database | DynamoDB table `MIS3371-Returns` (partition key `returnId`) |
| Final test matrix (valid, invalid, business-rule, boundary, retrieval) | [aws-deployment-test-cases.pdf](docs/05-deployment/aws-deployment-test-cases.pdf) |
| Deployment evidence | [aws-deployment-evidence.md](docs/05-deployment/aws-deployment-evidence.md) |

Flow: Browser (Amplify) -> API Gateway (HTTP API) -> Lambda `MIS3371-ReturnRequest` (`index.js`) -> `backend/returnRules.js` for
business rules, and DynamoDB (`MIS3371-Returns`) to save and retrieve each return by its confirmation number.
All input validation and business rules run in Lambda.

To verify, open the frontend URL, submit a return, and look up the confirmation number it returns in the
"Check a Return Status" section. See the test matrix for the full set of cases.
The backend tests can also be run locally from the `backend` folder with `node returnRules.test.js`.
A local Express server (`local-server/`) is also available for running the full frontend + backend without AWS.
