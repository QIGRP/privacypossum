"use strict";

[(function(exports) {

const shim = require('./shim'), {URL} = shim,
  constants = require('./constants'),
  {Handler} = require('./reasons/handlers');

class WebRequest {
  constructor(tabs, store, handler = new Handler(tabs, store)) {
    Object.assign(this, {tabs, store, handler});
    this.checkRequestAction = this.handler.handleRequest.bind(this.handler);
  }

  isThirdParty(details) {
    if (details.tabId < 0) {
      return false; // no associated tab, so 3rd party isn't applicable
    }
    return this.tabs.isThirdParty(details.tabId, details.urlObj.hostname);
  }

  start({onBeforeRequest, onBeforeSendHeaders, onHeadersReceived} = shim) {
    onBeforeRequest.addListener(
      this.onBeforeRequest.bind(this),
      {urls: ["<all_urls>"]},
      ["blocking"]
    );

    onBeforeSendHeaders.addListener(
      this.onBeforeSendHeaders.bind(this),
      {urls: ["<all_urls>"]},
      ["blocking", "requestHeaders"]
    );

    onHeadersReceived.addListener(
      this.onHeadersReceived.bind(this),
      {urls: ["<all_urls>"]},
      ["blocking", "responseHeaders"]
    );
  }

  recordRequest(details) {
    this.tabs.addResource(details);
  }

  markAction({action, url, tabId}) {
    if (action && this.handler.isInPopup(action.reason)) {
      return this.tabs.markAction(action, url, tabId);
    }
  }

  checkAllRequestActions(details) {
    let {tabId} = details,
      {hostname, pathname} = details.urlObj;

    // we check actions in tab -> domain -> path
    this.checkRequestAction(this.tabs.getTab(tabId), details);
    if (!details.shortCircuit && this.store.has(hostname)) {
      let domain = this.store.get(hostname);
      this.checkRequestAction(domain, details);
      if (!details.shortCircuit && domain.hasPath(pathname)) {
        let path = domain.getPath(pathname);
        this.checkRequestAction(path, details);
      }
    }
  }

  commitRequest(details) {
    details.response = constants.NO_ACTION;
    this.checkAllRequestActions(details);
    this.markAction(details);  // record new behavior
    return details.response;
  }

  onBeforeRequest(details) {
    details.urlObj = new URL(details.url);
    this.recordRequest(details);
    return this.commitRequest(details);
  }

  onBeforeSendHeaders(details) {
    return this.headerHandler(details, 'requestHeaders');
  }

  onHeadersReceived(details) {
    return this.headerHandler(details, 'responseHeaders');
  }

  headerHandler(details, headerPropName) {
    details.response = constants.NO_ACTION;
    details.urlObj = new URL(details.url);

    if (this.isThirdParty(details)) {
      let headers = details[headerPropName];
      this.checkAllRequestActions(details);
      if (!details.shortCircuit && removeHeaders(headers)) {
        details.response = {[headerPropName]: headers};
      }
    }
    return details.response;
  }
}

const badHeaders = new Set(['cookie', 'referer', 'set-cookie']);

// return number of headers mutated
// todo, attach response to details object?
// todo rename to removeBadHeaders?
function removeHeaders(headers) {
  let nmutated = 0;
  for (let i = 0; i < headers.length; i++) {
    while (i < headers.length && badHeaders.has(headers[i].name.toLowerCase())) {
      headers.splice(i, 1);
      nmutated += 1;
    }
  }
  return nmutated;
}

Object.assign(exports, {WebRequest, removeHeaders});

})].map(func => typeof exports == 'undefined' ? define('/webrequest', func) : func(exports));
