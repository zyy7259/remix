import {
  require_backend,
  styles_default,
  useVirtual
} from "/build/_shared/chunk-PWXNMG5Q.js";
import {
  __toModule,
  init_react,
  require_react,
  useFetcher,
  useLoaderData,
  useTransition
} from "/build/_shared/chunk-4WKUNRPC.js";

// browser-route-module:/Users/kentcdodds/code/remix/examples/infinite-scroll/app/routes/simple.tsx?browser
init_react();

// app/routes/simple.tsx
init_react();
var React = __toModule(require_react());
var import_backend = __toModule(require_backend());
var links = () => {
  return [{ rel: "stylesheet", href: styles_default }];
};
var LIMIT = 200;
var DATA_OVERSCAN = 40;
function Index() {
  const data = useLoaderData();
  const [items, setItems] = React.useState(data.items);
  const transition = useTransition();
  const fetcher = useFetcher();
  const startRef = React.useRef(0);
  const parentRef = React.useRef(null);
  const rowVirtualizer = useVirtual({
    size: data.totalItems,
    parentRef,
    estimateSize: React.useCallback(() => 35, []),
    initialRect: { width: 0, height: 800 }
  });
  const lastVirtualItem = rowVirtualizer.virtualItems.at(-1);
  if (!lastVirtualItem) {
    throw new Error("this should never happen");
  }
  let newStart = startRef.current;
  const upperBoundary = startRef.current + LIMIT - DATA_OVERSCAN;
  if (lastVirtualItem.index > upperBoundary) {
    newStart = startRef.current + LIMIT;
  }
  React.useEffect(() => {
    if (newStart === startRef.current) return;
    const qs = new URLSearchParams([
      ["start", String(newStart)],
      ["limit", String(LIMIT)]
    ]);
    fetcher.load(`/simple?${qs}`);
  }, [newStart, fetcher]);
  React.useEffect(() => {
    if (fetcher.type === "done") {
      setItems(prevItems => [...prevItems, ...fetcher.data.items]);
      startRef.current = newStart;
    }
  }, [fetcher.type]);
  return /* @__PURE__ */ React.createElement(
    "div",
    null,
    /* @__PURE__ */ React.createElement("h1", null, "Infinite Scroll"),
    /* @__PURE__ */ React.createElement(
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
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            height: `${rowVirtualizer.totalSize}px`,
            width: "100%",
            position: "relative"
          }
        },
        rowVirtualizer.virtualItems.map(virtualRow => {
          const item = items[virtualRow.index];
          return /* @__PURE__ */ React.createElement(
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
export { Index as default, links };
//# sourceMappingURL=/build/routes/simple-IRIB4MA2.js.map
