import React from "react";
import { Plus, Check, X, Instagram, Twitter, Facebook, Linkedin } from "lucide-react";
import { useAccounts } from "../hooks/useAccounts";

const PROVIDER_META = {
  instagram: { icon: Instagram, color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500", label: "Instagram" },
  twitter: { icon: Twitter, color: "bg-black", label: "Twitter" },
  x: { icon: Twitter, color: "bg-black", label: "Twitter / X" },
  facebook: { icon: Facebook, color: "bg-blue-600", label: "Facebook" },
  linkedin: { icon: Linkedin, color: "bg-blue-700", label: "LinkedIn" },
  tiktok: { icon: Twitter, color: "bg-black", label: "TikTok" },
};

const ConnectedAccountsView = () => {
  const { accounts, loading, error, connectAccount, disconnectAccount } = useAccounts();

  const handleConnectClick = async (providerKey) => {
    const username = window.prompt(`Enter the ${providerKey} username to connect (e.g. @yourbrand)`);
    if (!username) return;
    try {
      await connectAccount({ provider: providerKey, username });
    } catch (e) {
      alert(`Failed to connect: ${e.message || e}`);
    }
  };

  const handleDisconnect = async (id) => {
    if (!window.confirm('Disconnect this account?')) return;
    try {
      await disconnectAccount(id);
    } catch (e) {
      alert(`Failed to disconnect: ${e.message || e}`);
    }
  };

  const uiAccounts = (accounts || []).map((acc) => {
    const key = (acc.provider || '').toLowerCase();
    const meta = PROVIDER_META[key] || { icon: Twitter, color: 'bg-gray-200', label: acc.provider };
    return {
      id: acc.id,
      platform: meta.label,
      provider: key,
      username: acc.username,
      connected: !!acc.connected,
      icon: meta.icon,
      color: meta.color,
    };
  });

  const commonProviders = ['instagram', 'x', 'facebook', 'linkedin', 'tiktok'];
  const providersToShow = [...new Set([...uiAccounts.map(a => a.provider), ...commonProviders])];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Connected Accounts</h2>

          <button
            onClick={() => {
              const p = window.prompt('Platform to connect (instagram, x, facebook, linkedin, tiktok)');
              if (p) handleConnectClick(p.toLowerCase());
            }}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 rounded-xl font-medium transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add Account
          </button>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-700 rounded">Error: {error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providersToShow.map((providerKey) => {
            const acc = uiAccounts.find(a => a.provider === providerKey);
            const accountPresent = !!acc;
            const Icon = acc?.icon || (PROVIDER_META[providerKey] || {}).icon || Twitter;
            const color = acc?.color || (PROVIDER_META[providerKey] || {}).color || 'bg-gray-200';
            const label = acc?.platform || (PROVIDER_META[providerKey] || {}).label || providerKey;

            return (
              <div
                key={providerKey}
                className={`p-6 rounded-2xl border-2 transition-all ${
                  accountPresent
                    ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-purple-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{label}</h4>
                      <p className="text-sm text-gray-500">{accountPresent ? acc.username : 'Not connected'}</p>
                    </div>
                  </div>

                  {accountPresent ? (
                    <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
                      <Check className="w-4 h-4" /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm font-semibold text-gray-400">
                      <X className="w-4 h-4" /> Not Connected
                    </span>
                  )}
                </div>

                {accountPresent ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConnectClick(providerKey)}
                      className="flex-1 py-2 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDisconnect(acc.id)}
                      className="flex-1 py-2 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors text-red-600"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnectClick(providerKey)}
                    className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 rounded-lg text-sm font-medium transition-all"
                  >
                    Connect Account
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ConnectedAccountsView;
