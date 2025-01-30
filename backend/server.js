const express = require("express");
const AWS = require("aws-sdk");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors()); // Allow requests from your frontend
app.use(express.json()); // Parse JSON payloads

// Configure AWS SDK with credentials and region
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
const S3_BUCKET = process.env.S3_BUCKET_NAME;

// Get the list of photos from the S3 bucket
app.get("/photos", async (req, res) => {
  try {
    const params = {
      Bucket: S3_BUCKET,
    };

    // List objects in the bucket
    const data = await s3.listObjectsV2(params).promise();

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

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});