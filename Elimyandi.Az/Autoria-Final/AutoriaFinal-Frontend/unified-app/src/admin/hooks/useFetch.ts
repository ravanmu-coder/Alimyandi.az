import { useState, useEffect } from 'react'

interface UseFetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseFetchOptions {
  immediate?: boolean
  dependencies?: any[]
}

export function useFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchOptions = {}
) {
  const { immediate = true, dependencies = [] } = options
  
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: immediate,
    error: null
  })

  const execute = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await fetchFn()
      setState({
        data: result,
        loading: false,
        error: null
      })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      })
    }
  }

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, dependencies)

  return {
    ...state,
    refetch: execute
  }
}

// Specialized hook for API calls that always return null/error
export function useApiCall<T>(
  apiCall: () => Promise<T>,
  options: UseFetchOptions = {}
) {
  const { immediate = true, dependencies = [] } = options
  
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: immediate,
    error: null
  })

  const execute = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // This will always fail since API endpoints are not implemented
      await apiCall()
      setState({
        data: null,
        loading: false,
        error: 'API endpoint not implemented'
      })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'API endpoint not implemented'
      })
    }
  }

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, dependencies)

  return {
    ...state,
    refetch: execute
  }
}
