"use strict";

[(function(exports) {

// disk name
const DISK_NAME = 'p055um';

// BlockingResponse types
const NO_ACTION = {},
  CANCEL = {cancel: true};

// suffix of main_frame & sub_frame
const TYPES = {
  main_frame : 'main_frame',
  sub_frame : 'sub_frame',
};

const FRAME_END = '_frame';

// reasons
const FINGERPRINTING = 'fingerprinting',
  USER_HOST_DEACTIVATE = 'user_host_deactivate',
  USER_URL_DEACTIVATE = 'user_url_deactivate';

const TAB_DEACTIVATE = 'tab_deactivate';

// ports
const POPUP = 'popup';

Object.assign(exports, {
  DISK_NAME,
  NO_ACTION,
  CANCEL,
  TYPES,
  FRAME_END,
  FINGERPRINTING,
  USER_HOST_DEACTIVATE,
  USER_URL_DEACTIVATE,
  POPUP,
});

})].map(func => typeof exports == 'undefined' ? require.scopes.constants = func : func(exports));
