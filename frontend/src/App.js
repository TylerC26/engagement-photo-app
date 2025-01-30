import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [photos, setPhotos] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const S3_BUCKET_URL = "https://engagement-party-photo.s3.amazonaws.com/";
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; // Dynamically set via Amplify

  // Fetch uploaded photos (list from S3 bucket)
  useEffect(() => {
    async function fetchPhotos() {
      try {
        // Use API_BASE_URL for fetching photos
        const response = await axios.get(`${API_BASE_URL}/photos`);
        setPhotos(response.data);
      } catch (error) {
        console.error("Error fetching photos:", error);
      }
    }
    fetchPhotos();
  }, [API_BASE_URL]);

  // Handle file selection
  const handleFileChange = (event) => {
    setSelectedFiles([...event.target.files]);
  };

  // Upload the selected files to S3
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select photos to upload!");
      return;
    }

    setIsUploading(true);

    try {
      const uploadedPhotos = [];

      for (const file of selectedFiles) {
        // Get signed URL from backend using API_BASE_URL
        const response = await axios.post(`${API_BASE_URL}/upload-url`, {
          filename: file.name,
          filetype: file.type,
        });

        const { uploadUrl, fileUrl } = response.data;

        // Upload file to S3
        await axios.put(uploadUrl, file, {
          headers: {
            "Content-Type": file.type,
          },
        });

        uploadedPhotos.push(fileUrl);
      }

      // Update photo gallery
      setPhotos((prevPhotos) => [...prevPhotos, ...uploadedPhotos]);
      alert("Photos uploaded successfully!");
    } catch (error) {
      console.error("Error uploading photos:", error);

      if (error.response) {
        alert(`Upload failed: ${error.response.data.message || error.response.data || "Server error"}`);
      } else if (error.request) {
        alert("Upload failed: No response received from the server.");
      } else {
        alert(`Upload failed: ${error.message}`);
      }
    }

    setIsUploading(false);
    setSelectedFiles([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-3xl font-bold text-center mb-4">Engagement Party Photos</h1>

      {/* Photo Upload Section */}
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-2">Upload Your Photos</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          multiple
          className="block w-full border p-2 mb-2 rounded"
        />
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className={`w-full bg-blue-500 text-white py-2 rounded ${
            isUploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isUploading ? "Uploading..." : "Upload Photos"}
        </button>
      </div>

      {/* Photo Gallery Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-center mb-4">Photo Gallery</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <img
              key={index}
              src={`${S3_BUCKET_URL}${photo}`}
              alt="Uploaded"
              className="rounded shadow"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;