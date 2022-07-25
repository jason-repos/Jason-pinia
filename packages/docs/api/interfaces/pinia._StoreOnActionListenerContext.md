---
sidebar: "auto"
editLinks: false
sidebarDepth: 3
---

[API Documentation](../index.md) / [pinia](../modules/pinia.md) / \_StoreOnActionListenerContext

# Interface: \_StoreOnActionListenerContext<Store, ActionName, A\>

[pinia](../modules/pinia.md)._StoreOnActionListenerContext

Actual type for [StoreOnActionListenerContext](../modules/pinia.md#storeonactionlistenercontext). Exists for refactoring
purposes. For internal use only.
For internal use **only**

## Type parameters

| Name | Type |
| :------ | :------ |
| `Store` | `Store` |
| `ActionName` | extends `string` |
| `A` | `A` |

## Properties

### after

• **after**: (`callback`: `A` extends `Record`<`ActionName`, [`_Method`](../modules/pinia.md#_method)\> ? (`resolvedReturn`: [`_Awaited`](../modules/pinia.md#_awaited)<`ReturnType`<`A`[`ActionName`]\>\>) => `void` : () => `void`) => `void`

#### Type declaration

▸ (`callback`): `void`

Sets up a hook once the action is finished. It receives the return value
of the action, if it's a Promise, it will be unwrapped.

##### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | `A` extends `Record`<`ActionName`, [`_Method`](../modules/pinia.md#_method)\> ? (`resolvedReturn`: [`_Awaited`](../modules/pinia.md#_awaited)<`ReturnType`<`A`[`ActionName`]\>\>) => `void` : () => `void` |

##### Returns

`void`

#### Defined in

[packages/pinia/src/types.ts:203](https://github.com/vuejs/pinia/blob/aa0192a/packages/pinia/src/types.ts#L203)

___

### args

• **args**: `A` extends `Record`<`ActionName`, [`_Method`](../modules/pinia.md#_method)\> ? `Parameters`<`A`[`ActionName`]\> : `unknown`[]

Parameters passed to the action

#### Defined in

[packages/pinia/src/types.ts:195](https://github.com/vuejs/pinia/blob/aa0192a/packages/pinia/src/types.ts#L195)

___

### name

• **name**: `ActionName`

Name of the action

#### Defined in

[packages/pinia/src/types.ts:185](https://github.com/vuejs/pinia/blob/aa0192a/packages/pinia/src/types.ts#L185)

___

### onError

• **onError**: (`callback`: (`error`: `unknown`) => `void`) => `void`

#### Type declaration

▸ (`callback`): `void`

Sets up a hook if the action fails. Return `false` to catch the error and
stop it fro propagating.

##### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | (`error`: `unknown`) => `void` |

##### Returns

`void`

#### Defined in

[packages/pinia/src/types.ts:213](https://github.com/vuejs/pinia/blob/aa0192a/packages/pinia/src/types.ts#L213)

___

### store

• **store**: `Store`

Store that is invoking the action

#### Defined in

[packages/pinia/src/types.ts:190](https://github.com/vuejs/pinia/blob/aa0192a/packages/pinia/src/types.ts#L190)
