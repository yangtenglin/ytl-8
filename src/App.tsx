import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import ProductionsPage from "@/pages/ProductionsPage";
import ActorsPage from "@/pages/ActorsPage";
import PropsLedgerPage from "@/pages/PropsLedgerPage";
import SchedulerPage from "@/pages/SchedulerPage";
import DataPage from "@/pages/DataPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/productions" replace />} />
          <Route path="/productions" element={<ProductionsPage />} />
          <Route path="/actors" element={<ActorsPage />} />
          <Route path="/props-ledger" element={<PropsLedgerPage />} />
          <Route path="/scheduler" element={<SchedulerPage />} />
          <Route path="/data" element={<DataPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
