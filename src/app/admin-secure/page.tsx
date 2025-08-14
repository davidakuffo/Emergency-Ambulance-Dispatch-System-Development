"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminSecureRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main admin page
    router.replace("/admin");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
        <p className="text-lg">Redirecting to Fleet Management...</p>
        <p className="text-sm text-gray-300 mt-2">Admin access is now integrated into the main fleet management page</p>
      </div>
    </div>
  );
}
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState("");

