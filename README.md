# VeriVote — Cloud + Blockchain E‑Polling (Public Repository)

VeriVote is a secure, transparent e‑voting platform that combines blockchain immutability with cloud services to provide verifiable, tamper‑resistant online polling. This repository is the public version; the production frontend is built and hosted from a private repository.

Live frontend
- https://verivote-frontend.netlify.app/

Important deployment notes- The backend API is hosted on Render. The first request after an idle period may take ~30 seconds while the service cold‑boots.- This public repo does not contain private AWS credentials or some production secrets — use your own AWS keys and configuration when deploying. Do NOT commit secrets.

Key capabilities
- Tamper‑evident vote recording via blockchain (smart contracts record votes).
- Cloud user authentication and management using AWS Cognito.
- Document summarization and chatbot capabilities powered by an AWS SageMaker hosted distil‑BART model.
  - The same SageMaker model is used to summarize documents and to respond in the chatbot.
  - A News API collects news for a keyword and forwards it to the SageMaker endpoint for summarization.
- Storage of assets and data using AWS S3.
- Frontend (Netlify) and backend (Render) separation for scalability and ease of deployment.

Tech stack overview
- Frontend: JavaScript/React (deployed to Netlify)
- Backend: Node.js/Express (deployed to Render)
- Blockchain: Solidity smart contracts (Ethereum-compatible) and supporting tooling
- Cloud: AWS (S3, Cognito, SageMaker), News API for news ingestion
- Note: MongoDB is NOT used in this project — the data layer relies on cloud services and blockchain.

Getting started (developer quick start)
1) Clone the repo

   git clone https://github.com/ArvindNandigam/VeriVote-Cloud-blockchain-web-based-e-polling.git
   cd VeriVote-Cloud-blockchain-web-based-e-polling

2) Install dependencies (frontend and backend directories may be separate — run where appropriate)

   npm install

3) Environment variables
Create a .env file for the backend (example variables — update to match your stack):

   # AWS
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=your_aws_region
   S3_BUCKET_NAME=your_s3_bucket_name

   # Cognito
   COGNITO_USER_POOL_ID=your_user_pool_id
   COGNITO_CLIENT_ID=your_client_id

   # SageMaker
   SAGEMAKER_ENDPOINT_NAME=your_sagemaker_endpoint_name

   # News API
   NEWS_API_KEY=your_news_api_key

   # Blockchain / RPC provider
   RPC_PROVIDER_URL=https://your-eth-rpc.example
   PRIVATE_KEY=your_deployer_or_service_account_private_key

   # Backend host (if needed)
   BACKEND_URL=https://your-backend.example.com

4) Run locally
- Backend: npm run dev (or follow scripts in package.json)
- Frontend: npm start (or follow the frontend package.json scripts)

Security and privacy notes- Use your own AWS keys and credentials. Never commit secrets or keys into source control.- Cognito is used for authentication — ensure correct configuration of user pools and secure callback URLs.- Votes are recorded on-chain for tamper resistance; always protect any private keys used for contract interactions.

Known issues
1) Race / duplicate vote bug (Bug 1)
- Description: Spamming the vote action while database and blockchain transactions are still pending can sometimes result in extra votes being recorded.
- Reproduction steps (client):
  1. Open a poll and authenticate as a user.
  2. Click the Vote button repeatedly while the app waits for the backend and blockchain transactions to complete.
  3. Observe that more than one vote may be recorded in some cases.
- Root cause (likely): The client currently allows multiple vote requests to be issued before previous transactions are confirmed and the system lacks a fully idempotent server-side check for the same voter+poll transaction. Pending asynchronous database and chain writes can result in duplicated records.
- Suggested mitigations / fixes:
  - Client-side: disable the Vote button immediately after the first click and show a pending state until both DB and on‑chain confirmations return. Implement debounce or rate‑limit on voting actions.
  - Server-side: implement idempotency checks using a unique vote token (voter id + poll id + nonce) and reject duplicate submissions. Use database-level constraints or atomic operations to prevent duplicate vote records.
  - Blockchain: record a unique vote ID onchain and ensure the backend cross-checks onchain state before accepting/confirming a vote.
  - Short-term workaround: avoid repeatedly clicking Vote; wait for the confirmation message.

Deployment notes- Frontend: deployed to Netlify (see live frontend URL above). - Backend: hosted on Render; expect a cold start delay (~30s) for the first request after idle. - SageMaker: model endpoints are used for summarization; ensure endpoints are warmed or scale them to avoid cold starts for inference.

Contributing
- This is the public version of the repository. If you want to contribute, fork this repo and open a pull request. The live web deployment is handled from a private repository.
- Before submitting changes, ensure you do not include any private keys or credentials.

Contact
- Email: nandigamarvind@gmail.com

