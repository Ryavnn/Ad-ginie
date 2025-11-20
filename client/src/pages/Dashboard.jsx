import React, { useState } from "react";
import {
  BarChart3,
  Calendar,
  Image,
  Settings,
  Users,
  TrendingUp,
  Plus,
  Download,
  Edit,
  Eye,
  Clock,
  Share2,
  Instagram,
  Facebook,
  Linkedin,
  MessageSquare,
  Grid,
  List,
  Search,
  Filter,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Zap,
  Heart,
  MessageCircle,
  MousePointer,
  ArrowUpRight,
  Home,
  FileText,
  PieChart,
  Link2,
} from "lucide-react";
import { useAdGenerator } from "../hooks/useAdGenrator";
import CreateAdView from "../components/CreateAdView";
import ConnectedAccountsView from "../components/ConnectedAppView";

// Twitter/X Icon Component
const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// TikTok Icon Component
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const AdGenieDashboard = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["all"]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Sample data
  const kpiData = [
    {
      label: "Total Ads Generated",
      value: "1,247",
      change: "+12%",
      icon: Zap,
      color: "from-purple-500 to-pink-500",
    },
    {
      label: "Ads Published",
      value: "892",
      change: "+8%",
      icon: Share2,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Total Impressions",
      value: "2.4M",
      change: "+24%",
      icon: Eye,
      color: "from-emerald-500 to-teal-500",
    },
    {
      label: "Total Engagements",
      value: "156K",
      change: "+18%",
      icon: Heart,
      color: "from-orange-500 to-red-500",
    },
    {
      label: "Scheduled Posts",
      value: "47",
      change: "+5",
      icon: Clock,
      color: "from-violet-500 to-purple-500",
    },
  ];

  const recentAds = [
    {
      id: 1,
      title: "Summer Sale Campaign",
      platforms: ["instagram", "facebook"],
      status: "Posted",
      date: "2 hours ago",
      impressions: "12.5K",
      engagement: "890",
    },
    {
      id: 2,
      title: "Product Launch Teaser",
      platforms: ["x", "linkedin"],
      status: "Scheduled",
      date: "Tomorrow 10:00 AM",
      impressions: "-",
      engagement: "-",
    },
    {
      id: 3,
      title: "Behind the Scenes",
      platforms: ["tiktok", "instagram"],
      status: "Draft",
      date: "3 days ago",
      impressions: "-",
      engagement: "-",
    },
    {
      id: 4,
      title: "Customer Testimonial",
      platforms: ["facebook", "linkedin"],
      status: "Posted",
      date: "1 day ago",
      impressions: "8.2K",
      engagement: "645",
    },
  ];

  const activities = [
    {
      type: "post",
      message: 'Posted "Summer Sale Campaign" to Instagram',
      time: "2 hours ago",
      icon: Instagram,
      color: "text-pink-500",
    },
    {
      type: "schedule",
      message: "Scheduled post for Twitter/X",
      time: "4 hours ago",
      icon: Calendar,
      color: "text-blue-500",
    },
    {
      type: "account",
      message: "Connected LinkedIn account",
      time: "1 day ago",
      icon: Link2,
      color: "text-green-500",
    },
    {
      type: "draft",
      message: 'Saved draft "Product Launch"',
      time: "2 days ago",
      icon: FileText,
      color: "text-gray-500",
    },
  ];

  const connectedAccounts = [
    {
      platform: "Instagram",
      username: "@yourbrand",
      connected: true,
      icon: Instagram,
      color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500",
    },
    {
      platform: "Twitter/X",
      username: "@yourbrand",
      connected: true,
      icon: XIcon,
      color: "bg-black",
    },
    {
      platform: "TikTok",
      username: "@yourbrand",
      connected: true,
      icon: TikTokIcon,
      color: "bg-black",
    },
    {
      platform: "Facebook",
      username: "Your Brand",
      connected: true,
      icon: Facebook,
      color: "bg-blue-600",
    },
    {
      platform: "LinkedIn",
      username: "Your Company",
      connected: false,
      icon: Linkedin,
      color: "bg-blue-700",
    },
  ];

  const platformAnalytics = [
    {
      platform: "Instagram",
      impressions: "854K",
      engagement: "45.2K",
      ctr: "5.3%",
      growth: "+12%",
      icon: Instagram,
      color: "text-pink-500",
    },
    {
      platform: "Twitter/X",
      impressions: "623K",
      engagement: "38.1K",
      ctr: "6.1%",
      growth: "+8%",
      icon: XIcon,
      color: "text-gray-900",
    },
    {
      platform: "TikTok",
      impressions: "512K",
      engagement: "52.8K",
      ctr: "10.3%",
      growth: "+28%",
      icon: TikTokIcon,
      color: "text-gray-900",
    },
    {
      platform: "Facebook",
      impressions: "298K",
      engagement: "15.4K",
      ctr: "5.2%",
      growth: "+5%",
      icon: Facebook,
      color: "text-blue-600",
    },
    {
      platform: "LinkedIn",
      impressions: "145K",
      engagement: "8.9K",
      ctr: "6.1%",
      growth: "+15%",
      icon: Linkedin,
      color: "text-blue-700",
    },
  ];

  const PlatformIcon = ({ platform, className = "w-5 h-5" }) => {
    switch (platform) {
      case "instagram":
        return <Instagram className={className} />;
      case "x":
        return <XIcon />;
      case "tiktok":
        return <TikTokIcon />;
      case "facebook":
        return <Facebook className={className} />;
      case "linkedin":
        return <Linkedin className={className} />;
      default:
        return null;
    }
  };

  const Sidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 fixed left-0 top-0 h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
              Ad Genie
            </h1>
            <p className="text-xs text-gray-500">AI Ad Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {[
          { id: "dashboard", icon: Home, label: "Dashboard" },
          { id: "ads", icon: Grid, label: "Recent Ads" },
          { id: "create", icon: Plus, label: "Create Ad" },
          { id: "calendar", icon: Calendar, label: "Calendar" },
          { id: "analytics", icon: BarChart3, label: "Analytics" },
          { id: "history", icon: FileText, label: "Post History" },
          { id: "accounts", icon: Link2, label: "Accounts" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === item.id
                ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => setCurrentPage("settings")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            currentPage === "settings"
              ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );

  const TopNav = () => (
    <div className="fixed top-0 left-64 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-10">
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search ads, campaigns, analytics..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold cursor-pointer">
            AB
          </div>
        </div>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiData.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}
              >
                <kpi.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                {kpi.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</p>
            <p className="text-sm text-gray-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              icon: Plus,
              label: "Create New Ad",
              gradient: "from-cyan-500 to-blue-600",
            },
            {
              icon: Link2,
              label: "Connect Account",
              gradient: "from-purple-500 to-pink-600",
            },
            {
              icon: Image,
              label: "Upload Media",
              gradient: "from-emerald-500 to-teal-600",
            },
            {
              icon: Calendar,
              label: "View Calendar",
              gradient: "from-orange-500 to-red-600",
            },
          ].map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (action.label === "Create New Ad") setShowCreateModal(true);
                if (action.label === "View Calendar")
                  setCurrentPage("calendar");
                if (action.label === "Connect Account")
                  setCurrentPage("accounts");
              }}
              className={`flex flex-col items-center gap-3 p-6 rounded-xl bg-gradient-to-br ${action.gradient} text-white hover:shadow-xl transition-all transform hover:-translate-y-1`}
            >
              <action.icon className="w-8 h-8" />
              <span className="font-medium text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Performance Chart & Top Ads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Performance Overview
            </h3>
            <div className="flex gap-2">
              {["7D", "30D", "90D"].map((period) => (
                <button
                  key={period}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {[65, 85, 75, 95, 80, 90, 100].map((height, idx) => (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div
                  className={`w-full rounded-t-lg bg-gradient-to-t from-cyan-500 to-purple-600 transition-all hover:opacity-80`}
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-500">Day {idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Top Performing Ads
          </h3>
          <div className="space-y-4">
            {recentAds.slice(0, 3).map((ad, idx) => (
              <div
                key={ad.id}
                className="flex gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  #{idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm mb-1">
                    {ad.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {ad.impressions}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {ad.engagement}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {activities.map((activity, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ${activity.color}`}
              >
                <activity.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const RecentAdsView = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search ads..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
          <select className="px-4 py-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
            <option>All Platforms</option>
            <option>Instagram</option>
            <option>Twitter/X</option>
            <option>TikTok</option>
            <option>Facebook</option>
            <option>LinkedIn</option>
          </select>
          <select className="px-4 py-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500">
            <option>All Status</option>
            <option>Posted</option>
            <option>Scheduled</option>
            <option>Draft</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl transition-colors ${
                viewMode === "grid"
                  ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-xl transition-colors ${
                viewMode === "list"
                  ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Ads Grid/List */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }
      >
        {recentAds.map((ad) => (
          <div
            key={ad.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all"
          >
            <div className="aspect-video bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl">
              Ad Preview
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-gray-900">{ad.title}</h4>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    ad.status === "Posted"
                      ? "bg-green-100 text-green-700"
                      : ad.status === "Scheduled"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {ad.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                {ad.platforms.map((platform) => (
                  <div
                    key={platform}
                    className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
                  >
                    <PlatformIcon platform={platform} className="w-4 h-4" />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{ad.date}</span>
                {ad.status === "Posted" && (
                  <div className="flex gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" /> {ad.impressions}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" /> {ad.engagement}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" /> Preview
                </button>
                <button className="flex-1 py-2 px-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" /> Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

 <CreateAdView />

  const CalendarView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Content Calendar</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">
              Month
            </button>
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">
              Week
            </button>
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">
              Day
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 rounded-xl font-medium transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Schedule Post
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
          {Array.from({ length: 35 }, (_, i) => {
            const day = i - 2;
            const hasPost = [3, 7, 12, 18, 22, 28].includes(day);
            return (
              <div
                key={i}
                className={`aspect-square rounded-xl border-2 p-2 transition-all cursor-pointer ${
                  day < 1 || day > 30
                    ? "border-gray-100 bg-gray-50"
                    : hasPost
                    ? "border-cyan-500 bg-gradient-to-br from-cyan-50 to-purple-50 hover:shadow-lg"
                    : "border-gray-200 hover:border-cyan-300 hover:bg-gray-50"
                }`}
              >
                {day > 0 && day <= 30 && (
                  <>
                    <p className="text-sm font-semibold text-gray-900">{day}</p>
                    {hasPost && (
                      <div className="mt-1 space-y-1">
                        <div className="w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"></div>
                        <div className="flex gap-1">
                          <Instagram className="w-3 h-3 text-pink-500" />
                          <Facebook className="w-3 h-3 text-blue-600" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scheduled Queue */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Upcoming Posts</h3>
        <div className="space-y-3">
          {[
            {
              title: "Product Launch Teaser",
              date: "Nov 16, 10:00 AM",
              platforms: ["instagram", "x"],
            },
            {
              title: "Customer Testimonial",
              date: "Nov 18, 2:00 PM",
              platforms: ["facebook", "linkedin"],
            },
            {
              title: "Behind the Scenes",
              date: "Nov 20, 4:30 PM",
              platforms: ["tiktok", "instagram"],
            },
          ].map((post, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Clock className="w-5 h-5 text-cyan-600" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{post.title}</p>
                <p className="text-sm text-gray-500">{post.date}</p>
              </div>
              <div className="flex gap-2">
                {post.platforms.map((platform) => (
                  <div
                    key={platform}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center"
                  >
                    <PlatformIcon platform={platform} className="w-4 h-4" />
                  </div>
                ))}
              </div>
              <button className="p-2 hover:bg-white rounded-lg transition-colors">
                <Edit className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AnalyticsView = () => (
    <div className="space-y-6">
      {/* Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          {
            label: "Total Impressions",
            value: "2.4M",
            change: "+24%",
            icon: Eye,
          },
          { label: "Total Reach", value: "1.8M", change: "+18%", icon: Users },
          { label: "Engagements", value: "156K", change: "+22%", icon: Heart },
          {
            label: "Click-Through Rate",
            value: "5.8%",
            change: "+0.5%",
            icon: MousePointer,
          },
          {
            label: "Follower Growth",
            value: "+12.4K",
            change: "+15%",
            icon: ArrowUpRight,
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <kpi.icon className="w-5 h-5 text-cyan-600" />
              <span className="text-sm font-semibold text-green-600">
                {kpi.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</p>
            <p className="text-sm text-gray-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Platform Analytics */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Platform Performance
        </h3>
        <div className="space-y-4">
          {platformAnalytics.map((platform, idx) => (
            <div
              key={idx}
              className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${platform.color} bg-opacity-10 flex items-center justify-center`}
                  >
                    <platform.icon />
                  </div>
                  <span className="font-semibold text-gray-900">
                    {platform.platform}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    platform.growth.startsWith("+")
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {platform.growth}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Impressions</p>
                  <p className="font-bold text-gray-900">
                    {platform.impressions}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Engagement</p>
                  <p className="font-bold text-gray-900">
                    {platform.engagement}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">CTR</p>
                  <p className="font-bold text-gray-900">{platform.ctr}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Growth</p>
                  <p className="font-bold text-gray-900">{platform.growth}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best Posting Times Heatmap */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Best Posting Times
        </h3>
        <div className="space-y-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="flex items-center gap-3">
              <span className="w-12 text-sm font-medium text-gray-600">
                {day}
              </span>
              <div className="flex-1 grid grid-cols-24 gap-1">
                {Array.from({ length: 24 }, (_, i) => {
                  const intensity = Math.random();
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded ${
                        intensity > 0.7
                          ? "bg-gradient-to-br from-cyan-500 to-purple-600"
                          : intensity > 0.4
                          ? "bg-gradient-to-br from-cyan-400 to-purple-500 opacity-60"
                          : "bg-gray-200"
                      }`}
                      title={`${i}:00`}
                    ></div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div> Low
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-cyan-400 to-purple-500 opacity-60 rounded"></div>{" "}
            Medium
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-cyan-500 to-purple-600 rounded"></div>{" "}
            High
          </span>
        </div>
      </div>
    </div>
  );

  const PostHistoryView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Post History</h2>
          <div className="flex gap-2">
            <select className="px-4 py-2 bg-gray-100 rounded-xl focus:outline-none">
              <option>All Platforms</option>
              <option>Instagram</option>
              <option>Twitter/X</option>
              <option>TikTok</option>
              <option>Facebook</option>
              <option>LinkedIn</option>
            </select>
            <select className="px-4 py-2 bg-gray-100 rounded-xl focus:outline-none">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>Last 90 Days</option>
              <option>All Time</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {recentAds.map((ad, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex-shrink-0"></div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{ad.title}</h4>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{ad.date}</span>
                  <div className="flex gap-2">
                    {ad.platforms.map((platform) => (
                      <PlatformIcon
                        key={platform}
                        platform={platform}
                        className="w-4 h-4"
                      />
                    ))}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      ad.status === "Posted"
                        ? "bg-green-100 text-green-700"
                        : ad.status === "Scheduled"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {ad.status}
                  </span>
                </div>
              </div>
              {ad.status === "Posted" && (
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-gray-500">Impressions</p>
                    <p className="font-bold text-gray-900">{ad.impressions}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Engagement</p>
                    <p className="font-bold text-gray-900">{ad.engagement}</p>
                  </div>
                </div>
              )}
              <button className="p-2 hover:bg-white rounded-lg transition-colors">
                <Eye className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  <ConnectedAccountsView />

  const SettingsView = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Profile Settings
        </h2>
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
              CK
            </div>
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">
              Change Avatar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Cynthia Kuthea"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                placeholder="My Brand"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="ckuthea2021@gmail.com.com"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Timezone
            </label>

          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Subscription & Billing
        </h3>
        <div className="p-6 bg-gradient-to-br from-cyan-50 to-purple-50 rounded-xl border-2 border-cyan-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-gray-900">Pro Plan</h4>
              <p className="text-sm text-gray-600">
                Unlimited ads, all platforms
              </p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              $49<span className="text-lg text-gray-500">/mo</span>
            </p>
          </div>
          <button className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 rounded-xl font-semibold transition-all">
            Manage Subscription
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Notification Preferences
        </h3>
        <div className="space-y-4">
          {[
            "Post successfully published",
            "Scheduled post reminder",
            "Weekly analytics report",
            "New feature announcements",
            "Team member activity",
          ].map((pref, idx) => (
            <label
              key={idx}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <span className="text-gray-900">{pref}</span>
              <input
                type="checkbox"
                className="w-5 h-5 rounded accent-cyan-600"
                defaultChecked={idx < 3}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardView />;
      case "ads":
        return <RecentAdsView />;
      case "create":
        return <CreateAdView />;
      case "calendar":
        return <CalendarView />;
      case "analytics":
        return <AnalyticsView />;
      case "history":
        return <PostHistoryView />;
      case "accounts":
        return <ConnectedAccountsView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <TopNav />
      <main className="ml-64 pt-20 p-8">{renderPage()}</main>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Schedule Post
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Ad
                </label>
                <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option>Summer Sale Campaign</option>
                  <option>Product Launch Teaser</option>
                  <option>Behind the Scenes</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Platforms
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["instagram", "x", "facebook"].map((platform) => (
                    <button
                      key={platform}
                      className="p-3 rounded-xl border-2 border-gray-200 hover:border-cyan-500 transition-colors flex items-center justify-center"
                    >
                      <PlatformIcon platform={platform} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Recurring
                </label>
                <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option>No repeat</option>
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Custom</option>
                </select>
              </div>
              <button className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                <Clock className="w-5 h-5" /> Schedule Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdGenieDashboard;
