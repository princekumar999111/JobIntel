import { Request, Response } from "express";
import { PageView } from "../models/PageView";
import { Visitor } from "../models/Visitor";
import { User } from "../models/User";
import { Application } from "../models/Application";
import { Job } from "../models/Job";
import { JobAnalytics, UserAnalytics, CompanyAnalytics, PlatformAnalytics } from "../models/Analytics";
import { AdminActivityLog } from "../models/AdminActivityLog";
import { Company } from "../models/Company";

// Get visitor analytics
export async function getVisitorAnalytics(req: Request, res: Response) {
  try {
    const timeRange = req.query.timeRange as string || "24h";
    
    // Calculate date range
    let startDate = new Date();
    switch (timeRange) {
      case "1h":
        startDate.setHours(startDate.getHours() - 1);
        break;
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "24h":
      default:
        startDate.setHours(startDate.getHours() - 24);
        break;
    }

    // Get metrics
    const totalVisitors = await Visitor.countDocuments({
      firstVisit: { $gte: startDate },
    });

    const activeVisitors = await Visitor.countDocuments({
      lastVisit: { $gte: startDate },
    });

    const totalPageViews = await PageView.countDocuments({
      timestamp: { $gte: startDate },
    });

    const totalClicks = await Visitor.aggregate([
      { $match: { firstVisit: { $gte: startDate } } },
      { $group: { _id: null, totalClicks: { $sum: "$clickCount" } } },
    ]);

    const clickCount = totalClicks[0]?.totalClicks || 0;

    // Top pages
    const topPages = await PageView.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: "$page", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { page: "$_id", count: 1, _id: 0 } },
    ]);

    // Hourly data for chart - aggregate visitors, pageviews, and clicks
    const hourlyData = await PageView.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d %H:00", date: "$timestamp" },
          },
          pageViews: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { hour: "$_id", pageViews: 1, _id: 0 } },
    ]);

    // Get visitor and click counts per hour
    const visitorHourlyData = await Visitor.aggregate([
      { $match: { lastVisit: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d %H:00", date: "$lastVisit" },
          },
          visitors: { $sum: 1 },
          clicks: { $sum: "$clickCount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Merge hourly data from visitors into pageviews
    const visitorMap = new Map(visitorHourlyData.map((v: any) => [v._id, { visitors: v.visitors, clicks: v.clicks }]));
    const mergedHourlyData = hourlyData.map((h: any) => ({
      hour: h.hour,
      pageViews: h.pageViews,
      visitors: visitorMap.get(h.hour)?.visitors || 0,
      clicks: visitorMap.get(h.hour)?.clicks || 0,
    }));

    // Recent visitors
    const recentVisitors = await Visitor.find({ lastVisit: { $gte: startDate } })
      .sort({ lastVisit: -1 })
      .limit(20)
      .select("sessionId userId ipAddress pageCount clickCount lastVisit pages")
      .lean();

    return res.json({
      summary: {
        totalVisitors,
        activeVisitors,
        totalPageViews,
        totalClicks: clickCount,
        avgPagesPerVisitor: totalVisitors > 0 ? (totalPageViews / totalVisitors).toFixed(2) : 0,
        avgClicksPerVisitor: totalVisitors > 0 ? (clickCount / totalVisitors).toFixed(2) : 0,
      },
      topPages,
      hourlyData: mergedHourlyData,
      recentVisitors,
      timeRange,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch analytics", details: err });
  }
}

// Get real-time visitor count
export async function getRealtimeVisitors(req: Request, res: Response) {
  try {
    // Active visitors in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const activeCount = await Visitor.countDocuments({
      lastVisit: { $gte: fiveMinutesAgo },
    });

    // Visitors right now (last minute)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const nowCount = await Visitor.countDocuments({
      lastVisit: { $gte: oneMinuteAgo },
    });

    // Total all-time visitors
    const totalAllTime = await Visitor.countDocuments();

    // Visitors today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await Visitor.countDocuments({
      firstVisit: { $gte: todayStart },
    });

    return res.json({
      now: nowCount,
      last5Minutes: activeCount,
      today: todayCount,
      allTime: totalAllTime,
      timestamp: new Date(),
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch realtime visitors", details: err });
  }
}

// Get page-specific analytics
export async function getPageAnalytics(req: Request, res: Response) {
  try {
    const page = req.query.page as string || "/";
    const timeRange = req.query.timeRange as string || "24h";

    let startDate = new Date();
    switch (timeRange) {
      case "1h":
        startDate.setHours(startDate.getHours() - 1);
        break;
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "24h":
      default:
        startDate.setHours(startDate.getHours() - 24);
        break;
    }

    const viewCount = await PageView.countDocuments({
      page,
      timestamp: { $gte: startDate },
    });

    const uniqueVisitors = await PageView.countDocuments({
      page,
      timestamp: { $gte: startDate },
    }).distinct("sessionId");

    const referrers = await PageView.aggregate([
      { $match: { page, timestamp: { $gte: startDate }, referrer: { $exists: true } } },
      { $group: { _id: "$referrer", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { referrer: "$_id", count: 1, _id: 0 } },
    ]);

    return res.json({
      page,
      viewCount,
      uniqueVisitors: uniqueVisitors.length,
      referrers,
      timeRange,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch page analytics", details: err });
  }
}

// Track custom event/click
export async function trackEvent(req: Request, res: Response) {
  try {
    const { sessionId, page, eventType, eventData } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    // Update visitor click count
    const visitor = await Visitor.findOneAndUpdate(
      { sessionId },
      { $inc: { clickCount: 1 } },
      { new: true }
    );

    return res.json({ success: true, visitor });
  } catch (err) {
    return res.status(500).json({ error: "Failed to track event", details: err });
  }
}

// Get user-specific stats
export async function getUserStats(req: Request, res: Response) {
  try {
    const userId = (req as any).user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const applicationCount = await Application.countDocuments({ userId });
    
    // Profile strength based on applications and completeness
    const profileStrength = Math.min(applicationCount * 15 + 20, 100);

    return res.json({
      profileStrength: Math.round(profileStrength),
      profileTrend: '+5%',
      totalMatches: Math.floor(Math.random() * 50) + 10,
      matchesTrend: `+${Math.floor(Math.random() * 10)} this week`,
      totalApplications: applicationCount,
      applicationsTrend: `+${Math.floor(Math.random() * 5)} pending`,
      interviews: Math.floor(applicationCount * 0.2),
      interviewsTrend: `${Math.floor(Math.random() * 3)} scheduled`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to get user stats" });
  }
}

// Get job match trends
export async function getJobMatchTrends(req: Request, res: Response) {
  try {
    const userId = (req as any).user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const now = new Date();
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        matches: Math.floor(Math.random() * 20) + 5,
      });
    }

    return res.json(trends);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to get trends" });
  }
}

// Get application status distribution
export async function getApplicationStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const applications = await Application.find({ userId }).lean();
    
    const statusCount = {
      Applied: 0,
      Reviewed: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
    };

    applications.forEach(app => {
      const status = app.status || 'Applied';
      if (status in statusCount) {
        statusCount[status as keyof typeof statusCount]++;
      }
    });

    return res.json(Object.entries(statusCount).map(([name, value]) => ({ name, value })));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to get status" });
  }
}

// Get recent activity
export async function getRecentActivity(req: Request, res: Response) {
  try {
    const userId = (req as any).user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const applications = await Application.find({ userId })
      .populate('jobId', 'title company')
      .lean()
      .limit(5)
      .sort({ createdAt: -1 });

    const activity = applications.map(app => ({
      id: app._id,
      type: 'application',
      title: `Applied to ${(app as any).jobId?.title || 'Job'}`,
      company: (app as any).jobId?.company || 'Company',
      timestamp: app.createdAt,
      status: app.status,
    }));

    return res.json(activity);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to get activity" });
  }
}

// ==================== PHASE 5 ANALYTICS FUNCTIONS ====================

interface AuthRequest extends Request {
  user?: any;
  permissions?: string[];
  body: any;
  params: any;
  query: any;
}

/**
 * Get job analytics for a specific job
 */
export async function getJobAnalyticsData(req: AuthRequest, res: Response) {
  try {
    const { jobId } = req.params;
    const { days = 30 } = req.query;

    if (!jobId) {
      return res.status(400).json({ message: "jobId is required" });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    const analytics = await JobAnalytics.find({
      jobId,
      date: { $gte: startDate }
    })
      .sort({ date: -1 })
      .limit(100);

    const summary = analytics.length > 0 ? {
      totalViews: analytics.reduce((sum, a) => sum + a.totalViews, 0),
      totalApplications: analytics.reduce((sum, a) => sum + a.totalApplications, 0),
      averageQualityScore: Math.round(analytics.reduce((sum, a) => sum + a.qualityScore, 0) / analytics.length),
      averageApplicationRate: Math.round(analytics.reduce((sum, a) => sum + a.applicationRate, 0) / analytics.length),
      trend: analytics[0]?.viewTrend > 0 ? "increasing" : analytics[0]?.viewTrend < 0 ? "decreasing" : "stable"
    } : {
      totalViews: 0,
      totalApplications: 0,
      averageQualityScore: 0,
      averageApplicationRate: 0,
      trend: "no_data"
    };

    return res.status(200).json({ jobId, analytics, summary });
  } catch (error: any) {
    console.error("getJobAnalyticsData error:", error);
    return res.status(500).json({ message: "Failed to fetch job analytics", error: error.message });
  }
}

/**
 * Get platform-wide analytics
 */
export async function getPlatformAnalyticsData(req: AuthRequest, res: Response) {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    const analytics = await PlatformAnalytics.find({
      date: { $gte: startDate }
    })
      .sort({ date: -1 })
      .limit(100);

    const latestMetrics = analytics.length > 0 ? analytics[0] : null;

    const summary = latestMetrics ? {
      totalUsers: latestMetrics.totalUsers,
      activeUsers: latestMetrics.activeUsers,
      totalJobs: latestMetrics.totalJobsListed,
      activeJobs: latestMetrics.activeJobs,
      totalCompanies: latestMetrics.totalCompanies,
      activeCompanies: latestMetrics.activeCompanies,
      totalApplications: latestMetrics.totalApplications,
      userGrowthRate: Math.round(latestMetrics.userGrowthRate),
      jobGrowthRate: Math.round(latestMetrics.jobGrowthRate),
      monthlyActiveUsers: latestMetrics.monthlyActiveUsers,
      avgSessionDuration: Math.round(latestMetrics.avgSessionDuration),
      topSearchQueries: latestMetrics.topSearchQueries || [],
      topLocations: latestMetrics.topLocations || [],
      monthlyRecurringRevenue: latestMetrics.monthlyRecurringRevenue,
      churnRate: Math.round(latestMetrics.churnRate),
      apiResponseTime: Math.round(latestMetrics.apiResponseTime),
      uptime: latestMetrics.uptime.toFixed(2)
    } : {
      totalUsers: 0,
      activeUsers: 0,
      totalJobs: 0,
      activeJobs: 0,
      totalCompanies: 0,
      activeCompanies: 0,
      totalApplications: 0,
      userGrowthRate: 0,
      jobGrowthRate: 0,
      monthlyActiveUsers: 0,
      avgSessionDuration: 0,
      topSearchQueries: [],
      topLocations: [],
      monthlyRecurringRevenue: 0,
      churnRate: 0,
      apiResponseTime: 0,
      uptime: "100"
    };

    return res.status(200).json({ analytics, summary });
  } catch (error: any) {
    console.error("getPlatformAnalyticsData error:", error);
    return res.status(500).json({ message: "Failed to fetch platform analytics", error: error.message });
  }
}

/**
 * Get comprehensive dashboard
 */
export async function getAnalyticsDashboard(req: AuthRequest, res: Response) {
  try {
    const latestPlatform = await PlatformAnalytics.findOne().sort({ date: -1 });

    const totalJobs = await Job.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalCompanies = await Company.countDocuments();

    const dashboard = {
      platform: latestPlatform || {},
      jobs: { total: totalJobs },
      users: { total: totalUsers },
      companies: { total: totalCompanies }
    };

    return res.status(200).json(dashboard);
  } catch (error: any) {
    console.error("getAnalyticsDashboard error:", error);
    return res.status(500).json({ message: "Failed to fetch dashboard", error: error.message });
  }
}

/**
 * Get top performers
 */
export async function getTopPerformers(req: AuthRequest, res: Response) {
  try {
    const { limit = 10 } = req.query;

    const topJobs = await JobAnalytics.find()
      .sort({ totalViews: -1 })
      .limit(parseInt(limit as string))
      .populate("jobId", "title");

    const topCompanies = await CompanyAnalytics.find()
      .sort({ profileViews: -1 })
      .limit(parseInt(limit as string))
      .populate("companyId", "name");

    return res.status(200).json({ topJobs, topCompanies });
  } catch (error: any) {
    console.error("getTopPerformers error:", error);
    return res.status(500).json({ message: "Failed to fetch top performers", error: error.message });
  }
}

/**
 * Get analytics trends
 */
export async function getAnalyticsTrends(req: AuthRequest, res: Response) {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    const trends = await PlatformAnalytics.find({
      date: { $gte: startDate }
    })
      .sort({ date: 1 })
      .select("date totalUsers activeUsers totalJobsListed totalApplications");

    return res.status(200).json(trends);
  } catch (error: any) {
    console.error("getAnalyticsTrends error:", error);
    return res.status(500).json({ message: "Failed to fetch trends", error: error.message });
  }
}
