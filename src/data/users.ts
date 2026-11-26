/**
 * SauceDemo test accounts. These are public demo credentials published on the
 * login page itself, so they are safe to commit. The password can still be
 * overridden through the environment to mirror how real secrets would be handled.
 */
export const PASSWORD = process.env.SAUCE_PASSWORD ?? 'secret_sauce';

export const USERS = {
  standard: 'standard_user',
  lockedOut: 'locked_out_user',
  problem: 'problem_user',
  performanceGlitch: 'performance_glitch_user',
  error: 'error_user',
  visual: 'visual_user',
} as const;

export type Username = (typeof USERS)[keyof typeof USERS];
