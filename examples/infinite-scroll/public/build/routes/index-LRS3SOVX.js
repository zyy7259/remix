import {
  __commonJS,
  __toModule,
  import_react_router_dom,
  init_react,
  require_react,
  useLoaderData,
  useTransition
} from "/build/_shared/chunk-RHHYOK4C.js";

// empty-module:~/utils/backend.server
var require_backend = __commonJS({
  "empty-module:~/utils/backend.server"(exports, module) {
    init_react();
    module.exports = {};
  }
});

// browser-route-module:/Users/kentcdodds/code/remix/examples/infinite-scroll/app/routes/index.tsx?browser
init_react();

// app/routes/index.tsx
init_react();
var React2 = __toModule(require_react());

// node_modules/react-virtual/dist/react-virtual.mjs
init_react();
var import_react = __toModule(require_react());
function _extends() {
  _extends =
    Object.assign ||
    function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    };
  return _extends.apply(this, arguments);
}
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }
  return target;
}
var props = ["bottom", "height", "left", "right", "top", "width"];
var rectChanged = function rectChanged2(a, b) {
  if (a === void 0) {
    a = {};
  }
  if (b === void 0) {
    b = {};
  }
  return props.some(function (prop) {
    return a[prop] !== b[prop];
  });
};
var observedNodes = /* @__PURE__ */ new Map();
var rafId;
var run = function run2() {
  var changedStates = [];
  observedNodes.forEach(function (state, node) {
    var newRect = node.getBoundingClientRect();
    if (rectChanged(newRect, state.rect)) {
      state.rect = newRect;
      changedStates.push(state);
    }
  });
  changedStates.forEach(function (state) {
    state.callbacks.forEach(function (cb) {
      return cb(state.rect);
    });
  });
  rafId = window.requestAnimationFrame(run2);
};
function observeRect(node, cb) {
  return {
    observe: function observe() {
      var wasEmpty = observedNodes.size === 0;
      if (observedNodes.has(node)) {
        observedNodes.get(node).callbacks.push(cb);
      } else {
        observedNodes.set(node, {
          rect: void 0,
          hasRectChanged: false,
          callbacks: [cb]
        });
      }
      if (wasEmpty) run();
    },
    unobserve: function unobserve() {
      var state = observedNodes.get(node);
      if (state) {
        var index = state.callbacks.indexOf(cb);
        if (index >= 0) state.callbacks.splice(index, 1);
        if (!state.callbacks.length) observedNodes["delete"](node);
        if (!observedNodes.size) cancelAnimationFrame(rafId);
      }
    }
  };
}
var useIsomorphicLayoutEffect =
  typeof window !== "undefined"
    ? import_react.default.useLayoutEffect
    : import_react.default.useEffect;
function useRect(nodeRef) {
  var _React$useState = import_react.default.useState(nodeRef.current),
    element = _React$useState[0],
    setElement = _React$useState[1];
  var _React$useReducer = import_react.default.useReducer(rectReducer, null),
    rect = _React$useReducer[0],
    dispatch = _React$useReducer[1];
  var initialRectSet = import_react.default.useRef(false);
  useIsomorphicLayoutEffect(function () {
    if (nodeRef.current !== element) {
      setElement(nodeRef.current);
    }
  });
  useIsomorphicLayoutEffect(
    function () {
      if (element && !initialRectSet.current) {
        initialRectSet.current = true;
        var _rect = element.getBoundingClientRect();
        dispatch({
          rect: _rect
        });
      }
    },
    [element]
  );
  import_react.default.useEffect(
    function () {
      if (!element) {
        return;
      }
      var observer = observeRect(element, function (rect2) {
        dispatch({
          rect: rect2
        });
      });
      observer.observe();
      return function () {
        observer.unobserve();
      };
    },
    [element]
  );
  return rect;
}
function rectReducer(state, action) {
  var rect = action.rect;
  if (!state || state.height !== rect.height || state.width !== rect.width) {
    return rect;
  }
  return state;
}
var defaultEstimateSize = function defaultEstimateSize2() {
  return 50;
};
var defaultKeyExtractor = function defaultKeyExtractor2(index) {
  return index;
};
var defaultMeasureSize = function defaultMeasureSize2(el, horizontal) {
  var key = horizontal ? "offsetWidth" : "offsetHeight";
  return el[key];
};
var defaultRangeExtractor = function defaultRangeExtractor2(range) {
  var start = Math.max(range.start - range.overscan, 0);
  var end = Math.min(range.end + range.overscan, range.size - 1);
  var arr = [];
  for (var i = start; i <= end; i++) {
    arr.push(i);
  }
  return arr;
};
function useVirtual(_ref) {
  var _ref3, _measurements;
  var _ref$size = _ref.size,
    size = _ref$size === void 0 ? 0 : _ref$size,
    _ref$estimateSize = _ref.estimateSize,
    estimateSize =
      _ref$estimateSize === void 0 ? defaultEstimateSize : _ref$estimateSize,
    _ref$overscan = _ref.overscan,
    overscan = _ref$overscan === void 0 ? 1 : _ref$overscan,
    _ref$paddingStart = _ref.paddingStart,
    paddingStart = _ref$paddingStart === void 0 ? 0 : _ref$paddingStart,
    _ref$paddingEnd = _ref.paddingEnd,
    paddingEnd = _ref$paddingEnd === void 0 ? 0 : _ref$paddingEnd,
    parentRef = _ref.parentRef,
    horizontal = _ref.horizontal,
    scrollToFn = _ref.scrollToFn,
    useObserver = _ref.useObserver,
    onScrollElement = _ref.onScrollElement,
    scrollOffsetFn = _ref.scrollOffsetFn,
    _ref$keyExtractor = _ref.keyExtractor,
    keyExtractor =
      _ref$keyExtractor === void 0 ? defaultKeyExtractor : _ref$keyExtractor,
    _ref$measureSize = _ref.measureSize,
    measureSize =
      _ref$measureSize === void 0 ? defaultMeasureSize : _ref$measureSize,
    _ref$rangeExtractor = _ref.rangeExtractor,
    rangeExtractor =
      _ref$rangeExtractor === void 0
        ? defaultRangeExtractor
        : _ref$rangeExtractor;
  var sizeKey = horizontal ? "width" : "height";
  var scrollKey = horizontal ? "scrollLeft" : "scrollTop";
  var latestRef = import_react.default.useRef({
    scrollOffset: 0,
    measurements: []
  });
  var useMeasureParent = useObserver || useRect;
  var _ref2 =
      useMeasureParent(parentRef) ||
      ((_ref3 = {}), (_ref3[sizeKey] = 0), _ref3),
    outerSize = _ref2[sizeKey];
  latestRef.current.outerSize = outerSize;
  var defaultScrollToFn = import_react.default.useCallback(
    function (offset) {
      if (parentRef.current) {
        parentRef.current[scrollKey] = offset;
      }
    },
    [parentRef, scrollKey]
  );
  var resolvedScrollToFn = scrollToFn || defaultScrollToFn;
  scrollToFn = import_react.default.useCallback(
    function (offset) {
      resolvedScrollToFn(offset, defaultScrollToFn);
    },
    [defaultScrollToFn, resolvedScrollToFn]
  );
  var _React$useState = import_react.default.useState({}),
    measuredCache = _React$useState[0],
    setMeasuredCache = _React$useState[1];
  var measure = import_react.default.useCallback(function () {
    return setMeasuredCache({});
  }, []);
  var pendingMeasuredCacheIndexesRef = import_react.default.useRef([]);
  var measurements = import_react.default.useMemo(
    function () {
      var min =
        pendingMeasuredCacheIndexesRef.current.length > 0
          ? Math.min.apply(Math, pendingMeasuredCacheIndexesRef.current)
          : 0;
      pendingMeasuredCacheIndexesRef.current = [];
      var measurements2 = latestRef.current.measurements.slice(0, min);
      for (var i = min; i < size; i++) {
        var key = keyExtractor(i);
        var measuredSize = measuredCache[key];
        var start = measurements2[i - 1]
          ? measurements2[i - 1].end
          : paddingStart;
        var _size =
          typeof measuredSize === "number" ? measuredSize : estimateSize(i);
        var end = start + _size;
        measurements2[i] = {
          index: i,
          start,
          size: _size,
          end,
          key
        };
      }
      return measurements2;
    },
    [estimateSize, measuredCache, paddingStart, size, keyExtractor]
  );
  var totalSize =
    (((_measurements = measurements[size - 1]) == null
      ? void 0
      : _measurements.end) || 0) + paddingEnd;
  latestRef.current.measurements = measurements;
  latestRef.current.totalSize = totalSize;
  var _React$useState2 = import_react.default.useState({
      start: 0,
      end: 0
    }),
    range = _React$useState2[0],
    setRange = _React$useState2[1];
  var element = onScrollElement ? onScrollElement.current : parentRef.current;
  var scrollOffsetFnRef = import_react.default.useRef(scrollOffsetFn);
  scrollOffsetFnRef.current = scrollOffsetFn;
  var rangeTimeoutIdRef = import_react.default.useRef(null);
  var cancelAsyncRange = import_react.default.useCallback(function () {
    if (rangeTimeoutIdRef.current !== null) {
      clearTimeout(rangeTimeoutIdRef.current);
      rangeTimeoutIdRef.current = null;
    }
  }, []);
  useIsomorphicLayoutEffect(
    function () {
      rangeTimeoutIdRef.current = setTimeout(function () {
        setRange(function (prevRange) {
          return calculateRange(latestRef.current, prevRange);
        });
      });
      return function () {
        return cancelAsyncRange();
      };
    },
    [measurements, outerSize, cancelAsyncRange]
  );
  useIsomorphicLayoutEffect(
    function () {
      if (!element) {
        setRange({
          start: 0,
          end: 0
        });
        latestRef.current.scrollOffset = 0;
        return;
      }
      var onScroll = function onScroll2(event) {
        var scrollOffset = scrollOffsetFnRef.current
          ? scrollOffsetFnRef.current(event)
          : element[scrollKey];
        latestRef.current.scrollOffset = scrollOffset;
        cancelAsyncRange();
        setRange(function (prevRange) {
          return calculateRange(latestRef.current, prevRange);
        });
      };
      onScroll();
      element.addEventListener("scroll", onScroll, {
        capture: false,
        passive: true
      });
      return function () {
        element.removeEventListener("scroll", onScroll);
      };
    },
    [element, scrollKey, cancelAsyncRange]
  );
  var measureSizeRef = import_react.default.useRef(measureSize);
  measureSizeRef.current = measureSize;
  var virtualItems = import_react.default.useMemo(
    function () {
      var indexes = rangeExtractor({
        start: range.start,
        end: range.end,
        overscan,
        size: measurements.length
      });
      var virtualItems2 = [];
      var _loop = function _loop2(k2, len2) {
        var i = indexes[k2];
        var measurement = measurements[i];
        var item = _extends(
          _extends({}, measurement),
          {},
          {
            measureRef: function measureRef(el) {
              if (el) {
                var measuredSize = measureSizeRef.current(el, horizontal);
                if (measuredSize !== item.size) {
                  var scrollOffset = latestRef.current.scrollOffset;
                  if (item.start < scrollOffset) {
                    defaultScrollToFn(
                      scrollOffset + (measuredSize - item.size)
                    );
                  }
                  pendingMeasuredCacheIndexesRef.current.push(i);
                  setMeasuredCache(function (old) {
                    var _extends2;
                    return _extends(
                      _extends({}, old),
                      {},
                      ((_extends2 = {}),
                      (_extends2[item.key] = measuredSize),
                      _extends2)
                    );
                  });
                }
              }
            }
          }
        );
        virtualItems2.push(item);
      };
      for (var k = 0, len = indexes.length; k < len; k++) {
        _loop(k);
      }
      return virtualItems2;
    },
    [
      defaultScrollToFn,
      horizontal,
      measurements,
      overscan,
      range.end,
      range.start,
      rangeExtractor
    ]
  );
  var mountedRef = import_react.default.useRef();
  useIsomorphicLayoutEffect(
    function () {
      if (mountedRef.current) {
        if (estimateSize) setMeasuredCache({});
      }
      mountedRef.current = true;
    },
    [estimateSize]
  );
  var scrollToOffset = import_react.default.useCallback(
    function (toOffset, _temp) {
      var _ref4 = _temp === void 0 ? {} : _temp,
        _ref4$align = _ref4.align,
        align = _ref4$align === void 0 ? "start" : _ref4$align;
      var _latestRef$current = latestRef.current,
        scrollOffset = _latestRef$current.scrollOffset,
        outerSize2 = _latestRef$current.outerSize;
      if (align === "auto") {
        if (toOffset <= scrollOffset) {
          align = "start";
        } else if (toOffset >= scrollOffset + outerSize2) {
          align = "end";
        } else {
          align = "start";
        }
      }
      if (align === "start") {
        scrollToFn(toOffset);
      } else if (align === "end") {
        scrollToFn(toOffset - outerSize2);
      } else if (align === "center") {
        scrollToFn(toOffset - outerSize2 / 2);
      }
    },
    [scrollToFn]
  );
  var tryScrollToIndex = import_react.default.useCallback(
    function (index, _temp2) {
      var _ref5 = _temp2 === void 0 ? {} : _temp2,
        _ref5$align = _ref5.align,
        align = _ref5$align === void 0 ? "auto" : _ref5$align,
        rest = _objectWithoutPropertiesLoose(_ref5, ["align"]);
      var _latestRef$current2 = latestRef.current,
        measurements2 = _latestRef$current2.measurements,
        scrollOffset = _latestRef$current2.scrollOffset,
        outerSize2 = _latestRef$current2.outerSize;
      var measurement = measurements2[Math.max(0, Math.min(index, size - 1))];
      if (!measurement) {
        return;
      }
      if (align === "auto") {
        if (measurement.end >= scrollOffset + outerSize2) {
          align = "end";
        } else if (measurement.start <= scrollOffset) {
          align = "start";
        } else {
          return;
        }
      }
      var toOffset =
        align === "center"
          ? measurement.start + measurement.size / 2
          : align === "end"
          ? measurement.end
          : measurement.start;
      scrollToOffset(
        toOffset,
        _extends(
          {
            align
          },
          rest
        )
      );
    },
    [scrollToOffset, size]
  );
  var scrollToIndex = import_react.default.useCallback(
    function () {
      for (
        var _len = arguments.length, args = new Array(_len), _key = 0;
        _key < _len;
        _key++
      ) {
        args[_key] = arguments[_key];
      }
      tryScrollToIndex.apply(void 0, args);
      requestAnimationFrame(function () {
        tryScrollToIndex.apply(void 0, args);
      });
    },
    [tryScrollToIndex]
  );
  return {
    virtualItems,
    totalSize,
    scrollToOffset,
    scrollToIndex,
    measure
  };
}
var findNearestBinarySearch = function findNearestBinarySearch2(
  low,
  high,
  getCurrentValue,
  value
) {
  while (low <= high) {
    var middle = ((low + high) / 2) | 0;
    var currentValue = getCurrentValue(middle);
    if (currentValue < value) {
      low = middle + 1;
    } else if (currentValue > value) {
      high = middle - 1;
    } else {
      return middle;
    }
  }
  if (low > 0) {
    return low - 1;
  } else {
    return 0;
  }
};
function calculateRange(_ref6, prevRange) {
  var measurements = _ref6.measurements,
    outerSize = _ref6.outerSize,
    scrollOffset = _ref6.scrollOffset;
  var size = measurements.length - 1;
  var getOffset = function getOffset2(index) {
    return measurements[index].start;
  };
  var start = findNearestBinarySearch(0, size, getOffset, scrollOffset);
  var end = start;
  while (end < size && measurements[end].end < scrollOffset + outerSize) {
    end++;
  }
  if (prevRange.start !== start || prevRange.end !== end) {
    return {
      start,
      end
    };
  }
  return prevRange;
}

// app/styles/index.css
var styles_default = "/build/_assets/index-TORRFQYH.css";

// app/routes/index.tsx
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
function Index() {
  const data = useLoaderData();
  const transition = useTransition();
  const [searchParams, setSearchParams] = (0,
  import_react_router_dom.useSearchParams)();
  const { start, limit } = getStartLimit(searchParams);
  const parentRef = React2.useRef(null);
  const rowVirtualizer = useVirtual({
    size: data.totalItems,
    parentRef,
    estimateSize: React2.useCallback(() => 35, [])
  });
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
    if (neededStart !== start) {
      setSearchParams({
        start: String(neededStart),
        limit: LIMIT.toString()
      });
    }
  }, [start, neededStart, setSearchParams]);
  return /* @__PURE__ */ React2.createElement(
    "div",
    null,
    /* @__PURE__ */ React2.createElement("h1", null, "Infinite Scroll"),
    /* @__PURE__ */ React2.createElement(
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
          const item = data.items[Math.abs(start - virtualRow.index)];
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
//# sourceMappingURL=/build/routes/index-LRS3SOVX.js.map
