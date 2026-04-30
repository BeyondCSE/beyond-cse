"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

export default function AuthModal({
  isOpen,
  onClose,
  mode,
}: {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "signup";
}) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  if (!isOpen) return null;

  // 🔐 Email/Password Auth
  const handleAuth = async () => {
    try {
      if (currentMode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      onClose();
      router.push("/dashboard"); // 🚀 redirect
    } catch (error: any) {
      alert(error.message);
    }
  };

  // 🔵 Google Auth
  const handleGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      try {
  await signInWithPopup(auth, provider);
} catch (error: any) {
  if (error.code !== "auth/cancelled-popup-request") {
    console.error(error);
  }
}

      onClose();
      router.push("/dashboard"); // 🚀 redirect
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      
      {/* Modal Box */}
      <div className="w-[350px] p-6 rounded-2xl bg-[#0a0a0a]/80 border border-[#00f0ff]/30 shadow-[0_0_30px_#00f0ff] relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-[#00f0ff] text-center mb-6">
          {currentMode === "login" ? "Login" : "Sign Up"}
        </h2>

        {/* Inputs */}
        <div className="flex flex-col gap-4">
          
          {currentMode === "signup" && (
            <input
              type="text"
              placeholder="Full Name"
              className="px-4 py-2 rounded-lg bg-black/50 border border-gray-700 focus:border-[#00f0ff] outline-none text-white"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-2 rounded-lg bg-black/50 border border-gray-700 focus:border-[#00f0ff] outline-none text-white"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-2 rounded-lg bg-black/50 border border-gray-700 focus:border-[#00f0ff] outline-none text-white"
          />

          {/* Main Button */}
          <button
            onClick={handleAuth}
            className="mt-2 py-2 rounded-lg bg-[#00f0ff] text-black font-semibold hover:opacity-90 transition"
          >
            {currentMode === "login" ? "Login" : "Create Account"}
          </button>

          {/* Google Button */}
          <button
            onClick={handleGoogle}
            className="py-2 rounded-lg border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff]/10 transition"
          >
            Continue with Google
          </button>

        </div>

        {/* Switch Mode */}
        <p className="text-sm text-gray-400 text-center mt-4">
          {currentMode === "login" ? "New here?" : "Already have an account?"}{" "}
          <span
            onClick={() =>
              setCurrentMode(currentMode === "login" ? "signup" : "login")
            }
            className="text-[#00f0ff] cursor-pointer hover:underline"
          >
            {currentMode === "login" ? "Sign Up" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
}