import { defineStore } from './store'

export const createStore = ((options: any) => {
  console.warn(
    '[🍍]: "createStore" has been deprecated and will be removed on the sable release, use "defineStore" instead.'
  )
  return defineStore(options)
}) as typeof defineStore
