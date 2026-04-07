import { useState, FormEvent } from "react";
import { usePortfolio } from "../../contexts/PortfolioContext";
import { NoteDirection, CreateNoteDto, UpdateNoteDto, NoteDto } from "@vestly/shared";

function fmt(n: string | number) {
  return "$" + parseFloat(String(n)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const emptyForm = (): CreateNoteDto => ({
  direction: NoteDirection.INCOME,
  amount: 0,
  title: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  tags: [],
  walletId: undefined,
});

export default function NotesPage() {
  const { notes, wallets, createNote, updateNote, deleteNote } = usePortfolio();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NoteDto | null>(null);
  const [form, setForm] = useState<CreateNoteDto>(emptyForm());
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterDir, setFilterDir] = useState<"all" | NoteDirection>("all");

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setTagInput("");
    setError("");
    setShowModal(true);
  }

  function openEdit(note: NoteDto) {
    setEditing(note);
    setForm({
      direction: note.direction,
      amount: parseFloat(note.amount),
      title: note.title,
      description: note.description ?? "",
      date: note.date.slice(0, 10),
      tags: note.tags,
      walletId: note.walletId ?? undefined,
    });
    setTagInput("");
    setError("");
    setShowModal(true);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !(form.tags ?? []).includes(t)) {
      setForm((f) => ({ ...f, tags: [...(f.tags ?? []), t] }));
    }
    setTagInput("");
  }

  function removeTag(t: string) {
    setForm((f) => ({ ...f, tags: (f.tags ?? []).filter((x) => x !== t) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = { ...form, date: new Date(form.date).toISOString() };
      if (editing) {
        await updateNote(editing.id, payload as UpdateNoteDto);
      } else {
        await createNote(payload);
      }
      setShowModal(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to save note");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this note?")) return;
    await deleteNote(id);
  }

  const filtered = filterDir === "all" ? notes : notes.filter((n) => n.direction === filterDir);

  const totalIncome = notes.filter((n) => n.direction === NoteDirection.INCOME).reduce((s, n) => s + parseFloat(n.amount), 0);
  const totalExpense = notes.filter((n) => n.direction === NoteDirection.EXPENSE).reduce((s, n) => s + parseFloat(n.amount), 0);

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Notes</span>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={openCreate}>+ Add note</button>
        </div>
      </div>

      <div className="page">
        {/* Summary */}
        <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          <div className="metric-card">
            <div className="metric-label">Total income</div>
            <div className="metric-value up">{fmt(totalIncome)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total expenses</div>
            <div className="metric-value down">{fmt(totalExpense)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Net</div>
            <div className={`metric-value ${totalIncome - totalExpense >= 0 ? "up" : "down"}`}>{fmt(totalIncome - totalExpense)}</div>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {(["all", NoteDirection.INCOME, NoteDirection.EXPENSE] as const).map((d) => (
            <button key={d} className="btn" style={{ fontSize: 12, padding: "5px 12px", background: filterDir === d ? "var(--color-teal)" : undefined, color: filterDir === d ? "#fff" : undefined, borderColor: filterDir === d ? "var(--color-teal)" : undefined }} onClick={() => setFilterDir(d)}>
              {d === "all" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty"><p>No notes yet.</p><button className="btn btn-primary" onClick={openCreate}>+ Add note</button></div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((n) => {
              const wallet = wallets.find((w) => w.id === n.walletId);
              return (
                <div key={n.id} className="card" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px" }}>
                  <span className={`badge badge-${n.direction}`} style={{ flexShrink: 0, marginTop: 2 }}>{n.direction}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{n.title}</div>
                    {n.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{n.description}</div>}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {wallet && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>📁 {wallet.name}</span>}
                      {(n.tags ?? []).map((t) => (
                        <span key={t} style={{ fontSize: 11, padding: "1px 7px", borderRadius: 20, background: "var(--bg-surface)", color: "var(--text-secondary)" }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 500, color: n.direction === NoteDirection.INCOME ? "var(--color-teal-dark)" : "#993c1d" }}>
                      {n.direction === NoteDirection.INCOME ? "+" : "-"}{fmt(n.amount)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{new Date(n.date).toLocaleDateString()}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 6, justifyContent: "flex-end" }}>
                      <button className="btn-ghost" style={{ fontSize: 12, padding: "2px 6px" }} onClick={() => openEdit(n)}>Edit</button>
                      <button className="btn-ghost" style={{ fontSize: 12, padding: "2px 6px", color: "#993c1d" }} onClick={() => handleDelete(n.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? "Edit note" : "Add note"}</span>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Direction</label>
                  <select className="form-select" value={form.direction} onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value as NoteDirection }))}>
                    <option value={NoteDirection.INCOME}>Income</option>
                    <option value={NoteDirection.EXPENSE}>Expense</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input className="form-input" type="number" min="0.01" step="any" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) }))} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. AAPL dividend payment" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea className="form-input" rows={2} style={{ resize: "vertical" }} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Any additional notes…" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Wallet (optional)</label>
                  <select className="form-select" value={form.walletId ?? ""} onChange={(e) => setForm((f) => ({ ...f, walletId: e.target.value || undefined }))}>
                    <option value="">— none —</option>
                    {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tags</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input className="form-input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Add tag and press Enter" />
                  <button type="button" className="btn" onClick={addTag}>Add</button>
                </div>
                {(form.tags ?? []).length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {(form.tags ?? []).map((t) => (
                      <span key={t} style={{ fontSize: 12, padding: "2px 8px", borderRadius: 20, background: "var(--bg-surface)", border: "0.5px solid var(--border)", display: "flex", alignItems: "center", gap: 4 }}>
                        {t}
                        <button type="button" onClick={() => removeTag(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 12, padding: 0 }}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Saving…" : editing ? "Save changes" : "Add note"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
