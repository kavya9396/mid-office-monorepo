import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { authReducer, sessionExpired } from "@insurance-poc/utils";
import { groupInboxApi } from "../services/inboxApi";

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: sessionExpired,
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(groupInboxApi.util.resetApiState());
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [groupInboxApi.reducerPath]: groupInboxApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware).concat(groupInboxApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
