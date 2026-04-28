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

export default function AuthControls() {
  const { user, isAdmin, loading } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          className="btn btn-secondary"
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
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="top-nav-auth-input"
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="top-nav-auth-input"
        placeholder="Password"
      />
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleEmailSignIn}
        disabled={isSubmitting || !email.trim() || password.length < 6}
      >
        Sign In
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleEmailSignUp}
        disabled={isSubmitting || !email.trim() || password.length < 6}
      >
        Sign Up
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting}
      >
        Google
      </button>
      {message ? <span className="top-nav-auth-note">{message}</span> : null}
    </div>
  );
}
