// src/components/CreateAdView.js
import React, { useState, useEffect } from "react";

// 1. IMPORT THE HOOK
import { useAdGenerator } from "../hooks/useAdGenrator";

// 2. IMPORT ICONS (assuming lucide-react)
import {
  Image,
  RefreshCw,
  FileText,
  Eye,
  Instagram,
  Facebook,
  Linkedin,
  Twitter, 
  UploadCloud, 
} from "lucide-react";



const CreateAdView = () => {
  // 3. STATE FOR ALL FORM INPUTS
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("Professional");
  const [tone, setTone] = useState("Friendly");
  const [uploadedFile, setUploadedFile] = useState(null); // The File object
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [caption, setCaption] = useState("");

  // 4. INSTANTIATE THE HOOK
  const { generatedAd, isLoading, error, generateAd } = useAdGenerator();

  // 5. EFFECT TO UPDATE CAPTION WHEN AI IS DONE
  useEffect(() => {
    // When generatedAd changes, update the caption field
    if (generatedAd?.caption) {
      setCaption(generatedAd.caption);
    }
  }, [generatedAd]); 
  
  const handleGenerateClick = () => {
    // Gather all state data into the object the hook expects
    const promptData = {
      description,
      style,
      tone,
      platforms: selectedPlatforms,
      baseCaption: caption, 
      uploadedImage: uploadedFile, 
    };
    generateAd(promptData);
  };

  // 7. HANDLER for file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    } else {
      setUploadedFile(null); // Allow un-selecting
    }
  };

  // Platform data (moved here from JSX for clarity)
  const platforms = [
    {
      id: "instagram",
      name: "Instagram",
      icon: Instagram,
      color: "from-purple-500 via-pink-500 to-orange-500",
    },
    {
      id: "x",
      name: "Twitter/X",
      icon: Twitter,
      color: "from-gray-800 to-gray-900",
    },
 
    {
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      color: "from-blue-600 to-blue-700",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      color: "from-blue-700 to-blue-800",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Ad</h2>

        <div className="space-y-6">
          {/* Description Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ad Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your ad... AI will generate creative content based on your description"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[120px]"
            />
          </div>

          {/* Style Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option>Professional</option>
                <option>Playful</option>
                <option>Minimal</option>
                <option>Bold</option>
                <option>Elegant</option>
                <option>Modern</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option>Friendly</option>
                <option>Professional</option>
                <option>Casual</option>
                <option>Urgent</option>
                <option>Inspirational</option>
              </select>
            </div>
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Media Assets (Optional)
            </label>
            <label className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-cyan-500 transition-colors cursor-pointer block">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/gif"
              />
              <Image className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-2">
                {uploadedFile
                  ? `File selected: ${uploadedFile.name}`
                  : "Drop image here or click to upload"}
              </p>
              <p className="text-xs text-gray-400">
                Supports JPG, PNG, GIF up to 10MB
              </p>
            </label>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Target Platforms
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => {
                    setSelectedPlatforms((prev) =>
                      prev.includes(platform.id)
                        ? prev.filter((p) => p !== platform.id)
                        : [...prev.filter((p) => p !== "all"), platform.id]
                    );
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedPlatforms.includes(platform.id)
                      ? `bg-gradient-to-br ${platform.color} border-transparent text-white shadow-lg`
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <platform.icon className="w-6 h-6 mx-auto" />
                  <p className="text-xs font-medium mt-2">{platform.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Caption Editor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption... (AI will auto-adjust for each platform)"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[100px]"
            />
            {/* ...hashtag buttons... */}
          </div>

          {/* 8. DISPLAY ERROR MESSAGE */}
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleGenerateClick}
              disabled={isLoading}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* 9. LOADING STATE */}
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Regenerate with AI
                </>
              )}
            </button>
            <button className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
              <FileText className="w-5 h-5" /> Save Draft
            </button>
            <button className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
              <Eye className="w-5 h-5" /> Preview & Post
            </button>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          AI-Generated Preview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Desktop Preview
            </p>
            {/* 10. DYNAMIC IMAGE PREVIEW */}
            <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 font-bold text-lg overflow-hidden">
              {generatedAd?.imageUrl ? (
                <img
                  src={generatedAd.imageUrl}
                  alt="Desktop ad preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                "Your Ad Here"
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Mobile Preview
            </p>
            {/* 10. DYNAMIC IMAGE PREVIEW */}
            <div className="aspect-[9/16] max-w-[250px] mx-auto bg-gray-100 rounded-2xl flex items-center justify-center text-white font-bold overflow-hidden">
              {generatedAd?.imageUrl ? (
                <img
                  src={generatedAd.imageUrl}
                  alt="Mobile ad preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500">Mobile View</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAdView;
