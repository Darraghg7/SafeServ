import React, { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { useSession } from '../../contexts/SessionContext'
import { useToast } from '../../components/ui/Toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'

function useDeliveryChecks() {
  const [checks, setChecks] = useState([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('delivery_checks')
      .select('*, checker:staff!checked_by(name)')
      .order('checked_at', { ascending: false })
      .limit(100)
    setChecks(data ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  return { checks, loading, reload: load }
}

const EMPTY_FORM = {
  supplier_name: '',
  items_desc: '',
  temp_reading: '',
  temp_pass: true,
  packaging_ok: true,
  use_by_ok: true,
  notes: '',
}

function PassFailChip({ pass, label }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-medium ${
      pass ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
    }`}>
      {pass ? 'PASS' : 'FAIL'}{label && <span className="opacity-60 normal-case"> {label}</span>}
    </span>
  )
}

export default function DeliveryChecksPage() {
  const toast = useToast()
  const { session, isManager } = useSession()
  const { checks, loading, reload } = useDeliveryChecks()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [filter, setFilter] = useState('all') // all | pass | fail

  const overallPass = form.temp_pass && form.packaging_ok && form.use_by_ok

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `delivery-photos/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('training-files').upload(path, file)
    if (error) { toast('Upload failed: ' + error.message, 'error'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('training-files').getPublicUrl(path)
    setPhotoUrl(publicUrl)
    setUploading(false)
    toast('Photo uploaded')
  }

  const save = async () => {
    if (!form.supplier_name.trim()) { toast('Supplier name is required', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('delivery_checks').insert({
      supplier_name: form.supplier_name.trim(),
      items_desc: form.items_desc.trim() || null,
      temp_reading: form.temp_reading ? parseFloat(form.temp_reading) : null,
      temp_pass: form.temp_pass,
      packaging_ok: form.packaging_ok,
      use_by_ok: form.use_by_ok,
      overall_pass: overallPass,
      photo_url: photoUrl || null,
      notes: form.notes.trim() || null,
      checked_by: session?.staffId,
    })
    setSaving(false)
    if (error) { toast(error.message, 'error'); return }
    toast('Delivery check recorded')
    setForm(EMPTY_FORM)
    setPhotoUrl('')
    setShowForm(false)
    reload()
  }

  const filtered = filter === 'all'
    ? checks
    : filter === 'pass'
      ? checks.filter(c => c.overall_pass)
      : checks.filter(c => !c.overall_pass)

  const passCount = checks.filter(c => c.overall_pass).length
  const failCount = checks.filter(c => !c.overall_pass).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-charcoal">Delivery Checks</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-charcoal text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-charcoal/90 transition-colors"
        >
          + Log Delivery
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: checks.length, color: 'text-charcoal' },
          { label: 'Passed', value: passCount, color: 'text-success' },
          { label: 'Failed', value: failCount, color: 'text-danger' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-charcoal/10 p-4 text-center">
            <p className="text-[10px] tracking-widest uppercase text-charcoal/40">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'pass', 'fail'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filter === f
                ? 'bg-charcoal text-cream border-charcoal'
                : 'bg-white text-charcoal/50 border-charcoal/15 hover:border-charcoal/30'
            }`}
          >
            {f === 'all' ? 'All' : f === 'pass' ? 'Passed' : 'Failed'}
          </button>
        ))}
      </div>

      {/* Records */}
      {loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-charcoal/10 p-10 text-center">
          <p className="text-charcoal/30 text-sm">No delivery checks recorded yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(c => (
            <div key={c.id} className={`bg-white rounded-xl border p-4 ${c.overall_pass ? 'border-charcoal/10' : 'border-danger/25 bg-danger/3'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-charcoal">{c.supplier_name}</h3>
                    <PassFailChip pass={c.overall_pass} />
                  </div>
                  {c.items_desc && <p className="text-sm text-charcoal/60 mt-1">{c.items_desc}</p>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {c.temp_reading != null && (
                      <span className="text-xs text-charcoal/50">Temp: {c.temp_reading}C</span>
                    )}
                    <PassFailChip pass={c.temp_pass} label="temp" />
                    <PassFailChip pass={c.packaging_ok} label="packaging" />
                    <PassFailChip pass={c.use_by_ok} label="dates" />
                  </div>
                  {c.notes && <p className="text-xs text-charcoal/40 mt-2 italic">{c.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-charcoal/40">{format(new Date(c.checked_at), 'd MMM HH:mm')}</p>
                  <p className="text-[10px] text-charcoal/30 mt-0.5">{c.checker?.name ?? 'Unknown'}</p>
                </div>
              </div>
              {c.photo_url && (
                <a href={c.photo_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-accent hover:underline">
                  View delivery note photo
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add delivery modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Log Delivery Check">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] tracking-widest uppercase text-charcoal/40 block mb-1">Supplier <span className="text-danger">*</span></label>
            <input
              type="text"
              value={form.supplier_name}
              onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))}
              placeholder="e.g. Sysco, Brakes, local butcher"
              className="w-full px-4 py-2.5 rounded-xl border border-charcoal/15 bg-cream/30 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal/20"
            />
          </div>

          <div>
            <label className="text-[10px] tracking-widest uppercase text-charcoal/40 block mb-1">Items received</label>
            <input
              type="text"
              value={form.items_desc}
              onChange={e => setForm(f => ({ ...f, items_desc: e.target.value }))}
              placeholder="e.g. Chicken, dairy, veg"
              className="w-full px-4 py-2.5 rounded-xl border border-charcoal/15 bg-cream/30 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal/20"
            />
          </div>

          <div>
            <label className="text-[10px] tracking-widest uppercase text-charcoal/40 block mb-1">Temperature reading (C)</label>
            <input
              type="number"
              step="0.1"
              value={form.temp_reading}
              onChange={e => setForm(f => ({ ...f, temp_reading: e.target.value }))}
              placeholder="e.g. 3.2"
              className="w-full px-4 py-2.5 rounded-xl border border-charcoal/15 bg-cream/30 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal/20 font-mono"
            />
          </div>

          {/* Pass/fail toggles */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] tracking-widest uppercase text-charcoal/40">Checks</p>
            {[
              { key: 'temp_pass', label: 'Temperature acceptable' },
              { key: 'packaging_ok', label: 'Packaging intact' },
              { key: 'use_by_ok', label: 'Use-by dates valid' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                  form[key]
                    ? 'bg-success/5 border-success/20 text-charcoal'
                    : 'bg-danger/5 border-danger/20 text-danger'
                }`}
              >
                <span className="text-sm font-medium">{label}</span>
                <span className={`text-xs font-semibold tracking-wider uppercase ${form[key] ? 'text-success' : 'text-danger'}`}>
                  {form[key] ? 'PASS' : 'FAIL'}
                </span>
              </button>
            ))}
          </div>

          {/* Overall status preview */}
          <div className={`rounded-xl px-4 py-3 text-center text-sm font-semibold ${
            overallPass ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          }`}>
            Overall: {overallPass ? 'PASS' : 'FAIL'}
          </div>

          <div>
            <label className="text-[10px] tracking-widest uppercase text-charcoal/40 block mb-1">Delivery note photo</label>
            <input type="file" accept="image/*" onChange={handlePhoto} className="text-sm" />
            {uploading && <p className="text-xs text-charcoal/40 mt-1">Uploading...</p>}
            {photoUrl && <p className="text-xs text-success mt-1">Photo attached</p>}
          </div>

          <div>
            <label className="text-[10px] tracking-widest uppercase text-charcoal/40 block mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Any issues or observations..."
              className="w-full px-4 py-2.5 rounded-xl border border-charcoal/15 bg-cream/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-charcoal/20"
            />
          </div>

          <button
            onClick={save}
            disabled={saving || !form.supplier_name.trim()}
            className="bg-charcoal text-cream py-3 rounded-xl text-sm font-medium hover:bg-charcoal/90 transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Record Delivery Check'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
