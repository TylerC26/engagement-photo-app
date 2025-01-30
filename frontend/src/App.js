import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [photos, setPhotos] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const S3_BUCKET_URL = "https://engagement-party-photo.s3.amazonaws.com/";

  // Fetch uploaded photos (list from S3 bucket)
  useEffect(() => {
    async function fetchPhotos() {
      try {
        const response = await axios.get("http://localhost:3001/photos");
        setPhotos(response.data);
      } catch (error) {
        console.error("Error fetching photos:", error);
      }
    }
    fetchPhotos();
  }, []);

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
      // Get signed URL from backend
      const response = await axios.post(
        "https://YOUR_BACKEND_API/upload-url",
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
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
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