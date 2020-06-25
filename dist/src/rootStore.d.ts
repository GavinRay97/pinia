import { NonNullObject, StateTree } from './types';
/**
 * setActiveReq must be called to handle SSR at the top of functions like `fetch`, `setup`, `serverPrefetch` and others
 */
export declare let activeReq: NonNullObject;
export declare const setActiveReq: (req: NonNullObject | undefined) => Record<any, any> | undefined;
export declare const getActiveReq: () => Record<any, any>;
/**
 * The api needs more work we must be able to use the store easily in any
 * function by calling `useStore` to get the store Instance and we also need to
 * be able to reset the store instance between requests on the server
 */
export declare const storesMap: WeakMap<Record<any, any>, Map<string, import("./types").Store<string, Record<string | number | symbol, any>, Record<string, import("./types").StoreGetter<Record<string | number | symbol, any>, any>>, Record<string, import("./types").StoreAction>>>>;
/**
 * A state provider allows to set how states are stored for hydration. e.g. setting a property on a context, getting a property from window
 */
interface StateProvider {
    (): Record<string, StateTree>;
}
/**
 * Map of initial states used for hydration
 */
export declare const stateProviders: WeakMap<Record<any, any>, StateProvider>;
export declare function setStateProvider(stateProvider: StateProvider): void;
export declare function getInitialState(id: string): StateTree | undefined;
/**
 * Gets the root state of all active stores. This is useful when reporting an application crash by
 * retrieving the problematic state and send it to your error tracking service.
 * @param req request key
 */
export declare function getRootState(req: NonNullObject): Record<string, StateTree>;
export {};
