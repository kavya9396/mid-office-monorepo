import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthState = {
  isAuthenticated: boolean;
  username: string | null;
  redirectToLogin: boolean;
};

const initialState: AuthState = {
  isAuthenticated: false,
  username: null,
  redirectToLogin: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSucceeded(state, action: PayloadAction<{ username: string }>) {
      state.isAuthenticated = true;
      state.username = action.payload.username;
      state.redirectToLogin = false;
    },
    sessionExpired(state) {
      state.isAuthenticated = false;
      state.username = null;
      state.redirectToLogin = true;
    },
    redirectHandled(state) {
      state.redirectToLogin = false;
    },
  },
});

export const { loginSucceeded, sessionExpired, redirectHandled } = authSlice.actions;

export const authReducer = authSlice.reducer;
