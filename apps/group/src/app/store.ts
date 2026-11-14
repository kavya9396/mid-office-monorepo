import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { authApi } from "@insurance-poc/common/auth-api";
import { authReducer, sessionExpired } from "@insurance-poc/utils";
import { groupDrsApi } from "../services/drsApi";
import { groupFinancialApi } from "../services/financialApi";
import { groupBreRetriggerApi } from "../services/breRetriggerApi";
import { groupCompleteTaskApi } from "../services/completeTaskApi";
import { groupInboxApi } from "../services/inboxApi";
import { groupNsdlApi } from "../services/nsdlApi";
import { mmtGrievanceApi } from "../services/mmtGrievanceApi";

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: sessionExpired,
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(groupInboxApi.util.resetApiState());
    listenerApi.dispatch(groupDrsApi.util.resetApiState());
    listenerApi.dispatch(groupFinancialApi.util.resetApiState());
    listenerApi.dispatch(groupCompleteTaskApi.util.resetApiState());
    listenerApi.dispatch(groupNsdlApi.util.resetApiState());
    listenerApi.dispatch(groupBreRetriggerApi.util.resetApiState());
    listenerApi.dispatch(mmtGrievanceApi.util.resetApiState());
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [groupInboxApi.reducerPath]: groupInboxApi.reducer,
    [groupDrsApi.reducerPath]: groupDrsApi.reducer,
    [groupFinancialApi.reducerPath]: groupFinancialApi.reducer,
    [groupCompleteTaskApi.reducerPath]: groupCompleteTaskApi.reducer,
    [groupNsdlApi.reducerPath]: groupNsdlApi.reducer,
    [groupBreRetriggerApi.reducerPath]: groupBreRetriggerApi.reducer,
    [mmtGrievanceApi.reducerPath]: mmtGrievanceApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(
        authApi.middleware,
        groupInboxApi.middleware,
        groupDrsApi.middleware,
        groupFinancialApi.middleware,
        groupCompleteTaskApi.middleware,
        groupNsdlApi.middleware,
        groupBreRetriggerApi.middleware,
        mmtGrievanceApi.middleware,
      ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
