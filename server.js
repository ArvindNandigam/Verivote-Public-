import dotenv from "dotenv";
import express from "express";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import mammoth from "mammoth";
import { ethers } from "ethers";

import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  DeleteCommand,
  QueryCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import cors from "cors";
import crypto from "crypto";
import jwksClient from "jwks-rsa";
import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";

AWS.config.update({ region: "ap-south-1" });

// SageMaker runtime clients
const runtime = new AWS.SageMakerRuntime();
const sagemakerRuntime = new AWS.SageMakerRuntime({ region: "ap-south-1" });

dotenv.config();

const app = express();
app.use(cors({
  origin: ['https://verivote-frontend.netlify.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options("*", cors());
app.use(bodyParser.json({ limit: "20mb" }));
app.use(express.json());

// ----------------- AWS SDK v3 Clients -----------------
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// ----------------- Helper: SecretHash -----------------
function generateSecretHash(username) {
  return crypto
    .createHmac("SHA256", process.env.COGNITO_CLIENT_SECRET)
    .update(username + process.env.COGNITO_CLIENT_ID)
    .digest("base64");
}

// Helper function to extract text from PDF or DOCX
async function extractTextFromFile(base64, filename) {
  const buffer = Buffer.from(base64, "base64");
  const ext = filename.split(".").pop().toLowerCase();

  try {
    if (ext === "pdf") {
      const data = await pdfParse(buffer);
      return data.text;
    } else if (ext === "docx") {
      const { value } = await mammoth.extractRawText({ buffer });
      return value;
    } else if (ext === "txt") {
      return buffer.toString("utf-8");
    } else {
      return ""; // unsupported file type
    }
  } catch (err) {
    console.error("Text extraction error:", err);
    return "";
  }
}

// ----------------- Helper: Generate Signed URL -----------------
const generateSignedUrl = async (key, expiresIn = 60) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn }); // expiresIn seconds
  } catch (err) {
    console.error("Signed URL error:", err);
    return null;
  }
};

// ----------------- JWT Middleware -----------------
const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "No token provided" });
  jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Unauthorized" });
    req.user = decoded;
    next();
  });
}

// ----------------- Error Helper -----------------
function handleError(res, status, message, err) {
  console.error(message, err);
  res.status(status).json({ error: message, details: err?.message || err });
}

// ----------------- Auth Routes -----------------
app.post("/signup", async (req, res) => {
  const { username, preferred_username, email, password, name, birthdate, phone_number } = req.body;
  if (!username || !preferred_username || !email || !password || !name || !birthdate || !phone_number) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const command = new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: username,
      Password: password,
      SecretHash: generateSecretHash(username),
      UserAttributes:
        [
          { Name: "email", Value: email },
          { Name: "phone_number", Value: phone_number },
          { Name: "name", Value: name },
          { Name: "birthdate", Value: birthdate },
          { Name: "preferred_username", Value: preferred_username },
        ],
    });
    const result = await cognitoClient.send(command);
    res.json({ message: "Signup successful", result });
  } catch (err) {
    handleError(res, 400, "Signup error", err);
  }
});

app.post("/confirm", async (req, res) => {
  const { username, code } = req.body;
  if (!username || !code) return res.status(400).json({ error: "username and code are required" });
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: username,
      ConfirmationCode: code,
      SecretHash: generateSecretHash(username),
    });
    await cognitoClient.send(command);
    res.json({ message: "Account confirmed successfully!" });
  } catch (err) {
    handleError(res, 400, "Confirm error", err);
  }
});

app.post("/resend", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "username is required" });
  try {
    const command = new ResendConfirmationCodeCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: username,
      SecretHash: generateSecretHash(username),
    });
    await cognitoClient.send(command);
    res.json({ message: "Confirmation code resent successfully!" });
  } catch (err) {
    handleError(res, 400, "Resend error", err);
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "username and password are required" });
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: { USERNAME: username, PASSWORD: password, SECRET_HASH: generateSecretHash(username) },
    });
    const result = await cognitoClient.send(command);
    res.json({
      message: "Login successful",
      accessToken: result.AuthenticationResult.AccessToken,
      idToken: result.AuthenticationResult.IdToken,
      refreshToken: result.AuthenticationResult.RefreshToken,
      username,
    });
  } catch (err) {
    handleError(res, 400, "Login error", err);
  }
});

// ----------------- Election Routes -----------------
app.post("/elections", verifyToken, async (req, res) => {
  const { name, candidates, type, password, expiration, attachmentBase64, attachmentName } = req.body;
  if (!name || !candidates || !type) return res.status(400).json({ error: "Missing fields: name, candidates, or type" });
  if (type === "private" && !password) return res.status(400).json({ error: "Private elections require a password" });

  const ElectionId = Math.random().toString(36).substring(2, 12).toUpperCase();
  const accessCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  const creatorId = req.user.sub;

  let attachmentUrl = null;

  if (attachmentBase64 && attachmentName) {
    const buffer = Buffer.from(attachmentBase64, "base64");
    const s3Key = `attachments/${ElectionId}/${encodeURIComponent(attachmentName)}`;
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: "application/pdf",
      }));
      attachmentUrl = s3Key;
    } catch (err) {
      console.error("S3 Upload Error:", err);
    }
  }

  const electionItem = {
    ElectionId,
    name,
    candidates,
    type,
    accessCode,
    password: type === "private" ? password : null,
    creatorId,
    expiration: expiration || null,
    attachmentUrl,
    attachmentName,
  };

  try {
    await docClient.send(new PutCommand({ TableName: process.env.ELECTIONS_TABLE, Item: electionItem }));
    res.json({ message: "Election created successfully", election: electionItem });
  } catch (err) {
    handleError(res, 500, "Election creation error", err);
  }
});

app.get("/elections", verifyToken, async (req, res) => {
  try {
    const data = await docClient.send(new ScanCommand({ TableName: process.env.ELECTIONS_TABLE }));

    // Only show public elections or ones created by the current user
    const filtered = data.Items.filter(
      (e) => e.type === "public" || e.creatorId === req.user.sub
    );

    // Map elections: remove password and generate signed URL for attachments
    const safeElections = await Promise.all(
      filtered.map(async (e) => {
        const { password, attachmentUrl: key, ...rest } = e;
        let signedUrl = null;
        if (key) {
          signedUrl = await generateSignedUrl(key, 100000);
        }
        return { ...rest, attachmentUrl: signedUrl };
      })
    );

    res.json(safeElections);
  } catch (err) {
    handleError(res, 500, "Fetch elections error", err);
  }
});

app.get("/election/:code", verifyToken, async (req, res) => {
  const { code } = req.params;
  try {
    let electionData = await docClient.send(new GetCommand({ TableName: process.env.ELECTIONS_TABLE, Key: { ElectionId: code } }));
    if (!electionData.Item) {
      const scanData = await docClient.send(new ScanCommand({
        TableName: process.env.ELECTIONS_TABLE,
        FilterExpression: "accessCode = :c",
        ExpressionAttributeValues: { ":c": code },
      }));
      if (scanData.Items.length === 0) return res.status(404).json({ error: "Election not found" });
      electionData.Item = scanData.Items[0];
    }

    // Generate signed URL for attachment
    if (electionData.Item.attachmentUrl) {
      electionData.Item.attachmentUrl = await generateSignedUrl(electionData.Item.attachmentUrl, 60);
    }

    res.json(electionData.Item);
  } catch (err) {
    handleError(res, 500, "Fetch election error", err);
  }
});

// ----------------- Voting -----------------
import fs from "fs";
import path from "path";

// Load compiled contract
const voteArtifact = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "Vote.json"), "utf8")
);

// Connect to Sepolia via Alchemy provider
const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);

// Create signer using private key in .env for Sepolia
const signer = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);

// Attach contract with signer
const voteContract = new ethers.Contract(process.env.VOTE_CONTRACT_ADDRESS, voteArtifact.abi, signer);

app.post("/vote", verifyToken, async (req, res) => {
  const { ElectionId, CandidateId, Password } = req.body;
  const voterId = req.user.sub;

  if (!CandidateId || !ElectionId) 
    return res.status(400).json({ error: "CandidateId and ElectionId required" });

  try {
    // Fetch election from DB
    const electionRes = await docClient.send(new GetCommand({ TableName: process.env.ELECTIONS_TABLE, Key: { ElectionId } }));
    if (!electionRes.Item) return res.status(404).json({ error: "Election not found" });
    const election = electionRes.Item;

    if (election.type === "private" && election.password !== Password)
      return res.status(403).json({ error: "Invalid password for private election" });

    if (election.expiration && new Date(election.expiration) < new Date())
      return res.status(400).json({ error: "Election has expired" });

    // Check if voter has already voted
    const existingVote = await docClient.send(new QueryCommand({
      TableName: process.env.VOTES_TABLE,
      IndexName: "ElectionVoterIndex",
      KeyConditionExpression: "ElectionId = :e AND VoterId = :v",
      ExpressionAttributeValues: { ":e": ElectionId, ":v": voterId }
    }));
    if (existingVote.Items.length > 0)
      return res.status(400).json({ error: "You have already voted" });

    // Hash the vote before storing
    const voteHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${ElectionId}-${CandidateId}-${voterId}`)
    );

    // Send transaction; ethers.js will handle nonce automatically
    let tx;
    try {
      tx = await voteContract.storeVote(voteHash);
      await tx.wait(); // Wait for confirmation
    } catch (err) {
      // Handle "already known" error gracefully
      if (
        (err.code === 'UNKNOWN_ERROR' || err.code === -32000 || err.code === 'CALL_EXCEPTION') &&
        (err?.error?.message === "already known" || err?.info?.error?.message === "already known")
      ) {
        return res.status(409).json({ error: "Transaction already submitted and pending" });
      }
      // Handle insufficient funds error
      if (
        err.code === 'INSUFFICIENT_FUNDS' ||
        err?.info?.error?.message?.includes("insufficient funds")
      ) {
        return res.status(402).json({ error: "Insufficient funds to pay for this transaction's gas fee" });
      }
      throw err; // Other error
    }

    // Store vote in DynamoDB as usual
    await docClient.send(new PutCommand({
      TableName: process.env.VOTES_TABLE,
      Item: {
        VoteID: uuidv4(),
        ElectionId,
        CandidateId,
        VoterId: voterId,
        voteHash,
        timestamp: Date.now()
      }
    }));

    res.json({ message: "Vote recorded successfully on DB and blockchain!" });
  } catch (err) {
    handleError(res, 500, "Vote error", err);
  }
});



// ----------------- Results -----------------
app.get("/results/:code", verifyToken, async (req, res) => {
  const { code } = req.params;
  const userId = req.user.sub;

  try {
    let electionData = await docClient.send(new GetCommand({ TableName: process.env.ELECTIONS_TABLE, Key: { ElectionId: code } }));
    if (!electionData.Item) {
      const scanData = await docClient.send(new ScanCommand({
        TableName: process.env.ELECTIONS_TABLE,
        FilterExpression: "accessCode = :c",
        ExpressionAttributeValues: { ":c": code },
      }));
      if (scanData.Items.length === 0) return res.status(404).json({ error: "Election not found" });
      electionData.Item = scanData.Items[0];
    }

    // Generate signed URL for attachment
    if (electionData.Item.attachmentUrl) {
      electionData.Item.attachmentUrl = await generateSignedUrl(electionData.Item.attachmentUrl, 60);
    }

    const canView = electionData.Item.type === "public" || electionData.Item.creatorId === userId;

    const votesData = await docClient.send(new ScanCommand({
      TableName: process.env.VOTES_TABLE,
      FilterExpression: "ElectionId = :e",
      ExpressionAttributeValues: { ":e": electionData.Item.ElectionId },
    }));

    const results = {};
    votesData.Items.forEach(v => {
      results[v.CandidateId] = (results[v.CandidateId] || 0) + 1;
    });

    res.json({ election: electionData.Item, results, canView });
  } catch (err) {
    handleError(res, 500, "Results error", err);
  }
});

// ----------------- Delete Election -----------------
app.delete("/elections/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub;

  try {
    const electionRes = await docClient.send(new GetCommand({ TableName: process.env.ELECTIONS_TABLE, Key: { ElectionId: id } }));
    if (!electionRes.Item) return res.status(404).json({ error: "Election not found" });

    if (electionRes.Item.creatorId !== userId) return res.status(403).json({ error: "You are not allowed to delete this election" });

    await docClient.send(new DeleteCommand({ TableName: process.env.ELECTIONS_TABLE, Key: { ElectionId: id } }));

    const votesData = await docClient.send(new ScanCommand({ TableName: process.env.VOTES_TABLE, FilterExpression: "ElectionId = :e", ExpressionAttributeValues: { ":e": id } }));

    if (votesData.Items.length > 0) {
      const deleteRequests = votesData.Items.map(v => ({ DeleteRequest: { Key: { VoteID: v.VoteID } } }));
      while (deleteRequests.length > 0) {
        const chunk = deleteRequests.splice(0, 25);
        await docClient.send(new BatchWriteCommand({ RequestItems: { [process.env.VOTES_TABLE]: chunk } }));
      }
    }

    res.json({ message: "Election and related votes deleted successfully" });
  } catch (err) {
    handleError(res, 500, "Delete election error", err);
  }
});

// ----------------- Summarize Endpoint -----------------
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
const lambdaClient = new LambdaClient({ region: "ap-south-1" });

app.post("/summarize", async (req, res) => {
  try {
    const { attachmentUrl, attachmentName } = req.body;
    if (!attachmentUrl || !attachmentName)
      return res.status(400).json({ error: "Missing attachmentUrl or attachmentName" });

    const lambdaPayload = {
      body: JSON.stringify({ attachmentUrl, attachmentName }),
    };

    const command = new InvokeCommand({
      FunctionName: "extract-and-summarize",
      Payload: Buffer.from(JSON.stringify(lambdaPayload)),
    });

    const response = await lambdaClient.send(command);

    const payloadString = Buffer.from(response.Payload).toString("utf-8");
    const lambdaResult = JSON.parse(payloadString);

    const result = lambdaResult.body ? JSON.parse(lambdaResult.body) : lambdaResult;

    res.json(result);
  } catch (err) {
    console.error("Lambda invocation failed:", err);
    res.status(500).json({ error: "Lambda invocation failed", details: err.message });
  }
});

// ----------------- Chat with News + Summarize -----------------
import fetch from "node-fetch";
import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime";

const NEWS_API_KEY = process.env.NEWSAPI_KEY || "";

async function fetchPageText(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const html = await res.text();
    const text = html.replace(/<script.*?>.*?<\/script>/gis, '')
                     .replace(/<style.*?>.*?<\/style>/gis, '')
                     .replace(/<[^>]+>/g, ' ')
                     .replace(/\s+/g, ' ')
                     .trim();
    return text;
  } catch (err) {
    console.warn('Failed to fetch page text:', url, err.message);
    return '';
  }
}

app.post('/chat', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  try {
    const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${NEWS_API_KEY}&pageSize=3`;
    const newsRes = await fetch(newsUrl);
    if (!newsRes.ok) throw new Error(`NewsAPI request failed: ${newsRes.status}`);
    const newsData = await newsRes.json();

    const topArticles = newsData.articles || [];

    let combinedText = topArticles.map(a => {
      const title = a.title || '';
      const description = a.description || '';
      const content = a.content || '';
      return `${title}\n${description}\n${content}`.trim();
    }).join('\n\n');

    if (!combinedText.trim()) {
      combinedText = 'No relevant text found for this query.';
    }

    combinedText = combinedText.slice(0, 3000);

    const sagemakerClient = new SageMakerRuntimeClient({ region: 'us-east-1' });
    const smCommand = new InvokeEndpointCommand({
      EndpointName: 'document-summarizer-v2',
      ContentType: 'application/json',
      Body: JSON.stringify({ inputs: [combinedText] }),
    });

    const smResponse = await sagemakerClient.send(smCommand);
    const raw = Buffer.from(smResponse.Body).toString('utf-8');
    const parsed = JSON.parse(raw);

    res.json({
      reply: `Here’s a quick summary of "${query}":\n${parsed.summary || parsed[0]?.summary_text || 'No summary returned'}`,
      source: query,
    });
  } catch (err) {
    console.error('Summarization failed:', err);
    res.status(500).json({ reply: 'Error while summarizing query.' });
  }
});


// ----------------- Start Server -----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
