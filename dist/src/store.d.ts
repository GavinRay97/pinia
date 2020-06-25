import { StateTree, StoreWithState, StoreWithGetters, StoreGetter, StoreAction, Store } from './types';
/**
 * Creates a store instance
 * @param id unique identifier of the store, like a name. eg: main, cart, user
 * @param initialState initial state applied to the store, Must be correctly typed to infer typings
 */
export declare function buildStore<Id extends string, S extends StateTree, G extends Record<string, StoreGetter<S>>, A extends Record<string, StoreAction>>(id: Id, buildState?: () => S, getters?: G, actions?: A, initialState?: S | undefined): Store<Id, S, G, A>;
/**
 * Creates a `useStore` function that retrieves the store instance
 * @param options
 */
export declare function createStore<Id extends string, S extends StateTree, G extends Record<string, StoreGetter<S>>, A extends Record<string, StoreAction>>(options: {
    id: Id;
    state?: () => S;
    getters?: G;
    actions?: A & ThisType<A & StoreWithState<Id, S> & StoreWithGetters<S, G>>;
}): (reqKey?: object | undefined) => Store<Id, S, G, A>;
