import { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle2, Settings, Zap, DollarSign, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ScraperConfig {
  _id: string;
  enabled: boolean;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
  defaultPages: number;
  maxPagesAllowed: number;
  minSalaryDataQuality: number;
  minDescriptionLength: number;
  filterDuplicates: boolean;
  autoScrapeEnabled: boolean;
  autoScrapeFrequency: string;
  autoScrapeTime: string;
  skipWeekends: boolean;
  skipHolidays: boolean;
  monthlyBudget: number;
  costPerApiCall: number;
  alertThreshold: number;
  estimatedMonthlyCost: number;
  monthlyUsageCount: number;
  blacklistedCompanies: string[];
  whitelistedCompanies: string[];
}

export default function AdminScraperConfig() {
  const [config, setConfig] = useState<ScraperConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [costSummary, setCostSummary] = useState<any>(null);

  // Editable state
  const [editConfig, setEditConfig] = useState<Partial<ScraperConfig>>({});

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/scraper/config', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch config');

      const data = await response.json();
      setConfig(data.data);
      setEditConfig(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchCostSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/scraper/cost-summary', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch cost summary');

      const data = await response.json();
      setCostSummary(data.data);
    } catch (err) {
      console.error('Error fetching cost summary:', err);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchCostSummary();
  }, []);

  const handleSave = async (endpoint: string = '/api/admin/scraper/config', body: any = editConfig) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to save');

      const data = await response.json();
      setConfig(data.data);
      setSuccess('Configuration saved successfully');
      setTimeout(() => setSuccess(null), 3000);
      fetchCostSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Scraper Configuration
          </h1>
          <p className="text-muted-foreground">Manage LinkedIn job scraper settings and limits</p>
        </div>
        <Button onClick={() => fetchConfig()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-green-800">{success}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Status Card */}
      {config && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${config.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-semibold">{config.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Auto-Scrape
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="font-semibold">{config.autoScrapeEnabled ? 'Enabled' : 'Disabled'}</span>
              {config.autoScrapeEnabled && (
                <p className="text-xs text-muted-foreground mt-1">{config.autoScrapeFrequency}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Budget Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {costSummary && (
                <div>
                  <span className="font-semibold text-lg">
                    {costSummary.budgetUsagePercent.toFixed(0)}%
                  </span>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        costSummary.isOverBudget ? 'bg-red-500' : costSummary.willExceedBudget ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(costSummary.budgetUsagePercent, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      {config && (
        <Tabs defaultValue="rate-limits" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="quality">Data Quality</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
          </TabsList>

          {/* Rate Limits Tab */}
          <TabsContent value="rate-limits">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Rate Limiting Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Max Requests/Hour</label>
                    <Input
                      type="number"
                      min="1"
                      value={editConfig.maxRequestsPerHour || 0}
                      onChange={(e) =>
                        setEditConfig({ ...editConfig, maxRequestsPerHour: parseInt(e.target.value) })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Max Requests/Day</label>
                    <Input
                      type="number"
                      min="1"
                      value={editConfig.maxRequestsPerDay || 0}
                      onChange={(e) =>
                        setEditConfig({ ...editConfig, maxRequestsPerDay: parseInt(e.target.value) })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Default Pages to Scrape</label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={editConfig.defaultPages || 0}
                      onChange={(e) =>
                        setEditConfig({ ...editConfig, defaultPages: parseInt(e.target.value) })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Max Pages Allowed</label>
                    <Input
                      type="number"
                      min="5"
                      value={editConfig.maxPagesAllowed || 0}
                      onChange={(e) =>
                        setEditConfig({ ...editConfig, maxPagesAllowed: parseInt(e.target.value) })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave('/api/admin/scraper/rate-limits', editConfig)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Rate Limits
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Budget Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {costSummary && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3">Budget Summary</h3>
                    <div className="grid gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-800">Monthly Budget:</span>
                        <span className="font-semibold">₹{costSummary.monthlyBudget}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-800">Estimated Cost:</span>
                        <span className="font-semibold">₹{costSummary.estimatedMonthlyCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-800">Remaining:</span>
                        <span className="font-semibold">₹{costSummary.remainingBudget.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-200">
                        <span className="text-blue-800">API Calls:</span>
                        <span className="font-semibold">{costSummary.monthlyUsageCount}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Monthly Budget (₹)</label>
                    <Input
                      type="number"
                      min="0"
                      value={editConfig.monthlyBudget || 0}
                      onChange={(e) =>
                        setEditConfig({ ...editConfig, monthlyBudget: parseFloat(e.target.value) })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Cost per API Call (₹)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editConfig.costPerApiCall || 0}
                      onChange={(e) =>
                        setEditConfig({ ...editConfig, costPerApiCall: parseFloat(e.target.value) })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Alert Threshold (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={editConfig.alertThreshold || 0}
                      onChange={(e) =>
                        setEditConfig({ ...editConfig, alertThreshold: parseInt(e.target.value) })
                      }
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Alert when budget usage exceeds this %</p>
                  </div>
                </div>

                <Button onClick={() => handleSave('/api/admin/scraper/budget', editConfig)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Budget Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Auto-Scrape Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={editConfig.autoScrapeEnabled || false}
                    onCheckedChange={(checked) =>
                      setEditConfig({ ...editConfig, autoScrapeEnabled: checked })
                    }
                  />
                  <label className="text-sm font-medium">Enable Auto-Scraping</label>
                </div>

                {editConfig.autoScrapeEnabled && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Frequency</label>
                      <Select
                        value={editConfig.autoScrapeFrequency || 'daily'}
                        onValueChange={(value) =>
                          setEditConfig({ ...editConfig, autoScrapeFrequency: value })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Scrape Time</label>
                      <Input
                        type="time"
                        value={editConfig.autoScrapeTime?.split(' ')[0] || '02:00'}
                        onChange={(e) =>
                          setEditConfig({
                            ...editConfig,
                            autoScrapeTime: `${e.target.value} AM IST`,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={editConfig.skipWeekends || false}
                      onCheckedChange={(checked) =>
                        setEditConfig({ ...editConfig, skipWeekends: checked })
                      }
                    />
                    <label className="text-sm font-medium">Skip Weekends</label>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={editConfig.skipHolidays || false}
                      onCheckedChange={(checked) =>
                        setEditConfig({ ...editConfig, skipHolidays: checked })
                      }
                    />
                    <label className="text-sm font-medium">Skip Holidays</label>
                  </div>
                </div>

                <Button onClick={() => handleSave('/api/admin/scraper/schedule', editConfig)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Schedule
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Quality Tab */}
          <TabsContent value="quality">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Data Quality Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Min Salary Data Quality (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={editConfig.minSalaryDataQuality || 0}
                      onChange={(e) =>
                        setEditConfig({ ...editConfig, minSalaryDataQuality: parseInt(e.target.value) })
                      }
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Minimum salary completeness</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Min Description Length</label>
                    <Input
                      type="number"
                      min="0"
                      value={editConfig.minDescriptionLength || 0}
                      onChange={(e) =>
                        setEditConfig({ ...editConfig, minDescriptionLength: parseInt(e.target.value) })
                      }
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Minimum characters in job description</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={editConfig.filterDuplicates || false}
                    onCheckedChange={(checked) =>
                      setEditConfig({ ...editConfig, filterDuplicates: checked })
                    }
                  />
                  <label className="text-sm font-medium">Filter Duplicate Jobs</label>
                </div>

                <Button onClick={() => handleSave('/api/admin/scraper/data-quality', editConfig)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Quality Filters
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle>Company Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium">Blacklisted Companies</label>
                  <p className="text-xs text-muted-foreground mb-2">Comma-separated company names to exclude</p>
                  <textarea
                    className="w-full border rounded-lg p-2 text-sm font-mono"
                    rows={4}
                    value={(editConfig.blacklistedCompanies || []).join(', ')}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        blacklistedCompanies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Whitelisted Companies</label>
                  <p className="text-xs text-muted-foreground mb-2">Comma-separated company names to prioritize</p>
                  <textarea
                    className="w-full border rounded-lg p-2 text-sm font-mono"
                    rows={4}
                    value={(editConfig.whitelistedCompanies || []).join(', ')}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        whitelistedCompanies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>

                <Button onClick={() => handleSave('/api/admin/scraper/company-filters', editConfig)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Company Filters
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
