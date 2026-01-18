import { Request, Response } from 'express';
import { ScraperConfig } from '../models/ScraperConfig';
import { AdminActivityLog } from '../models/AdminActivityLog';

// ========================
// SCRAPER CONFIG CONTROLLERS
// ========================

/**
 * Get current scraper configuration
 */
export async function getScraperConfig(req: Request, res: Response) {
  try {
    let config = await ScraperConfig.findOne().select('-__v');

    // If no config exists, create default one
    if (!config) {
      config = await ScraperConfig.create({
        enabled: true,
        maxRequestsPerHour: 10,
        maxRequestsPerDay: 50,
        defaultPages: 5,
        maxPagesAllowed: 100,
        minSalaryDataQuality: 75,
        minDescriptionLength: 500,
        filterDuplicates: true,
        autoScrapeEnabled: false,
        autoScrapeFrequency: 'daily',
        autoScrapeTime: '02:00 AM IST',
        skipWeekends: true,
        skipHolidays: true,
        monthlyBudget: 5000,
        costPerApiCall: 0.5,
        alertThreshold: 80,
      });
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (err) {
    console.error('Error fetching scraper config:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scraper configuration',
    });
  }
}

/**
 * Update scraper configuration
 */
export async function updateScraperConfig(req: Request, res: Response) {
  try {
    const updates = req.body;

    // Validate rate limits
    if (updates.maxRequestsPerHour && updates.maxRequestsPerHour < 1) {
      return res.status(400).json({
        success: false,
        error: 'Max requests per hour must be at least 1',
      });
    }

    if (updates.maxRequestsPerDay && updates.maxRequestsPerDay < 1) {
      return res.status(400).json({
        success: false,
        error: 'Max requests per day must be at least 1',
      });
    }

    if (updates.defaultPages && (updates.defaultPages < 1 || updates.defaultPages > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Default pages must be between 1 and 100',
      });
    }

    // Validate budget settings
    if (updates.monthlyBudget !== undefined && updates.monthlyBudget < 0) {
      return res.status(400).json({
        success: false,
        error: 'Monthly budget cannot be negative',
      });
    }

    if (updates.alertThreshold && (updates.alertThreshold < 0 || updates.alertThreshold > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Alert threshold must be between 0 and 100',
      });
    }

    // Validate data quality
    if (updates.minSalaryDataQuality && (updates.minSalaryDataQuality < 0 || updates.minSalaryDataQuality > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Salary data quality must be between 0 and 100',
      });
    }

    // Get old config for audit log
    const oldConfig = await ScraperConfig.findOne();
    if (!oldConfig) {
      return res.status(404).json({
        success: false,
        error: 'Scraper config not found',
      });
    }

    const oldData = oldConfig.toObject();

    // Update configuration
    const updated = await ScraperConfig.findOneAndUpdate(
      {},
      {
        ...updates,
        lastUpdatedBy: (req as any).user?.id,
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update configuration',
      });
    }

    // Log activity
    await AdminActivityLog.create({
      adminId: (req as any).user?.id,
      action: 'UPDATE_SCRAPER_CONFIG',
      resource: 'ScraperConfig',
      resourceId: updated._id?.toString(),
      changes: {
        before: oldData,
        after: updated.toObject(),
      },
      severity: 'HIGH',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Scraper configuration updated successfully',
      data: updated,
    });
  } catch (err) {
    console.error('Error updating scraper config:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update scraper configuration',
    });
  }
}

/**
 * Update rate limiting settings
 */
export async function updateRateLimits(req: Request, res: Response) {
  try {
    const { maxRequestsPerHour, maxRequestsPerDay, defaultPages, maxPagesAllowed } = req.body;

    // Validation
    if (maxRequestsPerHour && maxRequestsPerHour < 1) {
      return res.status(400).json({ success: false, error: 'Invalid hourly limit' });
    }

    if (maxRequestsPerDay && maxRequestsPerDay < 1) {
      return res.status(400).json({ success: false, error: 'Invalid daily limit' });
    }

    if (defaultPages && (defaultPages < 1 || defaultPages > 100)) {
      return res.status(400).json({ success: false, error: 'Invalid default pages' });
    }

    const updated = await ScraperConfig.findOneAndUpdate(
      {},
      {
        maxRequestsPerHour: maxRequestsPerHour || undefined,
        maxRequestsPerDay: maxRequestsPerDay || undefined,
        defaultPages: defaultPages || undefined,
        maxPagesAllowed: maxPagesAllowed || undefined,
        lastUpdatedBy: (req as any).user?.id,
      },
      { new: true, omitUndefined: true }
    );

    // Log activity
    await AdminActivityLog.create({
      adminId: (req as any).user?.id,
      action: 'UPDATE_RATE_LIMITS',
      resource: 'ScraperConfig',
      resourceId: updated?._id?.toString(),
      changes: {
        maxRequestsPerHour,
        maxRequestsPerDay,
        defaultPages,
        maxPagesAllowed,
      },
      severity: 'MEDIUM',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Rate limits updated',
      data: updated,
    });
  } catch (err) {
    console.error('Error updating rate limits:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update rate limits',
    });
  }
}

/**
 * Update budget settings
 */
export async function updateBudgetSettings(req: Request, res: Response) {
  try {
    const { monthlyBudget, costPerApiCall, alertThreshold } = req.body;

    if (monthlyBudget !== undefined && monthlyBudget < 0) {
      return res.status(400).json({ success: false, error: 'Budget cannot be negative' });
    }

    if (costPerApiCall !== undefined && costPerApiCall < 0) {
      return res.status(400).json({ success: false, error: 'Cost cannot be negative' });
    }

    if (alertThreshold && (alertThreshold < 0 || alertThreshold > 100)) {
      return res.status(400).json({ success: false, error: 'Alert threshold must be 0-100' });
    }

    const updated = await ScraperConfig.findOneAndUpdate(
      {},
      {
        monthlyBudget: monthlyBudget !== undefined ? monthlyBudget : undefined,
        costPerApiCall: costPerApiCall !== undefined ? costPerApiCall : undefined,
        alertThreshold: alertThreshold !== undefined ? alertThreshold : undefined,
        lastUpdatedBy: (req as any).user?.id,
      },
      { new: true, omitUndefined: true }
    );

    // Log activity
    await AdminActivityLog.create({
      adminId: (req as any).user?.id,
      action: 'UPDATE_BUDGET_SETTINGS',
      resource: 'ScraperConfig',
      resourceId: updated?._id?.toString(),
      changes: {
        monthlyBudget,
        costPerApiCall,
        alertThreshold,
      },
      severity: 'HIGH',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Budget settings updated',
      data: updated,
    });
  } catch (err) {
    console.error('Error updating budget:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update budget settings',
    });
  }
}

/**
 * Update auto-scrape schedule
 */
export async function updateAutoScrapeSchedule(req: Request, res: Response) {
  try {
    const { autoScrapeEnabled, autoScrapeFrequency, autoScrapeTime, skipWeekends, skipHolidays } = req.body;

    if (autoScrapeFrequency && !['daily', 'weekly', 'monthly'].includes(autoScrapeFrequency)) {
      return res.status(400).json({ success: false, error: 'Invalid frequency' });
    }

    // Calculate next scheduled run
    let nextScheduledRun = undefined;
    if (autoScrapeEnabled) {
      nextScheduledRun = calculateNextRun(autoScrapeTime, autoScrapeFrequency || 'daily');
    }

    const updated = await ScraperConfig.findOneAndUpdate(
      {},
      {
        autoScrapeEnabled: autoScrapeEnabled !== undefined ? autoScrapeEnabled : undefined,
        autoScrapeFrequency: autoScrapeFrequency || undefined,
        autoScrapeTime: autoScrapeTime || undefined,
        skipWeekends: skipWeekends !== undefined ? skipWeekends : undefined,
        skipHolidays: skipHolidays !== undefined ? skipHolidays : undefined,
        nextScheduledRun: nextScheduledRun || undefined,
        lastUpdatedBy: (req as any).user?.id,
      },
      { new: true, omitUndefined: true }
    );

    // Log activity
    await AdminActivityLog.create({
      adminId: (req as any).user?.id,
      action: autoScrapeEnabled ? 'ENABLE_AUTO_SCRAPE' : 'DISABLE_AUTO_SCRAPE',
      resource: 'ScraperConfig',
      resourceId: updated?._id?.toString(),
      changes: {
        autoScrapeEnabled,
        autoScrapeFrequency,
        autoScrapeTime,
        skipWeekends,
        skipHolidays,
      },
      severity: 'HIGH',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Auto-scrape schedule updated',
      data: updated,
    });
  } catch (err) {
    console.error('Error updating schedule:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update schedule',
    });
  }
}

/**
 * Update company filters
 */
export async function updateCompanyFilters(req: Request, res: Response) {
  try {
    const { blacklistedCompanies, whitelistedCompanies } = req.body;

    if (blacklistedCompanies && !Array.isArray(blacklistedCompanies)) {
      return res.status(400).json({ success: false, error: 'Blacklist must be an array' });
    }

    if (whitelistedCompanies && !Array.isArray(whitelistedCompanies)) {
      return res.status(400).json({ success: false, error: 'Whitelist must be an array' });
    }

    const updated = await ScraperConfig.findOneAndUpdate(
      {},
      {
        blacklistedCompanies: blacklistedCompanies || undefined,
        whitelistedCompanies: whitelistedCompanies || undefined,
        lastUpdatedBy: (req as any).user?.id,
      },
      { new: true, omitUndefined: true }
    );

    // Log activity
    await AdminActivityLog.create({
      adminId: (req as any).user?.id,
      action: 'UPDATE_COMPANY_FILTERS',
      resource: 'ScraperConfig',
      resourceId: updated?._id?.toString(),
      changes: {
        blacklistedCompanies,
        whitelistedCompanies,
      },
      severity: 'MEDIUM',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Company filters updated',
      data: updated,
    });
  } catch (err) {
    console.error('Error updating filters:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update company filters',
    });
  }
}

/**
 * Update data quality filters
 */
export async function updateDataQualityFilters(req: Request, res: Response) {
  try {
    const { minSalaryDataQuality, minDescriptionLength, filterDuplicates } = req.body;

    if (minSalaryDataQuality !== undefined && (minSalaryDataQuality < 0 || minSalaryDataQuality > 100)) {
      return res.status(400).json({ success: false, error: 'Quality must be 0-100' });
    }

    if (minDescriptionLength !== undefined && minDescriptionLength < 0) {
      return res.status(400).json({ success: false, error: 'Description length cannot be negative' });
    }

    const updated = await ScraperConfig.findOneAndUpdate(
      {},
      {
        minSalaryDataQuality: minSalaryDataQuality !== undefined ? minSalaryDataQuality : undefined,
        minDescriptionLength: minDescriptionLength !== undefined ? minDescriptionLength : undefined,
        filterDuplicates: filterDuplicates !== undefined ? filterDuplicates : undefined,
        lastUpdatedBy: (req as any).user?.id,
      },
      { new: true, omitUndefined: true }
    );

    // Log activity
    await AdminActivityLog.create({
      adminId: (req as any).user?.id,
      action: 'UPDATE_DATA_QUALITY_FILTERS',
      resource: 'ScraperConfig',
      resourceId: updated?._id?.toString(),
      changes: {
        minSalaryDataQuality,
        minDescriptionLength,
        filterDuplicates,
      },
      severity: 'MEDIUM',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Data quality filters updated',
      data: updated,
    });
  } catch (err) {
    console.error('Error updating data quality:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update data quality filters',
    });
  }
}

/**
 * Get scraper cost summary
 */
export async function getScraperCostSummary(req: Request, res: Response) {
  try {
    const config = await ScraperConfig.findOne();

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Scraper config not found',
      });
    }

    const budgetUsagePercent = config.monthlyBudget > 0 
      ? (config.estimatedMonthlyCost || 0) / config.monthlyBudget * 100 
      : 0;

    const isOverBudget = budgetUsagePercent > 100;
    const willExceedBudget = budgetUsagePercent > (config.alertThreshold || 80);

    res.json({
      success: true,
      data: {
        monthlyBudget: config.monthlyBudget,
        costPerApiCall: config.costPerApiCall,
        estimatedMonthlyCost: config.estimatedMonthlyCost || 0,
        monthlyUsageCount: config.monthlyUsageCount || 0,
        budgetUsagePercent,
        isOverBudget,
        willExceedBudget,
        alertThreshold: config.alertThreshold,
        remainingBudget: Math.max(0, config.monthlyBudget - (config.estimatedMonthlyCost || 0)),
      },
    });
  } catch (err) {
    console.error('Error fetching cost summary:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cost summary',
    });
  }
}

/**
 * Helper function to calculate next scheduled run
 */
function calculateNextRun(timeStr: string, frequency: string): Date {
  const now = new Date();
  const [time] = timeStr.split(' '); // Extract HH:MM from "HH:MM AM/PM IST"
  const [hours, minutes] = time.split(':').map(Number);

  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  // If time has passed today, schedule for next occurrence
  if (next <= now) {
    if (frequency === 'daily') {
      next.setDate(next.getDate() + 1);
    } else if (frequency === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else if (frequency === 'monthly') {
      next.setMonth(next.getMonth() + 1);
    }
  }

  return next;
}

/**
 * Test scraper configuration
 */
export async function testScraperConfig(req: Request, res: Response) {
  try {
    const config = await ScraperConfig.findOne();

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Scraper config not found',
      });
    }

    const testResults = {
      configEnabled: config.enabled,
      rateLimitsSet: config.maxRequestsPerHour > 0 && config.maxRequestsPerDay > 0,
      budgetConfigured: config.monthlyBudget > 0,
      autoScrapeConfigured: config.autoScrapeEnabled,
      nextScheduledRun: config.nextScheduledRun,
      warnings: [] as string[],
    };

    // Check for potential issues
    if (!config.enabled) {
      testResults.warnings.push('Scraper is currently disabled');
    }

    if (!config.monthlyBudget || config.monthlyBudget === 0) {
      testResults.warnings.push('No monthly budget configured');
    }

    if (config.estimatedMonthlyCost && config.monthlyBudget && config.estimatedMonthlyCost > config.monthlyBudget) {
      testResults.warnings.push('Estimated cost exceeds monthly budget');
    }

    res.json({
      success: true,
      data: testResults,
    });
  } catch (err) {
    console.error('Error testing scraper config:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to test scraper configuration',
    });
  }
}
