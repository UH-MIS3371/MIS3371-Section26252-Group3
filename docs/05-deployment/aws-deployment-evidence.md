# DOCUMENT 10: AWS Deployment Evidence

**Deployed:** 2026-10-31
**AWS Academy Learner Lab region:** us-east-1

## Live URLs

- **Frontend (AWS Amplify):** https://staging.d1sg7ta5nv9m14.amplifyapp.com
- **API Gateway invoke URL:** https://iqpj8rd7ff.execute-api.us-east-1.amazonaws.com
- **API routes:** `POST /api/returns`, `GET /api/returns/{returnId}`

## Resources created

| Service | Name | Notes |
|---|---|---|
| AWS Lambda | `MIS3371-ReturnRequest` | Node.js, execution role `LabRole`, code = `index.js` + `backend/` |
| API Gateway | `MIS3371-ReturnRequest-API` | HTTP API, payload format 2.0, CORS enabled (`*` origin, `content-type` header, `POST`/`OPTIONS`) |
| AWS Amplify | `MIS3371-ProductReturn` | Manual ZIP deploy (no Git provider) of `index.html` (copy of `transaction-form.html`), `styles.css`, `app.js` |
| Amazon DynamoDB | `MIS3371-Returns` | On-demand capacity, partition key `returnId` (String); stores every submitted return and its outcome |

## Architecture

```
Browser (Amplify-hosted frontend)
  -> fetch() POST /api/returns
  -> API Gateway (HTTP API)
  -> AWS Lambda (index.js adapter)
  -> backend/returnRules.js (existing business logic, unchanged)
```

`index.js` is a thin HTTP adapter only: it reads the HTTP method and parses
`event.body`, calls `processReturnRequest()` exactly once, and maps the
result to an API Gateway response. All business rules remain in
`backend/returnRules.js`.

## Verification

- Lambda tested directly in the console with `backend/test-event-accepted.json`
  (200, approved) and `backend/test-event-rejected.json` (400, outside window).
- API Gateway endpoint tested directly via `curl` for both cases — matched the
  Lambda console results exactly.
- Full pipeline tested through the live Amplify URL for both an accepted case
  and the supervisor-approval case (defective item over $200), which is a
  rule the frontend never checks client-side — confirming the deployed
  frontend is genuinely calling the Lambda backend through API Gateway rather
  than deciding the outcome locally.
- See `docs/05-deployment/aws-deployment-test-cases.pdf` for the full set of
  predefined test cases (valid, invalid, business-rule, and boundary cases,
  plus API-level validation cases) and their expected outcomes.

## Redeployment (2026-11-07)

Several teammate commits (timezone fix, state-model fix, BR-2 input
validation, expanded tests) had been merged to `main` over the prior
week but never actually pushed to the live Lambda/Amplify — each
required a manual zip upload in the console, which hadn't happened.
Rebuilt both deployment packages from current `main` and redeployed:

- Lambda `MIS3371-ReturnRequest`: updated from a .zip file containing
  `index.js` + `backend/returnRules.js`.
- Amplify `MIS3371-ProductReturn` (branch `staging`): deployed updates
  from a .zip file containing `index.html` + `styles.css` + `app.js`.

Re-verified via `curl` against the live API Gateway endpoint (BR-2
final-sale/no case, future-date rejection, today's-date approval) and
a full live form submission on the deployed Amplify URL, confirming
the frontend's result panel reflects the backend's actual response.

## Milestone 4: DynamoDB persistence (2026-11-15)

Implements FR-4 (unique return ID + initial status) and FR-5 (show the
customer the current status of their return) from
`docs/02-requirements/functional-requirements.md`, and the `return_id`/
`status` fields documented in the Week 3 data dictionary since the
start of the project.

- Created DynamoDB table `MIS3371-Returns` (on-demand capacity,
  partition key `returnId`).
- Updated `index.js`: every `POST /api/returns` now generates a return
  ID (`RTN-<year>-<5 digits>`), saves the full request plus outcome to
  the table, and returns the ID to the caller. Status is mapped onto
  the documented state model (Approved / Pending Supervisor Review /
  Rejected). `backend/returnRules.js` is unchanged — all business
  rules still live there.
- Added route `GET /api/returns/{returnId}` on the existing API
  Gateway API, reusing the same Lambda integration as the POST route.
- Updated `app.js`/`transaction-form.html`: the result panel shows the
  confirmation number, and a new "Check a Return Status" section looks
  up a return by that number.

**Verification:**
- Lambda console test (POST): succeeded, persisted a record, and
  returned a `returnId`.
- Lambda console test (GET, using that `returnId`): retrieved the
  full stored record.
- `curl` POST against the live API Gateway endpoint, then `curl` GET
  with the returned `returnId`: round-tripped correctly, including a
  GET for a nonexistent ID correctly returning "not found."
- Live browser submission on the deployed Amplify URL, followed by a
  lookup using the confirmation number shown in the result panel:
  returned the correct stored status.
- Confirmed all three test records directly in the DynamoDB item
  explorer in the console.

## AWS Academy Learner Lab notes

- Account is a locked-down student sandbox (`voclabs` federated role),
  restricted to `us-east-1`/`us-west-2` and a documented service allowlist.
- IAM role creation is blocked; all resources above assume the pre-provisioned
  `LabRole` rather than a newly created execution role.
- AWS Amplify is not listed in the lab's "Service usage and other
  restrictions" panel, but was confirmed working directly in the console
  before building around it.
