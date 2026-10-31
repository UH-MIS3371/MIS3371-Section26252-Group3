# DOCUMENT 10: AWS Deployment Evidence

**Deployed:** 2026-10-31
**AWS Academy Learner Lab region:** us-east-1

## Live URLs

- **Frontend (AWS Amplify):** https://staging.d1sg7ta5nv9m14.amplifyapp.com
- **API Gateway invoke URL:** https://iqpj8rd7ff.execute-api.us-east-1.amazonaws.com
- **API route:** `POST /api/returns`

## Resources created

| Service | Name | Notes |
|---|---|---|
| AWS Lambda | `MIS3371-ReturnRequest` | Node.js, execution role `LabRole`, code = `index.js` + `backend/` |
| API Gateway | `MIS3371-ReturnRequest-API` | HTTP API, payload format 2.0, CORS enabled (`*` origin, `content-type` header, `POST`/`OPTIONS`) |
| AWS Amplify | `MIS3371-ProductReturn` | Manual ZIP deploy (no Git provider) of `index.html` (copy of `transaction-form.html`), `styles.css`, `app.js` |

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
- Final-sale rejection (BR-2) also tested live and through `curl` directly
  against API Gateway — same item approved when `finalSale` is `"No"`,
  rejected when `"Yes"`.
- See `docs/05-deployment/aws-deployment-test-cases.pdf` for the full set of
  seven predefined test cases (valid, invalid for each of BR-1/BR-2/BR-3,
  and both BR-4 boundaries) and their expected outcomes.

## BR-2 follow-up (2026-10-31)

Kamaria's PR #3 (`kamaria/price-final-sale-fields`) added the Item Price and
Final Sale fields to the form and flagged that backend enforcement was still
needed — `docs/02-requirements/business-rules.md` documents BR-2 ("final-sale
items are not returnable"), which had never actually been implemented
anywhere in the project. Merged via `gh pr merge` (merge commit, not squash,
so her original commit stays attributed in history), then implemented in
`backend/returnRules.js` and redeployed to both Lambda and Amplify.

## AWS Academy Learner Lab notes

- Account is a locked-down student sandbox (`voclabs` federated role),
  restricted to `us-east-1`/`us-west-2` and a documented service allowlist.
- IAM role creation is blocked; all resources above assume the pre-provisioned
  `LabRole` rather than a newly created execution role.
- AWS Amplify is not listed in the lab's "Service usage and other
  restrictions" panel, but was confirmed working directly in the console
  before building around it.
