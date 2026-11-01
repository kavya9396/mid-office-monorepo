import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { authApi } from "@insurance-poc/common/auth-api";
import { authReducer, sessionExpired } from "@insurance-poc/utils";
import { retailInboxApi } from "../services/inboxApi";

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: sessionExpired,
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(retailInboxApi.util.resetApiState());
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [retailInboxApi.reducerPath]: retailInboxApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(authApi.middleware, retailInboxApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
