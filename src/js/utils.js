"use strict";

[(function(exports) {

const {activeIcons, inactiveIcons} = require('./constants'),
    {setIcon} = require('./shim');

class FifoMap extends Map {
  constructor(maxSize) {
    super();
    Object.assign(this, {maxSize});
  }

  set(key, val) {
    super.set(key, val);
    if (this.size > this.maxSize) {
      this.delete(this.keys().next().value);
    }
  }
}

class LogBook extends FifoMap {
  constructor() {
    super(...arguments);
    this.count = 0;
  }

  dump() {
    return Array.from(this).reverse();
  }

  log(entry) {
    // todo check entry is always a string
    this.set(this.count, entry);
    this.count += 1;
    return this;
  }
}

function lazyDef(exports_, name, definerFunc) {
  Object.assign(exports_, {
    get [name]() {
      delete this[name];
      return this[name] = definerFunc(exports_);
    }
  });
}

/*
 * Memoize the function `func`. `hash` coneverts the functions arguments into a
 * key to reference the result in the cache. `size` is the max size of the
 * cache.
 */
function memoize(func, hash, size) {
  let cache = new FifoMap(size);
  return function() {
    let key = hash(arguments);
    if (cache.has(key)) {
      return cache.get(key);
    }
    let result = func.apply(undefined, arguments);
    cache.set(key, result);
    return result;
  }
}

class BrowserDisk {
  constructor(disk) {
    this.disk = disk;
  }

  get(key, cb) {
    this.disk.get(key, (res) => {
      return (res.hasOwnProperty(key)) ? cb(res[key]) : cb();
    });
  }

  set(key, value, cb) {
    return this.disk.set({[key]: value}, cb);
  }

  delete(key, cb) {
    return this.disk(remove, cb);
  }
}

// move to shim
function makeTrap() {
  let target = () => {};
  let lol = () => {
    return new Proxy(target, descriptor);
  };
  let descriptor = {
    apply: lol,
    get: lol,
  };
  return lol();
}

/*
 * Make a class have an eventListener interface. The base class needs to
 * implement a `getData` function and call the `onChange` function when
 * appropriate.
 */
let listenerMixin = (Base) => class extends Base {
  constructor() {
    super();
    this.funcs = new Set();
    this.onChange = this.onEvent;
  }

  addListener(func) {
    this.funcs.add(func)
  }

  removeListener(func) {
    this.funcs.delete(func);
  }

  onEvent() {
    this.funcs.forEach(func => func(this.getData()));
  }

  getData() {
  }
}

// todo after setIcon return's a promise, make this return a promise
function setTabIconActive(tabId, active) {
  let icons = active ? activeIcons : inactiveIcons;
  setIcon({tabId: tabId, path: icons});
}

function hasAction(obj, reason) {
  return obj.hasOwnProperty('action') && (obj.action.reason === reason);
}

class Listener extends listenerMixin(Object) {}

// check if hostname has the given basename
function isBaseOfHostname(base, host) {
  return host.endsWith(base) ?
    (base.length === host.length || host.substr(-base.length - 1, 1) === '.') :
    false;
}
isBaseOfHostname = memoize(isBaseOfHostname, ([base, host]) => base + ' ' + host, 1000);

lazyDef(exports, 'log', (exports_) => {
  let logger = new LogBook(100);
  Object.assign(exports_, {logger});
  return logger.log.bind(logger);
});

Object.assign(exports, {
  memoize,
  LogBook,
  BrowserDisk,
  makeTrap,
  listenerMixin,
  Listener,
  setTabIconActive,
  hasAction,
  isBaseOfHostname,
  lazyDef,
});

})].map(func => typeof exports == 'undefined' ? define('/utils', func) : func(exports));
