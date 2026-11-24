import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { authApi } from "@insurance-poc/common/auth-api";
import { authReducer, sessionExpired } from "@insurance-poc/utils";
import { retailBreRetriggerApi } from "../services/breRetriggerApi";
import { retailCompleteTaskApi } from "../services/completeTaskApi";
import { retailCvtValidationApi } from "../services/cvtValidationApi";
import { retailDrsApi } from "../services/drsApi";
import { retailMmtGrievanceApi } from "../services/mmtGrievanceService";
import { retailFinancialApi } from "../services/financialApi";
import { retailInboxApi } from "../services/inboxApi";

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: sessionExpired,
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(retailInboxApi.util.resetApiState());
    listenerApi.dispatch(retailCompleteTaskApi.util.resetApiState());
    listenerApi.dispatch(retailDrsApi.util.resetApiState());
    listenerApi.dispatch(retailMmtGrievanceApi.util.resetApiState());
    listenerApi.dispatch(retailBreRetriggerApi.util.resetApiState());
    listenerApi.dispatch(retailFinancialApi.util.resetApiState());
    listenerApi.dispatch(retailCvtValidationApi.util.resetApiState());
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [retailInboxApi.reducerPath]: retailInboxApi.reducer,
    [retailCompleteTaskApi.reducerPath]: retailCompleteTaskApi.reducer,
    [retailDrsApi.reducerPath]: retailDrsApi.reducer,
    [retailMmtGrievanceApi.reducerPath]: retailMmtGrievanceApi.reducer,
    [retailBreRetriggerApi.reducerPath]: retailBreRetriggerApi.reducer,
    [retailFinancialApi.reducerPath]: retailFinancialApi.reducer,
    [retailCvtValidationApi.reducerPath]: retailCvtValidationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(
        authApi.middleware,
        retailInboxApi.middleware,
        retailCompleteTaskApi.middleware,
        retailDrsApi.middleware,
        retailMmtGrievanceApi.middleware,
        retailBreRetriggerApi.middleware,
        retailFinancialApi.middleware,
        retailCvtValidationApi.middleware,
      ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
