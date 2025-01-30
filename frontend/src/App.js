import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [photos, setPhotos] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
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
    setSelectedFile(event.target.files[0]);
  };

  // Upload the selected file to S3
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a photo to upload!");
      return;
    }

    setIsUploading(true);

    try {
      // Get signed URL from backend using API_BASE_URL
      const response = await axios.post(
        `${API_BASE_URL}/upload-url`, // Dynamically use API_BASE_URL
        {
          filename: selectedFile.name,
          filetype: selectedFile.type,
        }
      );

      const { uploadUrl, fileUrl } = response.data;

      // Upload file to S3
      await axios.put(uploadUrl, selectedFile, {
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      // Update photo gallery
      setPhotos((prevPhotos) => [...prevPhotos, fileUrl]);
      alert("Photo uploaded successfully!");
    } catch (error) {
      // Log the error for debugging
      console.error("Error uploading photo:", error);

      // Show the error message in an alert
      if (error.response) {
        // Server responded with a status other than 2xx
        alert(`Upload failed: ${error.response.data.message || error.response.data || "Server error"}`);
      } else if (error.request) {
        // Request was made but no response was received
        alert("Upload failed: No response received from the server.");
      } else {
        // Something else happened
        alert(`Upload failed: ${error.message}`);
      }
    }

    setIsUploading(false);
    setSelectedFile(null);
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
          className="block w-full border p-2 mb-2 rounded"
        />
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className={`w-full bg-blue-500 text-white py-2 rounded ${
            isUploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isUploading ? "Uploading..." : "Upload Photo"}
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