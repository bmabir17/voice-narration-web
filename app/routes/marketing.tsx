import { Outlet } from "react-router";
import { Header } from "~/components/Header";

// Pathless layout for the PUBLIC pages (home, pricing, demo, docs, blog, solutions, legal, login).
// Renders the top nav above each; /app/* is intentionally outside this (it has its own authed nav).
export default function MarketingLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}
