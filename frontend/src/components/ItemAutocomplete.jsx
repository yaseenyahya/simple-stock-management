import { useCallback, useEffect, useRef, useState } from 'react'
import client from '../api/client'

const DEBOUNCE_MS = 400

export default function ItemAutocomplete({ value, onSelect, disabled, invalid }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const timer = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (value?.item_name) {
      setQuery(value.item_name)
      setSelected(value)
    } else {
      setQuery('')
      setSelected(null)
    }
  }, [value])

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const fetchSuggestions = useCallback(async (q) => {
    setLoading(true)
    try {
      const { data } = await client.get('/api/items/search', { params: { query: q } })
      setSuggestions(data.success ? data.data : [])
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const onChangeInput = (e) => {
    const v = e.target.value
    setQuery(v)
    setSelected(null)
    onSelect(null)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      fetchSuggestions(v.trim())
      setOpen(true)
    }, DEBOUNCE_MS)
  }

  const pick = (item) => {
    setSelected(item)
    setQuery(item.item_name)
    setOpen(false)
    onSelect(item)
  }

  return (
    <div ref={wrapRef} className="position-relative">
      <input
        type="text"
        className={`form-control ${invalid ? 'is-invalid' : ''}`}
        placeholder="Type to search item..."
        value={query}
        onChange={onChangeInput}
        onFocus={() => {
          if (query.trim()) {
            fetchSuggestions(query.trim())
            setOpen(true)
          }
        }}
        disabled={disabled}
        autoComplete="off"
      />
      {loading && (
        <div className="position-absolute end-0 top-50 translate-middle-y me-2">
          <span className="spinner-border spinner-border-sm text-info" />
        </div>
      )}
      {open && suggestions.length > 0 && (
        <ul className="list-group position-absolute w-100 autocomplete-dropdown shadow border mt-1">
          {suggestions.map((s) => (
            <li key={s.id} className="list-group-item list-group-item-action py-2" role="button" tabIndex={0} onClick={() => pick(s)} onKeyDown={(e) => e.key === 'Enter' && pick(s)}>
              <small className="text-muted">#{s.id}</small> {s.item_name}
            </li>
          ))}
        </ul>
      )}
      {selected && <input type="hidden" name="item_id" value={selected.id} readOnly />}
    </div>
  )
}
