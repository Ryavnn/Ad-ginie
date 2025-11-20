import React from "react";
import {
  Plus,
  Check,
  X,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
} from "lucide-react";

const connectedAccounts = [
  {
    platform: "Instagram",
    username: "@yourusername",
    connected: true,
    color: "bg-pink-500",
    icon: Instagram,
  },
  {
    platform: "Twitter / X",
    username: "@yourusername",
    connected: false,
    color: "bg-black",
    icon: Twitter,
  },
  {
    platform: "Facebook",
    username: "Your Name",
    connected: true,
    color: "bg-blue-600",
    icon: Facebook,
  },
  {
    platform: "LinkedIn",
    username: "Your Name",
    connected: false,
    color: "bg-blue-700",
    icon: Linkedin,
  },
];

const ConnectedAccountsView = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Connected Accounts</h2>

        <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 rounded-xl font-medium transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Account
        </button>
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connectedAccounts.map((account, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-2xl border-2 transition-all ${
              account.connected
                ? "border-cyan-500 bg-gradient-to-br from-cyan-50 to-purple-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            {/* Top Section */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl ${account.color} flex items-center justify-center text-white`}
                >
                  <account.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">
                    {account.platform}
                  </h4>
                  <p className="text-sm text-gray-500">{account.username}</p>
                </div>
              </div>

              {account.connected ? (
                <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
                  <Check className="w-4 h-4" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm font-semibold text-gray-400">
                  <X className="w-4 h-4" /> Not Connected
                </span>
              )}
            </div>

            {/* Buttons */}
            {account.connected ? (
              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                  Settings
                </button>
                <button className="flex-1 py-2 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors text-red-600">
                  Disconnect
                </button>
              </div>
            ) : (
              <button className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 rounded-lg text-sm font-medium transition-all">
                Connect Account
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default ConnectedAccountsView;
