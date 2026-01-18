import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

interface UserPreferences {
  preferredRoles: string[];
  preferredLocations: string[];
  preferredIndustries: string[];
  salaryRange: { min: number; max: number };
  jobTypes: string[];
  experienceLevel: string;
  remotePreference: 'remote' | 'hybrid' | 'onsite' | 'any';
}

const POPULAR_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Scientist',
  'Product Manager',
  'UX Designer',
  'QA Engineer',
  'Architect',
];

const POPULAR_LOCATIONS = [
  'Bangalore',
  'Mumbai',
  'Delhi',
  'Pune',
  'Hyderabad',
  'Gurgaon',
  'Chennai',
  'Kolkata',
  'Remote',
];

const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Retail',
  'Manufacturing',
  'Consulting',
  'Education',
  'Media',
];

const JOB_TYPES = ['Full-time', 'Contract', 'Part-time', 'Internship', 'Freelance'];

const EXPERIENCE_LEVELS = ['Fresher', 'Junior', 'Mid-level', 'Senior', 'Lead', 'Manager', 'Executive'];

export default function UserProfileTags() {
  const { user, updateUser } = useAuthStore();
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferredRoles: [],
    preferredLocations: [],
    preferredIndustries: [],
    salaryRange: { min: 300000, max: 2000000 },
    jobTypes: [],
    experienceLevel: 'Mid-level',
    remotePreference: 'any',
  });

  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage or API
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  const addRole = (role: string) => {
    if (role && !preferences.preferredRoles.includes(role)) {
      setPreferences({
        ...preferences,
        preferredRoles: [...preferences.preferredRoles, role],
      });
      setNewRole('');
    }
  };

  const removeRole = (role: string) => {
    setPreferences({
      ...preferences,
      preferredRoles: preferences.preferredRoles.filter((r) => r !== role),
    });
  };

  const addLocation = (location: string) => {
    if (location && !preferences.preferredLocations.includes(location)) {
      setPreferences({
        ...preferences,
        preferredLocations: [...preferences.preferredLocations, location],
      });
      setNewLocation('');
    }
  };

  const removeLocation = (location: string) => {
    setPreferences({
      ...preferences,
      preferredLocations: preferences.preferredLocations.filter((l) => l !== location),
    });
  };

  const addIndustry = (industry: string) => {
    if (industry && !preferences.preferredIndustries.includes(industry)) {
      setPreferences({
        ...preferences,
        preferredIndustries: [...preferences.preferredIndustries, industry],
      });
      setNewIndustry('');
    }
  };

  const removeIndustry = (industry: string) => {
    setPreferences({
      ...preferences,
      preferredIndustries: preferences.preferredIndustries.filter((i) => i !== industry),
    });
  };

  const toggleJobType = (type: string) => {
    if (preferences.jobTypes.includes(type)) {
      setPreferences({
        ...preferences,
        jobTypes: preferences.jobTypes.filter((t) => t !== type),
      });
    } else {
      setPreferences({
        ...preferences,
        jobTypes: [...preferences.jobTypes, type],
      });
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      // Save to localStorage
      localStorage.setItem('userPreferences', JSON.stringify(preferences));

      // Save to backend
      const token = localStorage.getItem('token');
      if (token && user?._id) {
        await fetch(`/api/users/${user._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ preferences }),
        });
      }

      toast.success('Preferences saved successfully!');
    } catch (error) {
      toast.error('Failed to save preferences');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Job Preferences & Tags</h1>
        <p className="text-muted-foreground mt-2">
          Customize your job preferences to get better personalized matches
        </p>
      </div>

      {/* Preferred Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Preferred Job Roles</CardTitle>
          <CardDescription>Which roles interest you most?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {preferences.preferredRoles.map((role) => (
              <Badge key={role} className="gap-1 pr-1">
                {role}
                <button onClick={() => removeRole(role)} className="ml-1 hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => addRole(newRole)} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Role
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferred Locations */}
      <Card>
        <CardHeader>
          <CardTitle>Preferred Locations</CardTitle>
          <CardDescription>Where would you like to work?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {preferences.preferredLocations.map((location) => (
              <Badge key={location} className="gap-1 pr-1">
                {location}
                <button onClick={() => removeLocation(location)} className="ml-1 hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Select value={newLocation} onValueChange={setNewLocation}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a location..." />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_LOCATIONS.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => addLocation(newLocation)} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Location
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferred Industries */}
      <Card>
        <CardHeader>
          <CardTitle>Preferred Industries</CardTitle>
          <CardDescription>Which industries interest you?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {preferences.preferredIndustries.map((industry) => (
              <Badge key={industry} className="gap-1 pr-1">
                {industry}
                <button onClick={() => removeIndustry(industry)} className="ml-1 hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Select value={newIndustry} onValueChange={setNewIndustry}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select an industry..." />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => addIndustry(newIndustry)} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Industry
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Types */}
      <Card>
        <CardHeader>
          <CardTitle>Job Types</CardTitle>
          <CardDescription>Which employment types work for you?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {JOB_TYPES.map((type) => (
              <Badge
                key={type}
                variant={preferences.jobTypes.includes(type) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleJobType(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Other Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Other Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Experience Level */}
            <div>
              <label className="text-sm font-medium">Experience Level</label>
              <Select value={preferences.experienceLevel} onValueChange={(value) =>
                setPreferences({ ...preferences, experienceLevel: value })
              }>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Remote Preference */}
            <div>
              <label className="text-sm font-medium">Remote Preference</label>
              <Select
                value={preferences.remotePreference}
                onValueChange={(value: any) =>
                  setPreferences({ ...preferences, remotePreference: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote Only</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Salary Range */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Expected Salary Range (INR)</label>
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={preferences.salaryRange.min}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        salaryRange: {
                          ...preferences.salaryRange,
                          min: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Max"
                    value={preferences.salaryRange.max}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        salaryRange: {
                          ...preferences.salaryRange,
                          max: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button onClick={savePreferences} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
