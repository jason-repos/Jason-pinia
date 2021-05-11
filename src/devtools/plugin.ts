import { setupDevtoolsPlugin, TimelineEvent } from '@vue/devtools-api'
import { App } from 'vue'
import { PiniaPluginContext, setActivePinia } from '../rootStore'
import {
  GenericStore,
  GettersTree,
  MutationType,
  StateTree,
  _Method,
} from '../types'
import {
  formatEventData,
  formatMutationType,
  formatStoreForInspectorState,
  formatStoreForInspectorTree,
} from './formatting'

/**
 * Registered stores used for devtools.
 */
const registeredStores = /*#__PURE__*/ new Set<GenericStore>()

let isAlreadyInstalled: boolean | undefined
// timeline can be paused when directly changing the state
let isTimelineActive = true
const componentStateTypes: string[] = []

const MUTATIONS_LAYER_ID = 'pinia:mutations'
const INSPECTOR_ID = 'pinia'

export function addDevtools(app: App, store: GenericStore) {
  registeredStores.add(store)
  componentStateTypes.push('🍍 ' + store.$id)
  setupDevtoolsPlugin(
    {
      id: 'dev.esm.pinia',
      label: 'Pinia 🍍',
      logo: 'https://pinia.esm.dev/logo.svg',
      packageName: 'pinia',
      homepage: 'https://pinia.esm.dev',
      componentStateTypes,
      app,
    },
    (api) => {
      // watch(router.currentRoute, () => {
      //   // @ts-ignore
      //   api.notifyComponentUpdate()
      // })

      // TODO: only load stores used by the component?
      api.on.inspectComponent((payload, ctx) => {
        if (payload.instanceData) {
          payload.instanceData.state.push({
            type: '🍍 ' + store.$id,
            key: 'state',
            editable: false,
            value: store.$state,
          })

          if (store._getters?.length) {
            payload.instanceData.state.push({
              type: '🍍 ' + store.$id,
              key: 'getters',
              editable: false,
              value: store._getters.reduce((getters, key) => {
                getters[key] = store[key]
                return getters
              }, {} as GettersTree<StateTree>),
            })
          }
        }
      })

      if (!isAlreadyInstalled) {
        api.addTimelineLayer({
          id: MUTATIONS_LAYER_ID,
          label: `Pinia 🍍`,
          color: 0xe5df88,
        })

        api.addInspector({
          id: INSPECTOR_ID,
          label: 'Pinia 🍍',
          icon: 'storage',
          treeFilterPlaceholder: 'Search stores',
        })

        api.on.getInspectorTree((payload) => {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            const stores = Array.from(registeredStores)

            payload.rootNodes = (payload.filter
              ? stores.filter((store) =>
                  store.$id.toLowerCase().includes(payload.filter.toLowerCase())
                )
              : stores
            ).map(formatStoreForInspectorTree)
          }
        })

        api.on.getInspectorState((payload) => {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            const store = Array.from(registeredStores).find(
              (store) => store.$id === payload.nodeId
            )

            if (!store) {
              return toastMessage(
                `store "${payload.nodeId}" not found`,
                'error'
              )
            }

            if (store) {
              payload.state = {
                options: formatStoreForInspectorState(store),
              }
            }
          }
        })

        api.on.editInspectorState((payload) => {
          if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
            const store = Array.from(registeredStores).find(
              (store) => store.$id === payload.nodeId
            )

            if (!store) {
              return toastMessage(
                `store "${payload.nodeId}" not found`,
                'error'
              )
            }

            const { path } = payload
            if (path[0] !== 'state') {
              return toastMessage(
                `Invalid path for store "${payload.nodeId}":\n${path}\nOnly state can be modified.`
              )
            }

            // rewrite the first entry to be able to directly set the state as
            // well as any other path
            path[0] = '$state'
            isTimelineActive = false
            payload.set(store, path, payload.state.value)
            isTimelineActive = true
          }
        })

        isAlreadyInstalled = true
      } else {
        api.sendInspectorTree(INSPECTOR_ID)
        api.sendInspectorState(INSPECTOR_ID)
      }

      store.$onAction(({ after, onError, name, args, store }) => {
        const groupId = runningActionId++

        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: {
            time: Date.now(),
            title: '🛫 ' + name,
            data: args,
            groupId,
          },
        })

        after(() => {
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: Date.now(),
              title: '🛬 ' + name,
              data: args,
              groupId,
            },
          })
        })

        onError((error) => {
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: Date.now(),
              logType: 'error',
              title: '❌ ' + name,
              data: {
                args,
                error,
              },
              groupId,
            },
          })
        })
      })

      store.$subscribe(({ events, type }, state) => {
        if (!isTimelineActive) return
        // rootStore.state[store.id] = state

        api.notifyComponentUpdate()
        api.sendInspectorState(INSPECTOR_ID)

        const eventData: TimelineEvent = {
          time: Date.now(),
          title: formatMutationType(type),
          data: formatEventData(events),
          groupId: activeAction,
        }

        // reset for the next mutation
        activeAction = undefined

        if (type === MutationType.patchFunction) {
          eventData.subtitle = '⤵️'
        } else if (type === MutationType.patchObject) {
          eventData.subtitle = '🧩'
        } else if (events && !Array.isArray(events)) {
          eventData.subtitle = events.type
        }

        if (events) {
          eventData.data['rawEvent(s)'] = {
            _custom: {
              display: 'DebuggerEvent',
              type: 'object',
              tooltip: 'raw DebuggerEvent[]',
              value: events,
            },
          }
        }

        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: eventData,
        })
      })

      // trigger an update so it can display new registered stores
      // @ts-ignore
      api.notifyComponentUpdate()
      toastMessage(`"${store.$id}" store installed`)
    }
  )
}

let runningActionId = 0
let activeAction: number | undefined

/**
 * pinia.use(devtoolsPlugin)
 */
export function devtoolsPlugin<
  Id extends string = string,
  S extends StateTree = StateTree,
  G extends GettersTree<S> = GettersTree<S>,
  A = Record<string, _Method>
>({ app, store, options, pinia }: PiniaPluginContext<Id, S, G, A>) {
  const wrappedActions = {} as Pick<typeof store, keyof A>

  // original actions of the store as they are given by pinia. We are going to override them
  const actions = Object.keys(options.actions || ({} as A)).reduce(
    (storeActions, actionName) => {
      storeActions[actionName as keyof A] = store[actionName as keyof A]
      return storeActions
    },
    {} as Pick<typeof store, keyof A>
  )

  for (const actionName in actions) {
    // @ts-expect-error
    wrappedActions[actionName] = function () {
      setActivePinia(pinia)
      // the running action id is incremented in a before action hook
      const _actionId = runningActionId
      const trackedStore = new Proxy(store, {
        get(...args) {
          activeAction = _actionId
          return Reflect.get(...args)
        },
        set(...args) {
          activeAction = _actionId
          return Reflect.set(...args)
        },
      })
      return actions[actionName].apply(
        trackedStore,
        (arguments as unknown) as any[]
      )
    }
  }

  addDevtools(app, store)

  return { ...wrappedActions }
}

/**
 * Shows a toast or console.log
 *
 * @param message - message to log
 * @param type - different color of the tooltip
 */
function toastMessage(
  message: string,
  type?: 'normal' | 'error' | 'warning' | undefined
) {
  const piniaMessage = '🍍 ' + message

  if (typeof __VUE_DEVTOOLS_TOAST__ === 'function') {
    __VUE_DEVTOOLS_TOAST__(piniaMessage, type)
  } else if (type === 'error') {
    console.error(piniaMessage)
  } else if (type === 'warning') {
    console.warn(piniaMessage)
  } else {
    console.log(piniaMessage)
  }
}
