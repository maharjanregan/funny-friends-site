"use client";

import { useEffect } from "react";

export default function InputPage() {
  useEffect(() => {
    // Rant composer is now inside the Room.
    window.location.replace("/quote");
  }, []);

  return null;
}
