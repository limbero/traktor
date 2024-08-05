import { useStore } from 'zustand'
import tokenStore from './TokenStore'

export const useTokenStore = () => useStore(tokenStore)