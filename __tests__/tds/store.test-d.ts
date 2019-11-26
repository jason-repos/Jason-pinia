import { createStore } from '../../src'
import { expectType, expectError } from 'tsd'

const store = createStore(
  'name',
  () => ({ a: 'on' as 'on' | 'off' }),
  {
    upper: state => state.a.toUpperCase(),
  },
  {
    doStuff(store, n: number, a: 'on' | 'off') {},
  }
)

expectType<{ a: 'on' | 'off' }>(store.state)

expectError(() => store.nonExistant)
