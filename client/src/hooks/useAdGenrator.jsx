// src/hooks/useAdGenerator.js
import { useState } from "react";

/**
 * @typedef {object} GeneratedAd
 * @property {string} caption - The AI-generated caption.
 * @property {string} imageUrl - The URL for the AI-generated image.
 */

/**
 * @typedef {object} AdPromptData
 * @property {string} description
 * @property {string} style
 * @property {string} tone
 * @property {string[]} platforms
 * @property {File | null} uploadedImage - This is optional.
 * @property {string} baseCaption
 */

/**
 * A custom React hook to handle AI ad generation.
 * Manages loading, error, and data states for the API call.
 */
export const useAdGenerator = () => {
  /** @type {[GeneratedAd | null, React.Dispatch<React.SetStateAction<GeneratedAd | null>>]} */
  const [generatedAd, setGeneratedAd] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Sends the ad prompt data to the backend API.
   * @param {AdPromptData} promptData - The data from the ad creation form.
   */
  const generateAd = async (promptData) => {
    setIsLoading(true);
    setError(null);

    // Use FormData to handle multipart/form-data (text and files)
    const formData = new FormData();

    // Append all the text-based prompt data
    formData.append("description", promptData.description);
    formData.append("style", promptData.style);
    formData.append("tone", promptData.tone);
    formData.append("baseCaption", promptData.baseCaption);

    // Append the platforms array
    promptData.platforms.forEach((platform) => {
      formData.append("platforms[]", platform);
    });

    // --- This block makes the image optional ---
    // Only append the image if one was actually provided
    if (promptData.uploadedImage) {
      formData.append("image", promptData.uploadedImage);
    }
    // ---------------------------------------------

    try {
      // This is your backend endpoint that will call Gemini.
      const response = await fetch("/api/generate-ad", {
        method: "POST",
        body: formData,
        // Note: Don't set 'Content-Type' header manually for FormData.
        // The browser will automatically set it to 'multipart/form-data'
        // along with the correct boundary.
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            "Failed to generate ad. The server responded with an error."
        );
      }

      /** @type {GeneratedAd} */
      const data = await response.json();

      // We expect the backend to return an object with the
      // generated caption and the URL of the generated image.
      // e.g., { caption: "...", imageUrl: "https://.../image.png" }
      setGeneratedAd(data);
    } catch (err) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    /** The AI-generated ad data (caption and imageUrl) */
    generatedAd,
    /** True if the API request is in progress */
    isLoading,
    /** The error message, if any */
    error,
    /** The function to trigger the ad generation */
    generateAd,
  };
};
