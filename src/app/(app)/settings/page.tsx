"use client"

import { useRouter } from "next/navigation"
import { Settings, ArrowLeft, Bell, Shield, User, Moon, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { REMINDER_TIME_OPTIONS, requestNotificationPermission, getNotificationPermission } from "@/lib/notifications"

export default function SettingsPage() {
  const router = useRouter()
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window === "undefined") return "default"
    return getNotificationPermission()
  })
  const [defaultReminder, setDefaultReminder] = useState<number>(15)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("reminder-sound-enabled") === "true"
  })
  const [quietHoursStart, setQuietHoursStart] = useState(() => {
    if (typeof window === "undefined") return "22:00"
    return localStorage.getItem("quiet-hours-start") || "22:00"
  })
  const [quietHoursEnd, setQuietHoursEnd] = useState(() => {
    if (typeof window === "undefined") return "08:00"
    return localStorage.getItem("quiet-hours-end") || "08:00"
  })
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("quiet-hours-enabled") === "true"
  })

  const toggleSound = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    localStorage.setItem("reminder-sound-enabled", String(newValue))
  }

  const toggleQuietHours = () => {
    const newValue = !quietHoursEnabled
    setQuietHoursEnabled(newValue)
    localStorage.setItem("quiet-hours-enabled", String(newValue))
  }

  const updateQuietHoursStart = (value: string) => {
    setQuietHoursStart(value)
    localStorage.setItem("quiet-hours-start", value)
  }

  const updateQuietHoursEnd = (value: string) => {
    setQuietHoursEnd(value)
    localStorage.setItem("quiet-hours-end", value)
  }

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission()
    setNotificationPermission(permission)
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Notifications</CardTitle>
            </div>
            <CardDescription>
              Configure how you receive alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="browser-notifications">Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  {notificationPermission === "granted" 
                    ? "Notifications are enabled" 
                    : "Get notified about calendar events"}
                </p>
              </div>
              {notificationPermission !== "granted" ? (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleRequestPermission}
                  disabled={notificationPermission === "denied"}
                >
                  {notificationPermission === "denied" ? "Blocked" : "Enable"}
                </Button>
              ) : (
                <span className="text-sm text-green-600">Enabled</span>
              )}
            </div>

            <Separator />

            {/* Sound Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-notifications">Sound Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Play a sound when reminders trigger
                </p>
              </div>
              <Switch 
                id="sound-notifications" 
                checked={soundEnabled}
                onCheckedChange={toggleSound}
              />
            </div>

            <Separator />

            {/* Quiet Hours */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="quiet-hours">Quiet Hours</Label>
                  <p className="text-sm text-muted-foreground">
                    Suppress notifications during these hours
                  </p>
                </div>
                <Switch 
                  id="quiet-hours" 
                  checked={quietHoursEnabled}
                  onCheckedChange={toggleQuietHours}
                />
              </div>
              
              {quietHoursEnabled && (
                <div className="flex items-center gap-4 pl-4">
                  <div className="space-y-1">
                    <Label htmlFor="quiet-start" className="text-xs">From</Label>
                    <input
                      type="time"
                      id="quiet-start"
                      value={quietHoursStart}
                      onChange={(e) => updateQuietHoursStart(e.target.value)}
                      className="flex h-9 w-24 rounded-md border border-input bg-background px-2 py-1 text-sm"
                    />
                  </div>
                  <span className="text-muted-foreground">to</span>
                  <div className="space-y-1">
                    <Label htmlFor="quiet-end" className="text-xs">Until</Label>
                    <input
                      type="time"
                      id="quiet-end"
                      value={quietHoursEnd}
                      onChange={(e) => updateQuietHoursEnd(e.target.value)}
                      className="flex h-9 w-24 rounded-md border border-input bg-background px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Calendar</CardTitle>
            </div>
            <CardDescription>
              Default reminder settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-reminder">Default Reminder Time</Label>
              <p className="text-sm text-muted-foreground">
                Automatically add this reminder to new events
              </p>
              <select
                id="default-reminder"
                value={defaultReminder}
                onChange={(e) => setDefaultReminder(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value={0}>None</option>
                {REMINDER_TIME_OPTIONS.filter(o => o.value > 0).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Appearance</CardTitle>
            </div>
            <CardDescription>
              Customize the look and feel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle dark theme (follows system)
                </p>
              </div>
              <Switch id="dark-mode" disabled />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Account</CardTitle>
            </div>
            <CardDescription>
              Manage your account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="profile-visibility">Profile Visibility</Label>
                <p className="text-sm text-muted-foreground">
                  Make your profile visible to family
                </p>
              </div>
              <Switch id="profile-visibility" disabled />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Security</CardTitle>
            </div>
            <CardDescription>
              Manage your security preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
              <Switch id="two-factor" disabled />
            </div>
            <Separator />
            <Button variant="outline" className="w-full" disabled>
              Change Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
