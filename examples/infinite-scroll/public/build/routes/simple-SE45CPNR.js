import {
  require_backend,
  styles_default,
  useVirtual
} from "/build/_shared/chunk-CQ3XRYCA.js";
import {
  import_react_router_dom,
  useBeforeUnload,
  useLoaderData,
  useTransition
} from "/build/_shared/chunk-X2DUDC72.js";
import {
  __toModule,
  init_react,
  require_react
} from "/build/_shared/chunk-E7VMOUYL.js";

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
var getStartLimit = searchParams => ({
  start: Number(searchParams.get("start") || "0"),
  limit: Number(searchParams.get("limit") || LIMIT.toString())
});
var useSSRLayoutEffect =
  typeof window === "undefined" ? () => {} : React.useLayoutEffect;
function Index() {
  const data = useLoaderData();
  const transition = useTransition();
  const [searchParams, setSearchParams] = (0,
  import_react_router_dom.useSearchParams)();
  const { start, limit } = getStartLimit(searchParams);
  const [initialStart] = React.useState(() => start);
  const isMountedRef = React.useRef(false);
  const parentRef = React.useRef(null);
  const rowVirtualizer = useVirtual({
    size: data.totalItems,
    parentRef,
    estimateSize: React.useCallback(() => 35, []),
    initialRect: { width: 0, height: 800 }
  });
  useBeforeUnload(
    React.useCallback(() => {
      if (!parentRef.current) return;
      sessionStorage.setItem(
        "infiniteScrollTop",
        parentRef.current.scrollTop.toString()
      );
    }, [])
  );
  useSSRLayoutEffect(() => {
    if (!parentRef.current) return;
    const inifiniteScrollTop = sessionStorage.getItem("infiniteScrollTop");
    if (!inifiniteScrollTop) return;
    parentRef.current.scrollTop = Number(inifiniteScrollTop);
  }, [initialStart]);
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
  React.useEffect(() => {
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
  React.useEffect(() => {
    isMountedRef.current = true;
  }, []);
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
          const index = isMountedRef.current
            ? Math.abs(start - virtualRow.index)
            : virtualRow.index;
          const item = data.items[index];
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
export { Index as default, links };
//# sourceMappingURL=/build/routes/simple-SE45CPNR.js.map
