import React, { useState } from 'react';
import { Facebook, Instagram, Twitter, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { usePublish } from '../hooks/usePublish';

const PublishView = ({ ad, onClose }) => {
  const { loading, error, success, publishToFacebook, publishToInstagram, publishToX, publishToMultiple } = usePublish();
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);

  const handlePlatformToggle = (platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    try {
      if (selectedPlatforms.length === 1) {
        const platform = selectedPlatforms[0];
        if (platform === 'facebook') {
          await publishToFacebook({
            caption: ad.caption,
            imageUrl: ad.image_url,
            adId: ad.id,
          });
        } else if (platform === 'instagram') {
          await publishToInstagram({
            caption: ad.caption,
            imageUrl: ad.image_url,
            adId: ad.id,
          });
        } else if (platform === 'x') {
          await publishToX({
            caption: ad.caption,
            imageUrl: ad.image_url,
            adId: ad.id,
          });
        }
      } else {
        await publishToMultiple({
          caption: ad.caption,
          imageUrl: ad.image_url,
          platforms: selectedPlatforms,
          adId: ad.id,
        });
      }
    } catch (e) {
      // Error is already set in the hook state
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Publish Ad</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Ad Preview */}
          <div className="bg-gray-50 rounded-xl p-4">
            <img
              src={ad.image_url}
              alt="Ad preview"
              className="w-full h-48 object-cover rounded-lg mb-3"
            />
            <p className="text-sm text-gray-700 line-clamp-3">{ad.caption}</p>
          </div>

          {/* Platform Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Select Platforms</h3>
            
            <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes('facebook')}
                onChange={() => handlePlatformToggle('facebook')}
                className="w-5 h-5 text-blue-600"
              />
              <Facebook className="w-5 h-5 text-blue-600 ml-3" />
              <span className="ml-3 font-medium text-gray-700">Facebook</span>
            </label>

            <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:border-pink-500 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes('instagram')}
                onChange={() => handlePlatformToggle('instagram')}
                className="w-5 h-5 text-pink-600"
              />
              <Instagram className="w-5 h-5 text-pink-600 ml-3" />
              <span className="ml-3 font-medium text-gray-700">Instagram</span>
            </label>

            <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:border-black cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes('x')}
                onChange={() => handlePlatformToggle('x')}
                className="w-5 h-5 text-black"
              />
              <Twitter className="w-5 h-5 text-black ml-3" />
              <span className="ml-3 font-medium text-gray-700">X / Twitter</span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={loading || selectedPlatforms.length === 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Now'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishView;
