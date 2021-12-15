var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = target => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (
    (module2 && typeof module2 === "object") ||
    typeof module2 === "function"
  ) {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {
          get: () => module2[key],
          enumerable:
            !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable
        });
  }
  return target;
};
var __toModule = module2 => {
  return __reExport(
    __markAsModule(
      __defProp(
        module2 != null ? __create(__getProtoOf(module2)) : {},
        "default",
        module2 && module2.__esModule && "default" in module2
          ? { get: () => module2.default, enumerable: true }
          : { value: module2, enumerable: true }
      )
    ),
    module2
  );
};

// <stdin>
__export(exports, {
  assets: () => import_assets.default,
  entry: () => entry,
  routes: () => routes
});

// node_modules/@remix-run/dev/compiler/shims/react.ts
var React = __toModule(require("react"));

// app/entry.server.tsx
var entry_server_exports = {};
__export(entry_server_exports, {
  default: () => handleRequest
});
var import_server = __toModule(require("react-dom/server"));
var import_remix = __toModule(require("remix"));
function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext
) {
  let markup = (0, import_server.renderToString)(
    /* @__PURE__ */ React.createElement(import_remix.RemixServer, {
      context: remixContext,
      url: request.url
    })
  );
  responseHeaders.set("Content-Type", "text/html");
  return new Response("<!DOCTYPE html>" + markup, {
    status: responseStatusCode,
    headers: responseHeaders
  });
}

// route-module:/Users/kentcdodds/code/remix/examples/infinite-scroll/app/root.tsx
var root_exports = {};
__export(root_exports, {
  default: () => App
});
var import_remix2 = __toModule(require("remix"));
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
      /* @__PURE__ */ React.createElement(import_remix2.Meta, null),
      /* @__PURE__ */ React.createElement("link", {
        rel: "icon",
        href: "/favicon.ico"
      }),
      /* @__PURE__ */ React.createElement(import_remix2.Links, null)
    ),
    /* @__PURE__ */ React.createElement(
      "body",
      null,
      /* @__PURE__ */ React.createElement(import_remix2.Outlet, null),
      /* @__PURE__ */ React.createElement(
        import_remix2.ScrollRestoration,
        null
      ),
      /* @__PURE__ */ React.createElement(import_remix2.Scripts, null),
      process.env.NODE_ENV === "development" &&
        /* @__PURE__ */ React.createElement(import_remix2.LiveReload, null)
    )
  );
}

// route-module:/Users/kentcdodds/code/remix/examples/infinite-scroll/app/routes/advanced.tsx
var advanced_exports = {};
__export(advanced_exports, {
  default: () => Index,
  links: () => links,
  loader: () => loader
});
var React2 = __toModule(require("react"));
var import_react_virtual = __toModule(require("react-virtual"));
var import_remix3 = __toModule(require("remix"));
var import_remix4 = __toModule(require("remix"));

// app/styles/index.css
var styles_default = "/build/_assets/index-TORRFQYH.css";

// app/utils/backend.server.ts
var items = (global.__items =
  global.__items ??
  Array.from({ length: 5e4 }, (_, i) => ({
    id: i.toString(),
    value: `Item ${i}`
  })));
async function getItems({ start, limit }) {
  return items.slice(start, start + limit);
}
async function countItems() {
  return items.length;
}

// route-module:/Users/kentcdodds/code/remix/examples/infinite-scroll/app/routes/advanced.tsx
var links = () => {
  return [{ rel: "stylesheet", href: styles_default }];
};
var LIMIT = 200;
var DATA_OVERSCAN = 40;
var getStartLimit = searchParams => ({
  start: Number(searchParams.get("start") || "0"),
  limit: Number(searchParams.get("limit") || LIMIT.toString())
});
var loader = async ({ request }) => {
  const { start, limit } = getStartLimit(new URL(request.url).searchParams);
  const data = {
    items: await getItems({ start, limit }),
    totalItems: await countItems()
  };
  return (0, import_remix4.json)(data, {
    headers: {
      "Cache-Control": "public, max-age=120"
    }
  });
};
var isServerRender = typeof document === "undefined";
var useSSRLayoutEffect = isServerRender ? () => {} : React2.useLayoutEffect;
function useIsHydrating(queryString) {
  const [isHydrating] = React2.useState(
    () => !isServerRender && Boolean(document.querySelector(queryString))
  );
  return isHydrating;
}
function Index() {
  const data = (0, import_remix4.useLoaderData)();
  const transition = (0, import_remix4.useTransition)();
  const [searchParams, setSearchParams] = (0, import_remix4.useSearchParams)();
  const hydrating = useIsHydrating("[data-hydrating-signal]");
  const { start, limit } = getStartLimit(searchParams);
  const [initialStart] = React2.useState(() => start);
  const isMountedRef = React2.useRef(false);
  const parentRef = React2.useRef(null);
  const rowVirtualizer = (0, import_react_virtual.useVirtual)({
    size: data.totalItems,
    parentRef,
    estimateSize: React2.useCallback(() => 35, []),
    initialRect: { width: 0, height: 800 }
  });
  (0, import_remix3.useBeforeUnload)(
    React2.useCallback(() => {
      if (!parentRef.current) return;
      sessionStorage.setItem(
        "infiniteScrollTop",
        parentRef.current.scrollTop.toString()
      );
    }, [])
  );
  useSSRLayoutEffect(() => {
    if (!hydrating) return;
    if (!parentRef.current) return;
    const inifiniteScrollTop = sessionStorage.getItem("infiniteScrollTop");
    if (!inifiniteScrollTop) return;
    parentRef.current.scrollTop = Number(inifiniteScrollTop);
    return () => {
      sessionStorage.removeItem("infiniteScrollTop");
    };
  }, [initialStart, hydrating]);
  const lowerBoundary = start + DATA_OVERSCAN;
  const upperBoundary = start + limit - DATA_OVERSCAN;
  const middleCount = Math.ceil(limit / 2);
  const firstVirtualItem = rowVirtualizer.virtualItems.at(0);
  const lastVirtualItem = rowVirtualizer.virtualItems.at(-1);
  if (!firstVirtualItem || !lastVirtualItem) {
    throw new Error("this should never happen");
  }
  let neededStart = start;
  if (firstVirtualItem.index < lowerBoundary) {
    neededStart =
      Math.floor((firstVirtualItem.index - middleCount) / DATA_OVERSCAN) *
      DATA_OVERSCAN;
  } else if (lastVirtualItem.index > upperBoundary) {
    neededStart =
      Math.ceil((lastVirtualItem.index - middleCount) / DATA_OVERSCAN) *
      DATA_OVERSCAN;
  }
  if (neededStart < 0) {
    neededStart = 0;
  }
  if (neededStart + limit > data.totalItems) {
    neededStart = data.totalItems - limit;
  }
  React2.useEffect(() => {
    if (!isMountedRef.current) {
      return;
    }
    if (neededStart !== start) {
      setSearchParams({
        start: String(neededStart),
        limit: LIMIT.toString()
      });
    }
  }, [start, neededStart, setSearchParams]);
  React2.useEffect(() => {
    isMountedRef.current = true;
  }, []);
  return /* @__PURE__ */ React2.createElement(
    "div",
    null,
    /* @__PURE__ */ React2.createElement("h1", null, "Infinite Scroll"),
    /* @__PURE__ */ React2.createElement(
      "div",
      {
        ref: parentRef,
        "data-hydrating-signal": true,
        className: "List",
        style: {
          height: `800px`,
          width: `100%`,
          overflow: "auto"
        }
      },
      /* @__PURE__ */ React2.createElement(
        "div",
        {
          style: {
            height: `${rowVirtualizer.totalSize}px`,
            width: "100%",
            position: "relative"
          }
        },
        rowVirtualizer.virtualItems.map(virtualRow => {
          const index = isMountedRef.current
            ? Math.abs(start - virtualRow.index)
            : virtualRow.index;
          const item = data.items[index];
          return /* @__PURE__ */ React2.createElement(
            "div",
            {
              key: virtualRow.key,
              className: virtualRow.index % 2 ? "ListItemOdd" : "ListItemEven",
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }
            },
            index + start,
            " ",
            item
              ? item.value
              : transition.state === "loading"
              ? "Loading more..."
              : "Nothing to see here..."
          );
        })
      )
    )
  );
}

// route-module:/Users/kentcdodds/code/remix/examples/infinite-scroll/app/routes/simple.tsx
var simple_exports = {};
__export(simple_exports, {
  default: () => Index2,
  links: () => links2,
  loader: () => loader2
});
var React3 = __toModule(require("react"));
var import_react_virtual2 = __toModule(require("react-virtual"));
var import_remix5 = __toModule(require("remix"));
var import_remix6 = __toModule(require("remix"));
var links2 = () => {
  return [{ rel: "stylesheet", href: styles_default }];
};
var LIMIT2 = 200;
var DATA_OVERSCAN2 = 40;
var getStartLimit2 = searchParams => ({
  start: Number(searchParams.get("start") || "0"),
  limit: Number(searchParams.get("limit") || LIMIT2.toString())
});
var loader2 = async ({ request }) => {
  const { start, limit } = getStartLimit2(new URL(request.url).searchParams);
  const data = {
    items: await getItems({ start, limit }),
    totalItems: await countItems()
  };
  return (0, import_remix6.json)(data, {
    headers: {
      "Cache-Control": "public, max-age=120"
    }
  });
};
function Index2() {
  const data = (0, import_remix6.useLoaderData)();
  const [items2, setItems] = React3.useState(data.items);
  const transition = (0, import_remix6.useTransition)();
  const fetcher = (0, import_remix5.useFetcher)();
  const startRef = React3.useRef(0);
  const parentRef = React3.useRef(null);
  const rowVirtualizer = (0, import_react_virtual2.useVirtual)({
    size: data.totalItems,
    parentRef,
    estimateSize: React3.useCallback(() => 35, []),
    initialRect: { width: 0, height: 800 }
  });
  const lastVirtualItem = rowVirtualizer.virtualItems.at(-1);
  if (!lastVirtualItem) {
    throw new Error("this should never happen");
  }
  let newStart = startRef.current;
  const upperBoundary = startRef.current + LIMIT2 - DATA_OVERSCAN2;
  if (lastVirtualItem.index > upperBoundary) {
    newStart = startRef.current + LIMIT2;
  }
  React3.useEffect(() => {
    if (newStart === startRef.current) return;
    const qs = new URLSearchParams([
      ["start", String(newStart)],
      ["limit", String(LIMIT2)]
    ]);
    fetcher.load(`/simple?${qs}`);
    startRef.current = newStart;
  }, [newStart, fetcher]);
  React3.useEffect(() => {
    if (fetcher.data) {
      setItems(prevItems => [...prevItems, ...fetcher.data.items]);
    }
  }, [fetcher.data]);
  return /* @__PURE__ */ React3.createElement(
    "div",
    null,
    /* @__PURE__ */ React3.createElement("h1", null, "Infinite Scroll"),
    /* @__PURE__ */ React3.createElement(
      "div",
      {
        ref: parentRef,
        className: "List",
        style: {
          height: `800px`,
          width: `100%`,
          overflow: "auto"
        }
      },
      /* @__PURE__ */ React3.createElement(
        "div",
        {
          style: {
            height: `${rowVirtualizer.totalSize}px`,
            width: "100%",
            position: "relative"
          }
        },
        rowVirtualizer.virtualItems.map(virtualRow => {
          const item = items2[virtualRow.index];
          return /* @__PURE__ */ React3.createElement(
            "div",
            {
              key: virtualRow.key,
              className: virtualRow.index % 2 ? "ListItemOdd" : "ListItemEven",
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }
            },
            virtualRow.index,
            " ",
            item
              ? item.value
              : transition.state === "loading"
              ? "Loading more..."
              : "Nothing to see here..."
          );
        })
      )
    )
  );
}

// route-module:/Users/kentcdodds/code/remix/examples/infinite-scroll/app/routes/index.tsx
var routes_exports = {};
__export(routes_exports, {
  default: () => IndexRoute
});
var import_remix7 = __toModule(require("remix"));
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
          import_remix7.Link,
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
          import_remix7.Link,
          {
            to: "/advanced"
          },
          "Advanced"
        )
      )
    )
  );
}

// <stdin>
var import_assets = __toModule(require("./assets.json"));
var entry = { module: entry_server_exports };
var routes = {
  root: {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: root_exports
  },
  "routes/advanced": {
    id: "routes/advanced",
    parentId: "root",
    path: "advanced",
    index: void 0,
    caseSensitive: void 0,
    module: advanced_exports
  },
  "routes/simple": {
    id: "routes/simple",
    parentId: "root",
    path: "simple",
    index: void 0,
    caseSensitive: void 0,
    module: simple_exports
  },
  "routes/index": {
    id: "routes/index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: routes_exports
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    assets,
    entry,
    routes
  });
//# sourceMappingURL=/build/index.js.map
