import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("pricing", "routes/pricing.tsx"),
  route("demo", "routes/demo.tsx"),
  route("docs", "routes/docs.tsx"),
  route("blog", "routes/blog._index.tsx"),
  route("solutions/:slug", "routes/solutions.$slug.tsx"),
  route("login", "routes/login.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
  route("pay", "routes/pay.tsx"), // Paddle default-payment-link bridge (public; opens the _ptxn checkout)
  route("terms", "routes/terms.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("refunds", "routes/refunds.tsx"),
  layout("routes/app.tsx", [
    ...prefix("app", [
      route("dashboard", "routes/app.dashboard.tsx"),
      route("narrate", "routes/app.narrate.tsx"),
      route("voices", "routes/app.voices.tsx"),
      route("voices/new", "routes/app.voices.new.tsx"),
      route("billing", "routes/app.billing.tsx"),
      route("admin", "routes/app.admin.tsx"),
      route("admin/users", "routes/app.admin.users.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
