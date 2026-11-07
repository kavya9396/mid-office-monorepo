import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { authApi } from "@insurance-poc/common/auth-api";
import { authReducer, sessionExpired } from "@insurance-poc/utils";
import { groupDrsApi } from "../services/drsApi";
import { groupFinancialApi } from "../services/financialApi";
import { groupInboxApi } from "../services/inboxApi";

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: sessionExpired,
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(groupInboxApi.util.resetApiState());
    listenerApi.dispatch(groupDrsApi.util.resetApiState());
    listenerApi.dispatch(groupFinancialApi.util.resetApiState());
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [groupInboxApi.reducerPath]: groupInboxApi.reducer,
    [groupDrsApi.reducerPath]: groupDrsApi.reducer,
    [groupFinancialApi.reducerPath]: groupFinancialApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(
        authApi.middleware,
        groupInboxApi.middleware,
        groupDrsApi.middleware,
        groupFinancialApi.middleware,
      ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
