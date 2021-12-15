import {
  Links,
  LiveReload,
  Meta,
  React,
  Scripts,
  ScrollRestoration,
  import_react_router_dom,
  init_react
} from "/build/_shared/chunk-GYJVAOEO.js";

// browser-route-module:/Users/kentcdodds/code/remix/examples/infinite-scroll/app/root.tsx?browser
init_react();

// app/root.tsx
init_react();
function App() {
  return /* @__PURE__ */ React.createElement(
    "html",
    {
      lang: "en"
    },
    /* @__PURE__ */ React.createElement(
      "head",
      null,
      /* @__PURE__ */ React.createElement("meta", {
        charSet: "utf-8"
      }),
      /* @__PURE__ */ React.createElement("meta", {
        name: "viewport",
        content: "width=device-width,initial-scale=1"
      }),
      /* @__PURE__ */ React.createElement(Meta, null),
      /* @__PURE__ */ React.createElement("link", {
        rel: "icon",
        href: "/favicon.ico"
      }),
      /* @__PURE__ */ React.createElement(Links, null)
    ),
    /* @__PURE__ */ React.createElement(
      "body",
      null,
      /* @__PURE__ */ React.createElement(import_react_router_dom.Outlet, null),
      /* @__PURE__ */ React.createElement(ScrollRestoration, null),
      /* @__PURE__ */ React.createElement(Scripts, null),
      /* @__PURE__ */ React.createElement(LiveReload, null)
    )
  );
}
export { App as default };
//# sourceMappingURL=/build/root-3UXI5AGO.js.map
