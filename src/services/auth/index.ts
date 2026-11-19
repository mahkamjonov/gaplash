import "server-only";

import { cache } from "react";

import { IS_MOCK_MODE } from "@/config/app";

import { mockAuthService } from "./mock";
import { supabaseAuthService } from "./supabase";

const service = IS_MOCK_MODE ? mockAuthService : supabaseAuthService;

/** Deduplicated within one request, so a page can ask for the user as often as it needs to. */
export const getCurrentUser = cache(() => service.getCurrentUser());

export const signInWithPassword = service.signInWithPassword;
export const signUpWithPassword = service.signUpWithPassword;
export const sendMagicLink = service.sendMagicLink;
export const startGoogleSignIn = service.startGoogleSignIn;
export const completeSignIn = service.completeSignIn;
export const signOut = service.signOut;
