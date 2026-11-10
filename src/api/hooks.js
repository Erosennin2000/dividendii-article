// Small hooks for reading data. In mock mode they answer synchronously from sample data (so server rendering and tests
// stay simple). In live mode they fetch, and keep the sample answer on screen until the real one arrives.
import { useEffect, useState } from 'react'
import { call } from './index.js'
import { isLive } from './config.js'
import { seriesFor } from '../data/catalog.js'

export function useSeries(stock, range) {
  const mock = seriesFor(stock.ticker, stock.price, stock.prev, range, stock.low52, stock.high52)
  const [live, setLive] = useState(null)
  useEffect(() => {
    if (!isLive('market.history')) return
    let off = false
    call('market.history', { ticker: stock.ticker, range }).then(r => { if (!off && r?.data?.values?.length) setLive({ key: stock.ticker + range, ...r.data }) }).catch(() => {})
    return () => { off = true }
  }, [stock.ticker, range])
  return live && live.key === stock.ticker + range ? live : mock
}
