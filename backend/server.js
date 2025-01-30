const express = require("express");
const { S3Client, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
require("dotenv").config();

const REGION = process.env.AWS_REGION;
const S3_BUCKET = process.env.S3_BUCKET_NAME;

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Endpoint to generate signed URL for uploads
app.post("/upload-url", async (req, res) => {
  const { filename, filetype } = req.body;

  const params = {
    Bucket: S3_BUCKET,
    Key: filename,
    ContentType: filetype,
    ACL: "public-read",
  };

  try {
    const command = new PutObjectCommand(params);
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL valid for 1 hour
    const fileUrl = `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${filename}`;
    res.json({ uploadUrl, fileUrl });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    res.status(500).send("Error generating signed URL");
  }
});

// Endpoint to list photos
app.get("/photos", async (req, res) => {
  const params = {
    Bucket: S3_BUCKET,
  };

  try {
    const command = new ListObjectsV2Command(params);
    const data = await s3Client.send(command);
    const photos = data.Contents ? data.Contents.map((item) => item.Key) : [];
    res.json(photos);
  } catch (error) {
    console.error("Error listing photos:", error);
    res.status(500).send("Error listing photos");
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});