import { useStore } from 'zustand'
import tokenStore from './TokenStore'

export const useTokenStore = (selector: any) => useStore(tokenStore, selector)