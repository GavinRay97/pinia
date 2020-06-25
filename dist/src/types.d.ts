import { Ref } from '@vue/composition-api';
export declare type StateTree = Record<string | number | symbol, any>;
export declare function isPlainObject(o: any): o is StateTree;
export declare type NonNullObject = Record<any, any>;
export interface StoreGetter<S extends StateTree, T = any> {
    (state: S, getters: Record<string, Ref<any>>): T;
}
export declare type DeepPartial<T> = {
    [K in keyof T]?: DeepPartial<T[K]>;
};
export declare type SubscriptionCallback<S> = (mutation: {
    storeName: string;
    type: string;
    payload: DeepPartial<S>;
}, state: S) => void;
export declare type StoreWithGetters<S extends StateTree, G extends Record<string, StoreGetter<S>>> = {
    [k in keyof G]: G[k] extends StoreGetter<S, infer V> ? Ref<V> : never;
};
export interface StoreWithState<Id extends string, S extends StateTree> {
    /**
     * Unique identifier of the store
     */
    id: Id;
    /**
     * State of the Store
     */
    state: S;
    /**
     * Private property defining the request key for this store
     */
    _r: NonNullObject;
    /**
     * Applies a state patch to current state. Allows passing nested values
     * @param partialState patch to apply to the state
     */
    patch(partialState: DeepPartial<S>): void;
    /**
     * Resets the store to its initial state by removing all subscriptions and
     * building a new state object
     */
    reset(): void;
    /**
     * Setups a callback to be called whenever the state changes.
     * @param callback callback that is called whenever the state
     * @returns function that removes callback from subscriptions
     */
    subscribe(callback: SubscriptionCallback<S>): () => void;
}
export interface StoreAction {
    (...args: any[]): any;
}
export declare type StoreWithActions<A extends Record<string, StoreAction>> = {
    [k in keyof A]: A[k] extends (this: infer This, ...args: infer P) => infer R ? (this: This, ...args: P) => R : never;
};
export declare type Store<Id extends string, S extends StateTree, G extends Record<string, StoreGetter<S>>, A extends Record<string, StoreAction>> = StoreWithState<Id, S> & StoreWithGetters<S, G> & StoreWithActions<A>;
export declare type GenericStore = Store<string, StateTree, Record<string, StoreGetter<StateTree>>, Record<string, StoreAction>>;
export interface DevtoolHook {
    on(event: string, callback: (targetState: Record<string, StateTree>) => void): void;
    emit(event: string, ...payload: any[]): void;
}
declare global {
    interface Window {
        __VUE_DEVTOOLS_GLOBAL_HOOK__?: DevtoolHook;
    }
    namespace NodeJS {
        interface Global {
            __VUE_DEVTOOLS_GLOBAL_HOOK__?: DevtoolHook;
        }
    }
}
