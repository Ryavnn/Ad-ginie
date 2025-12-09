import React, { useState, useEffect } from 'react';
import { Instagram, Facebook, Linkedin, X as XIcon, Clock, Image, Video, Plus } from 'lucide-react';
import { usePublish } from '../hooks/usePublish';
import { useAds } from '../hooks/useAds';

const PlatformIcon = ({ platform }) => {
  switch (platform) {
    case 'instagram':
      return <Instagram className="w-5 h-5" />;
    case 'facebook':
      return <Facebook className="w-5 h-5" />;
    case 'linkedin':
      return <Linkedin className="w-5 h-5" />;
    case 'x':
      return <XIcon className="w-5 h-5" />;
    default:
      return null;
  }
};

export default function PostView() {
  const { publishToMultiple, getFacebookPages, getInstagramAccounts, loading: pubLoading, error: pubError } = usePublish();
  const { createAd } = useAds();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [platforms, setPlatforms] = useState(['instagram']);
  const [facebookPages, setFacebookPages] = useState([]);
  const [instagramAccounts, setInstagramAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState({});
  const [scheduling, setScheduling] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    // fetch available accounts
    (async () => {
      try {
        const pages = await getFacebookPages();
        setFacebookPages(pages || []);
      } catch (e) {}
      try {
        const ig = await getInstagramAccounts();
        setInstagramAccounts(ig || []);
      } catch (e) {}
    })();
  }, []);

  const togglePlatform = (p) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const onUpload = async () => {
    if (!file) return setMessage('Please select an image or video to upload');
    setLoading(true);
    setMessage('');
    try {
      const fd = new FormData();
      fd.append('description', 'upload');
      fd.append('image', file);
      // call generate-ad to safely upload and get a public URL
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/generate-ad`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setImageUrl(data.imageUrl || '');
      if (data.caption) setCaption(data.caption);
      setMessage('Upload successful — image ready');
    } catch (e) {
      setMessage(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const onPost = async () => {
    setLoading(true);
    setMessage('');
    try {
      // If scheduling, create ad as Scheduled
      const adPayload = {
        title: caption ? caption.slice(0, 80) : 'Untitled Post',
        caption,
        image_url: imageUrl,
        platforms,
        status: scheduling ? 'Scheduled' : 'Posted',
        scheduled_date: scheduling && date && time ? new Date(`${date}T${time}`).toISOString() : null,
      };

      // If immediate publish, call publish endpoints
      if (!scheduling) {
        await publishToMultiple({ caption, imageUrl, platforms });
      }

      // Persist ad record
      await createAd(adPayload);
      setMessage(scheduling ? 'Post scheduled' : 'Post published');
      // reset form
      setFile(null);
      setPreview(null);
      setImageUrl('');
      setCaption('');
      setPlatforms(['instagram']);
      setDate('');
      setTime('');
    } catch (e) {
      setMessage(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-4">Create Post</h2>

        <label className="block text-sm font-semibold mb-2">Media</label>
        <div className="flex items-center gap-3">
          <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={onUpload} disabled={!file || loading} className="px-4 py-2 bg-cyan-600 text-white rounded-xl">
            <Plus className="w-4 h-4 inline-block mr-2" /> Upload
          </button>
        </div>

        {preview && (
          <div className="mt-4">
            <div className="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {file && file.type.startsWith('video') ? (
                <video src={preview} controls className="w-full h-full object-cover" />
              ) : (
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              )}
            </div>
          </div>
        )}

        {imageUrl && (
          <div className="mt-3 text-sm text-gray-600">Uploaded URL: <a className="text-cyan-600" href={imageUrl} target="_blank" rel="noreferrer">Open</a></div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-semibold mb-2">Caption</label>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200"></textarea>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold mb-2">Platforms</label>
          <div className="flex gap-2">
            {['instagram','x','facebook','linkedin','tiktok'].map((p) => (
              <button key={p} onClick={() => togglePlatform(p)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${platforms.includes(p) ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                <PlatformIcon platform={p} />
                <span className="text-sm">{p}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={scheduling} onChange={(e) => setScheduling(e.target.checked)} />
            <span className="text-sm">Schedule this post</span>
          </label>
          {scheduling && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200" />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200" />
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={onPost} disabled={loading} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl font-semibold">
            {scheduling ? 'Schedule Post' : 'Post Now'}
          </button>
          <div className="text-sm text-gray-500">{message || pubError}</div>
        </div>
      </div>
    </div>
  );
}
