import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { authApi } from "@insurance-poc/common/auth-api";
import { authReducer, sessionExpired } from "@insurance-poc/utils";
import { retailBreRetriggerApi } from "../services/breRetriggerApi";
import { retailCompleteTaskApi } from "../services/completeTaskApi";
import { retailDrsApi } from "../services/drsApi";
import { retailInboxApi } from "../services/inboxApi";

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: sessionExpired,
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(retailInboxApi.util.resetApiState());
    listenerApi.dispatch(retailCompleteTaskApi.util.resetApiState());
    listenerApi.dispatch(retailDrsApi.util.resetApiState());
    listenerApi.dispatch(retailBreRetriggerApi.util.resetApiState());
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [retailInboxApi.reducerPath]: retailInboxApi.reducer,
    [retailCompleteTaskApi.reducerPath]: retailCompleteTaskApi.reducer,
    [retailDrsApi.reducerPath]: retailDrsApi.reducer,
    [retailBreRetriggerApi.reducerPath]: retailBreRetriggerApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(
        authApi.middleware,
        retailInboxApi.middleware,
        retailCompleteTaskApi.middleware,
        retailDrsApi.middleware,
        retailBreRetriggerApi.middleware,
      ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
