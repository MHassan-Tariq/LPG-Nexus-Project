"use client";

import { useState, useEffect } from "react";
import { Save, MessageSquare, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function ChatbotSettingsTab() {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Load chatbot visibility setting
    setIsLoading(true);
    fetch("/api/settings/chatbot-visibility")
      .then((res) => res.json())
      .then((data) => {
        // Default to true if not set
        setIsVisible(data.visible !== false);
      })
      .catch((err) => {
        console.error("Error loading chatbot visibility:", err);
        setIsVisible(true); // Default to visible on error
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/settings/chatbot-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: isVisible }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save settings");
        return;
      }

      setSuccess("Chatbot visibility settings saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
      
      // Reload the page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 p-3 text-white">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold">Chatbot Settings</CardTitle>
              <CardDescription>Control chatbot visibility and behavior</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chatbot Visibility Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                {isVisible ? (
                  <Eye className="h-5 w-5 text-green-600" />
                ) : (
                  <EyeOff className="h-5 w-5 text-slate-400" />
                )}
                <div>
                  <Label htmlFor="chatbot-visibility" className="text-base font-semibold cursor-pointer">
                    Show Chatbot
                  </Label>
                  <p className="text-sm text-slate-600">
                    {isVisible 
                      ? "The chatbot icon is visible in the bottom-right corner of the application."
                      : "The chatbot icon is hidden and users cannot access it."}
                  </p>
                </div>
              </div>
              <Switch
                id="chatbot-visibility"
                checked={isVisible}
                onCheckedChange={setIsVisible}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              {success}
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-slate-900">About Chatbot</h4>
            <p className="text-sm text-slate-600">
              The chatbot helps users quickly access information about customers, inventory, sales, payments, and deliveries. 
              When enabled, users can click the chatbot icon in the bottom-right corner to ask questions and get instant answers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

