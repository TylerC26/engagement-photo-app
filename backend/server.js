const express = require("express");
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors()); // Allow requests from your frontend
app.use(express.json()); // Parse JSON payloads

// Configure the S3 client with credentials and region
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

const S3_BUCKET = process.env.S3_BUCKET_NAME;

// Get the list of photos from the S3 bucket
app.get("/photos", async (req, res) => {
  try {
    const params = {
      Bucket: S3_BUCKET,
    };

    // Use the ListObjectsV2Command to list objects in the bucket
    const command = new ListObjectsV2Command(params);
    const data = await s3.send(command);

    // Generate URLs for each object
    const photos = data.Contents.map((item) => {
      return `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`;
    });

    res.json(photos);
  } catch (error) {
    console.error("Error retrieving photos:", error);
    res.status(500).json({ error: "Failed to retrieve photos" });
  }
});

// Start the server (bind to 0.0.0.0 for external access)
const PORT = 3001;
// hcange
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server is running on http://0.0.0.0:${PORT}`);
});