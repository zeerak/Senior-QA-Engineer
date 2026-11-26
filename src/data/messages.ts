/** User-facing error messages, kept in one place so a copy change is a one-line fix. */
export const LOGIN_ERRORS = {
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  invalidCredentials: 'Epic sadface: Username and password do not match any user in this service',
  usernameRequired: 'Epic sadface: Username is required',
  passwordRequired: 'Epic sadface: Password is required',
  notLoggedIn: (path: string) => `Epic sadface: You can only access '${path}' when you are logged in.`,
} as const;

export const CHECKOUT_ERRORS = {
  firstNameRequired: 'Error: First Name is required',
  lastNameRequired: 'Error: Last Name is required',
  postalCodeRequired: 'Error: Postal Code is required',
} as const;

export const ORDER_COMPLETE = {
  header: 'Thank you for your order!',
  text: 'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
} as const;
