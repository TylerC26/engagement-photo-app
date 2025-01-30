const express = require("express");
const { S3Client, ListObjectsV2Command, PutObjectCommand } = require("@aws-sdk/client-s3");
const cors = require("cors");
const multer = require("multer"); // Middleware for handling multipart/form-data
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

// Set up multer for handling file uploads
const storage = multer.memoryStorage(); // Store files in memory temporarily
const upload = multer({ storage });

// Route to upload files to S3
app.post("/upload-url", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const params = {
      Bucket: S3_BUCKET,
      Key: file.originalname, // Use the original file name as the key
      Body: file.buffer, // File content
      ContentType: file.mimetype, // File MIME type
    };

    // Upload the file to S3 using PutObjectCommand
    const command = new PutObjectCommand(params);
    await s3.send(command);

    const fileUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.originalname}`;

    res.status(200).json({ message: "File uploaded successfully", url: fileUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

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
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server is running on http://0.0.0.0:${PORT}`);