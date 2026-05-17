// Polyfills for Node.js 18 compatibility (missing APIs from Node 20+)
// Injected via NODE_OPTIONS=--require=./scripts/polyfill-node18.js

// Array.prototype.toReversed — Node 20+
if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function () {
    return [...this].reverse();
  };
}

// Array.prototype.toSorted — Node 20+
if (!Array.prototype.toSorted) {
  Array.prototype.toSorted = function (compareFn) {
    return [...this].sort(compareFn);
  };
}

// Array.prototype.toSpliced — Node 20+
if (!Array.prototype.toSpliced) {
  Array.prototype.toSpliced = function (start, deleteCount, ...items) {
    const copy = [...this];
    copy.splice(start, deleteCount, ...items);
    return copy;
  };
}

// Array.prototype.findLast — Node 18+
if (!Array.prototype.findLast) {
  Array.prototype.findLast = function (predicate, thisArg) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (predicate.call(thisArg, this[i], i, this)) return this[i];
    }
    return undefined;
  };
}

// Array.prototype.findLastIndex — Node 18+
if (!Array.prototype.findLastIndex) {
  Array.prototype.findLastIndex = function (predicate, thisArg) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (predicate.call(thisArg, this[i], i, this)) return i;
    }
    return -1;
  };
}

// String.prototype.replaceAll — Node 15+
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (searchValue, replaceValue) {
    return this.split(searchValue).join(replaceValue);
  };
}

// Promise.withResolvers — Node 22+
if (!Promise.withResolvers) {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  };
}
