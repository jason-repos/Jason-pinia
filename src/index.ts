import { ref, watch } from '@vue/composition-api'
import { Ref } from '@vue/composition-api/dist/reactivity'
import {
  StateTree,
  Store,
  SubscriptionCallback,
  DeepPartial,
  isPlainObject,
} from './types'
import { devtoolPlugin } from './devtools'

function createState<S extends StateTree>(initialState: S) {
  const state: Ref<S> = ref(initialState)

  // type State = UnwrapRef<typeof state>

  function replaceState(newState: S) {
    state.value = newState
  }

  return {
    state,
    replaceState,
  }
}

function innerPatch<T extends StateTree>(
  target: T,
  patchToApply: DeepPartial<T>
): T {
  // TODO: get all keys
  for (const key in patchToApply) {
    const subPatch = patchToApply[key]
    const targetValue = target[key]
    if (isPlainObject(targetValue) && isPlainObject(subPatch)) {
      target[key] = innerPatch(targetValue, subPatch)
    } else {
      // @ts-ignore
      target[key] = subPatch
    }
  }

  return target
}

export function createStore<S extends StateTree>(
  name: string,
  initialState: S
  // methods: Record<string | symbol, StoreMethod>
): Store<S> {
  const { state, replaceState } = createState(initialState)

  let isListening = true
  const subscriptions: SubscriptionCallback<S>[] = []

  watch(
    () => state.value,
    state => {
      if (isListening) {
        subscriptions.forEach(callback => {
          callback({ storeName: name, type: '🧩 in place', payload: {} }, state)
        })
      }
    },
    {
      deep: true,
      flush: 'sync',
    }
  )

  function patch(partialState: DeepPartial<S>): void {
    isListening = false
    innerPatch(state.value, partialState)
    isListening = true
    subscriptions.forEach(callback => {
      callback(
        { storeName: name, type: '⤵️ patch', payload: partialState },
        state.value
      )
    })
  }

  function subscribe(callback: SubscriptionCallback<S>): void {
    subscriptions.push(callback)
    // TODO: return function to remove subscription
  }

  const store: Store<S> = {
    name,
    // it is replaced below by a getter
    state: state.value,

    patch,
    subscribe,
    replaceState: (newState: S) => {
      isListening = false
      replaceState(newState)
      isListening = true
    },
  }

  // make state access invisible
  Object.defineProperty(store, 'state', {
    get: () => state.value,
  })

  // Devtools injection hue hue
  devtoolPlugin(store)

  return store
}

// export const store = createStore('main', initialState)
// export const cartStore = createStore('cart', {
//   items: ['thing 1'],
// })

// store.patch({
//   toggle: 'off',
//   nested: {
//     a: {
//       b: {
//         c: 'one',
//       },
//     },
//   },
// })
