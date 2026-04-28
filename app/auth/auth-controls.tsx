"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { useAuthSession } from "./session-provider";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.198 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4c-7.682 0-14.382 4.337-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.193l-6.191-5.238C29.136 35.091 26.696 36 24 36c-5.177 0-9.62-3.331-11.283-7.946l-6.522 5.025C9.474 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.06 12.06 0 0 1-4.085 5.569l6.191 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export default function AuthControls() {
  const { user, isAdmin, loading } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use one guarded async flow per auth action to avoid duplicate requests.
  const handleEmailSignUp = async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Email sign-up failed", error);
      setMessage("Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSignIn = async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword("");
    } catch (error) {
      console.error("Email sign-in failed", error);
      setMessage("Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google sign-in failed", error);
      setMessage("Unable to sign in with Google.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed", error);
      setMessage("Unable to sign out.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <span className="top-nav-auth-note">Auth loading...</span>;
  }

  if (user) {
    return (
      <div className="top-nav-auth-controls">
        <span className="top-nav-auth-note">
          {user.email ?? "Signed in"}
          {isAdmin ? " (Admin)" : ""}
        </span>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSignOut}
          disabled={isSubmitting}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="top-nav-auth-controls">
      <input
        type="email"
        name="auth-email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="top-nav-auth-input"
        placeholder="Email"
        autoComplete="new-password"
        autoCapitalize="off"
        spellCheck={false}
      />
      <input
        type="password"
        name="auth-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="top-nav-auth-input"
        placeholder="Password"
        autoComplete="new-password"
        autoCapitalize="off"
        spellCheck={false}
      />
      <div className="top-nav-auth-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleEmailSignIn}
          disabled={isSubmitting || !email.trim() || password.length < 6}
        >
          Sign In
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleEmailSignUp}
          disabled={isSubmitting || !email.trim() || password.length < 6}
        >
          Sign Up
        </button>
        <button
          type="button"
          className="top-nav-google-btn"
          aria-label="Sign in with Google"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
        >
          <GoogleLogo />
        </button>
      </div>
      {message ? <span className="top-nav-auth-note">{message}</span> : null}
    </div>
  );
}
