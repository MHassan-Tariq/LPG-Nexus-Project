"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AIChatbot } from "./ai-chatbot";

export function ChatbotWrapper() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState<boolean | null>(null);

  useEffect(() => {
    // Check chatbot visibility setting
    fetch("/api/settings/chatbot-visibility")
      .then((res) => res.json())
      .then((data) => {
        setIsVisible(data.visible !== false); // Default to true if not set
      })
      .catch((err) => {
        console.error("Error loading chatbot visibility:", err);
        setIsVisible(true); // Default to visible on error
      });
  }, []);

  // Don't show chatbot on login, registration, forgot-password, or 404 pages
  if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/404") {
    return null;
  }

  // Don't render anything until we know the visibility setting
  if (isVisible === null) {
    return null;
  }

  // Only render chatbot if visible is true
  if (!isVisible) {
    return null;
  }

  return <AIChatbot />;
}

