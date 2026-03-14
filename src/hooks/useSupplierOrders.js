import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading]     = useState(true)
  const load = useCallback(async () => {
    const { data } = await supabase.from('suppliers').select('*').eq('is_active', true).order('name')
    setSuppliers(data ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  return { suppliers, loading, reload: load }
}

export function useSupplierOrders() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('supplier_orders')
      .select('*, items:supplier_order_items(*)')
      .order('created_at', { ascending: false })
    setOrders(data ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  return { orders, loading, reload: load }
}
