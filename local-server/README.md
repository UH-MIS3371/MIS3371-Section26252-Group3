# Local Server (Milestone 3)

Runs the exact same frontend (`transaction-form.html`, `styles.css`, `app.js`) and
backend (`backend/returnRules.js`) as the AWS deployment, but locally with no AWS
account or database needed. Returns are kept in an in-memory `Map` instead of
DynamoDB - same shape, just not persisted between restarts.

## Run it

```
cd local-server
npm install
npm start
```

Then open http://localhost:3000.

`app.js` automatically points at `http://localhost:3000/api/returns` when the page
is loaded from `localhost`/`127.0.0.1`, and at the deployed AWS API Gateway URL
everywhere else (including the live Amplify site), so no files differ between the
two environments.
