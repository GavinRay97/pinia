/*!
  * pinia v0.0.6
  * (c) 2020 Eduardo San Martin Morote
  * @license MIT
  */
var Pinia = (function (exports, compositionApi) {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function isPlainObject(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    o) {
        return (o &&
            typeof o === 'object' &&
            Object.prototype.toString.call(o) === '[object Object]' &&
            typeof o.toJSON !== 'function');
    }

    var target = typeof window !== 'undefined'
        ? window
        : typeof global !== 'undefined'
            ? global
            : { __VUE_DEVTOOLS_GLOBAL_HOOK__: undefined };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    var devtoolHook = target.__VUE_DEVTOOLS_GLOBAL_HOOK__;
    var rootStore;
    function useStoreDevtools(store) {
        if (!devtoolHook)
            return;
        if (!rootStore) {
            rootStore = {
                _devtoolHook: devtoolHook,
                _vm: { $options: { computed: {} } },
                _mutations: {},
                // we neeed to store modules names
                _modulesNamespaceMap: {},
                _modules: {
                    // we only need this specific method to let devtools retrieve the module name
                    get: function (name) {
                        return name in rootStore._modulesNamespaceMap;
                    },
                },
                state: {},
                replaceState: function () {
                    // we handle replacing per store so we do nothing here
                },
                // these are used by the devtools
                registerModule: function () { },
                unregisterModule: function () { },
            };
            devtoolHook.emit('vuex:init', rootStore);
        }
        rootStore.state[store.id] = store.state;
        // tell the devtools we added a module
        rootStore.registerModule(store.id, store);
        Object.defineProperty(rootStore.state, store.id, {
            get: function () { return store.state; },
            set: function (state) { return (store.state = state); },
        });
        // Vue.set(rootStore.state, store.name, store.state)
        // the trailing slash is removed by the devtools
        rootStore._modulesNamespaceMap[store.id + '/'] = true;
        devtoolHook.on('vuex:travel-to-state', function (targetState) {
            store.state = targetState[store.id];
        });
        store.subscribe(function (mutation, state) {
            rootStore.state[store.id] = state;
            devtoolHook.emit('vuex:mutation', __assign(__assign({}, mutation), { type: "[" + mutation.storeName + "] " + mutation.type }), rootStore.state);
        });
    }

    /**
     * setActiveReq must be called to handle SSR at the top of functions like `fetch`, `setup`, `serverPrefetch` and others
     */
    var activeReq = {};
    var setActiveReq = function (req) {
        return req && (activeReq = req);
    };
    var getActiveReq = function () { return activeReq; };
    /**
     * The api needs more work we must be able to use the store easily in any
     * function by calling `useStore` to get the store Instance and we also need to
     * be able to reset the store instance between requests on the server
     */
    var storesMap = new WeakMap();
    /**
     * Map of initial states used for hydration
     */
    var stateProviders = new WeakMap();
    function setStateProvider(stateProvider) {
        stateProviders.set(getActiveReq(), stateProvider);
    }
    function getInitialState(id) {
        var provider = stateProviders.get(getActiveReq());
        return provider && provider()[id];
    }
    /**
     * Gets the root state of all active stores. This is useful when reporting an application crash by
     * retrieving the problematic state and send it to your error tracking service.
     * @param req request key
     */
    function getRootState(req) {
        var stores = storesMap.get(req);
        if (!stores)
            return {};
        var rootState = {};
        // forEach is the only one that also works on IE11
        stores.forEach(function (store) {
            rootState[store.id] = store.state;
        });
        return rootState;
    }

    var isClient = typeof window != 'undefined';
    function innerPatch(target, patchToApply) {
        // TODO: get all keys like symbols as well
        for (var key in patchToApply) {
            var subPatch = patchToApply[key];
            var targetValue = target[key];
            if (isPlainObject(targetValue) && isPlainObject(subPatch)) {
                target[key] = innerPatch(targetValue, subPatch);
            }
            else {
                // @ts-ignore
                target[key] = subPatch;
            }
        }
        return target;
    }
    /**
     * Creates a store instance
     * @param id unique identifier of the store, like a name. eg: main, cart, user
     * @param initialState initial state applied to the store, Must be correctly typed to infer typings
     */
    function buildStore(id, buildState, getters, actions, initialState) {
        if (buildState === void 0) { buildState = function () { return ({}); }; }
        if (getters === void 0) { getters = {}; }
        if (actions === void 0) { actions = {}; }
        var state = compositionApi.ref(initialState || buildState());
        var _r = getActiveReq();
        var isListening = true;
        var subscriptions = [];
        compositionApi.watch(function () { return state.value; }, function (state) {
            if (isListening) {
                subscriptions.forEach(function (callback) {
                    callback({ storeName: id, type: '🧩 in place', payload: {} }, state);
                });
            }
        }, {
            deep: true,
            flush: 'sync',
        });
        function patch(partialState) {
            isListening = false;
            innerPatch(state.value, partialState);
            isListening = true;
            subscriptions.forEach(function (callback) {
                callback({ storeName: id, type: '⤵️ patch', payload: partialState }, state.value);
            });
        }
        function subscribe(callback) {
            subscriptions.push(callback);
            return function () {
                var idx = subscriptions.indexOf(callback);
                if (idx > -1) {
                    subscriptions.splice(idx, 1);
                }
            };
        }
        function reset() {
            subscriptions = [];
            state.value = buildState();
        }
        var storeWithState = {
            id: id,
            _r: _r,
            // it is replaced below by a getter
            state: state.value,
            patch: patch,
            subscribe: subscribe,
            reset: reset,
        };
        var computedGetters = {};
        var _loop_1 = function (getterName) {
            computedGetters[getterName] = compositionApi.computed(function () {
                setActiveReq(_r);
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                return getters[getterName](state.value, computedGetters);
            });
        };
        for (var getterName in getters) {
            _loop_1(getterName);
        }
        // const reactiveGetters = reactive(computedGetters)
        var wrappedActions = {};
        var _loop_2 = function (actionName) {
            wrappedActions[actionName] = function () {
                setActiveReq(_r);
                // eslint-disable-next-line
                return actions[actionName].apply(store, arguments);
            };
        };
        for (var actionName in actions) {
            _loop_2(actionName);
        }
        var store = __assign(__assign(__assign({}, storeWithState), computedGetters), wrappedActions);
        // make state access invisible
        Object.defineProperty(store, 'state', {
            get: function () { return state.value; },
            set: function (newState) {
                isListening = false;
                state.value = newState;
                isListening = true;
            },
        });
        return store;
    }
    /**
     * Creates a `useStore` function that retrieves the store instance
     * @param options
     */
    function createStore(options) {
        var id = options.id, state = options.state, getters = options.getters, actions = options.actions;
        return function useStore(reqKey) {
            if (reqKey)
                setActiveReq(reqKey);
            var req = getActiveReq();
            var stores = storesMap.get(req);
            if (!stores)
                storesMap.set(req, (stores = new Map()));
            var store = stores.get(id);
            if (!store) {
                stores.set(id, (store = buildStore(id, state, getters, actions, getInitialState(id))));
                if (isClient)
                    useStoreDevtools(store);
            }
            return store;
        };
    }

    var PiniaSsr = function (vue) {
        var isServer = typeof window === 'undefined';
        if (!isServer) {
            console.warn('`PiniaSsrPlugin` seems to be used in the client bundle. You should only call it on the server entry: https://github.com/posva/pinia#raw-vue-ssr');
            return;
        }
        vue.mixin({
            beforeCreate: function () {
                // @ts-ignore
                var _a = this.$options, setup = _a.setup, serverPrefetch = _a.serverPrefetch;
                if (setup) {
                    // @ts-ignore
                    this.$options.setup = function (props, context) {
                        // @ts-ignore
                        if (context.ssrContext)
                            setActiveReq(context.ssrContext.req);
                        return setup(props, context);
                    };
                }
                if (serverPrefetch) {
                    var patchedServerPrefetch = Array.isArray(serverPrefetch)
                        ? serverPrefetch.slice()
                        : // serverPrefetch not being an array cannot be triggered due tue options merge
                            // https://github.com/vuejs/vue/blob/7912f75c5eb09e0aef3e4bfd8a3bb78cad7540d7/src/core/util/options.js#L149
                            /* istanbul ignore next */
                            [serverPrefetch];
                    var _loop_1 = function (i) {
                        var original = patchedServerPrefetch[i];
                        patchedServerPrefetch[i] = function () {
                            // @ts-ignore
                            setActiveReq(this.$ssrContext.req);
                            return original.call(this);
                        };
                    };
                    for (var i = 0; i < patchedServerPrefetch.length; i++) {
                        _loop_1(i);
                    }
                    // @ts-ignore
                    this.$options.serverPrefetch = patchedServerPrefetch;
                }
            },
        });
    };

    exports.PiniaSsr = PiniaSsr;
    exports.createStore = createStore;
    exports.getRootState = getRootState;
    exports.setActiveReq = setActiveReq;
    exports.setStateProvider = setStateProvider;

    return exports;

}({}, vueCompositionApi));
