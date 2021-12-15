import { Link, React, init_react } from "/build/_shared/chunk-4WKUNRPC.js";

// browser-route-module:/Users/kentcdodds/code/remix/examples/infinite-scroll/app/routes/index.tsx?browser
init_react();

// app/routes/index.tsx
init_react();
function IndexRoute() {
  return /* @__PURE__ */ React.createElement(
    "div",
    null,
    /* @__PURE__ */ React.createElement("h1", null, "Infinite Scroll Demo"),
    /* @__PURE__ */ React.createElement(
      "p",
      null,
      "There are two demos here. The first shows how to do this in a simple way that's pretty standard for this type of user experience you have around the web. The second is a bit more advanced but a much better user experience. Pick your preferred method."
    ),
    /* @__PURE__ */ React.createElement(
      "ul",
      null,
      /* @__PURE__ */ React.createElement(
        "li",
        null,
        /* @__PURE__ */ React.createElement(
          Link,
          {
            to: "/simple"
          },
          "Simple"
        )
      ),
      /* @__PURE__ */ React.createElement(
        "li",
        null,
        /* @__PURE__ */ React.createElement(
          Link,
          {
            to: "/advanced"
          },
          "Advanced"
        )
      )
    )
  );
}
export { IndexRoute as default };
//# sourceMappingURL=/build/routes/index-376Y3M7M.js.map
