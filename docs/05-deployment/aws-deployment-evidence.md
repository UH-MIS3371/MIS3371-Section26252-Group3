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
- See `docs/05-deployment/aws-deployment-test-cases.pdf` for the full set of
  six predefined test cases (valid, invalid, and both business-rule
  boundaries) and their expected outcomes.

## AWS Academy Learner Lab notes

- Account is a locked-down student sandbox (`voclabs` federated role),
  restricted to `us-east-1`/`us-west-2` and a documented service allowlist.
- IAM role creation is blocked; all resources above assume the pre-provisioned
  `LabRole` rather than a newly created execution role.
- AWS Amplify is not listed in the lab's "Service usage and other
  restrictions" panel, but was confirmed working directly in the console
  before building around it.
