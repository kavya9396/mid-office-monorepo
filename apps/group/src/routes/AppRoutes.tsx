import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { appBasename, viteBase } from "@insurance-poc/routes";
import { GroupDrsPage } from "../modules/drs/GroupDrsPage";
import { GroupInboxPage } from "../modules/inbox/GroupInboxPage";
import { GroupAppLayout } from "./GroupAppLayout";
import { RequireSession } from "./RequireSession";

export function AppRoutes() {
  return (
    <BrowserRouter basename={appBasename(viteBase.group)}>
      <Routes>
        <Route
          element={
            <RequireSession>
              <GroupAppLayout />
            </RequireSession>
          }
        >
          <Route index element={<Navigate to="/inbox" replace />} />
          <Route path="/inbox" element={<GroupInboxPage />} />
          <Route path="/drs" element={<GroupDrsPage />} />
          <Route path="*" element={<Navigate to="/inbox" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
