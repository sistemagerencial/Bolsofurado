import React, { useState, useEffect, useRef } from 'react';

type Category = { id: string; name: string; color?: string };

export type ExpenseFormData = {
  date: string;
  category: string;
  amount: string | number;
  type: 'normal' | 'parcelado' | 'assinatura';
  installments: number | string;
  entrada: string | number;
  description: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: ExpenseFormData, editingId?: string | null) => Promise<void>;
  categories: Category[];
  initialData?: Partial<ExpenseFormData>;
  editingId?: string | null;
  title?: string;
  onAddCategory?: () => void;
};

export default function ExpenseModal(props: Props) {
  const { open, onClose, onSave, categories, initialData, editingId, title, onAddCategory } = props;
  const today = new Date().toISOString().split('T')[0];
  const parceladoRef = useRef<HTMLDivElement | null>(null);
  const assinaturaRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: initialData?.date || today,
    category: initialData?.category || '',
    amount: initialData?.amount || '',
    type: (initialData?.type as any) || 'normal',
    installments: (initialData?.installments ?? '') as any,
    entrada: initialData?.entrada || '',
    description: initialData?.description || ''
  });
  const [saving, setSaving] = useState(false);
  const amountRef = useRef<HTMLInputElement | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        date: initialData?.date || today,
        category: initialData?.category || prev.category || '',
        amount: initialData?.amount || prev.amount || '',
        type: (initialData?.type as any) || prev.type || 'normal',
        installments: (initialData?.installments ?? prev.installments ?? '') as any,
        entrada: initialData?.entrada || prev.entrada || '',
        description: initialData?.description || prev.description || ''
      }));
      setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, 0);
    }
  }, [open, initialData]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev || ''; };
  }, [open]);

  // Ensure wheel events scroll the modal content (not the page), including when
  // the cursor is over sticky footer/controls. Attach a non-passive listener to
  // the modal wrapper and manually scroll the inner scrollRef when possible.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const el = scrollRef.current;
    if (!wrapper || !el) return;
    const onWheel = (e: WheelEvent) => {
      // only act when the event originated inside the modal wrapper
      const target = e.target as Node | null;
      if (!target || !wrapper.contains(target)) return;
      const delta = e.deltaY;
      const atTop = el.scrollTop === 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if ((delta < 0 && !atTop) || (delta > 0 && !atBottom)) {
        e.preventDefault();
        e.stopPropagation();
        el.scrollTop += delta;
      }
    };
    // attach in capture phase on window to ensure we catch wheel events even
    // when the cursor is over sticky children or form controls
    window.addEventListener('wheel', onWheel as any, { passive: false, capture: true });
    // keep wrapper listener as well for robustness
    wrapper.addEventListener('wheel', onWheel as any, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel as any, { capture: true } as EventListenerOptions);
      wrapper.removeEventListener('wheel', onWheel as any);
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const amountNumber = parseFloat(typeof formData.amount === 'string' ? formData.amount.replace(',', '.') : String(formData.amount));
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setLocalError('Informe um valor válido.');
      if (amountRef.current) {
        // scroll amount into view and focus
        const sc = scrollRef.current;
        try { amountRef.current.focus(); } catch (err) {}
        if (sc && amountRef.current) {
          const el = amountRef.current as HTMLElement;
          const elRect = el.getBoundingClientRect();
          const scRect = sc.getBoundingClientRect();
          const offset = elRect.top - scRect.top + sc.scrollTop;
          sc.scrollTo({ top: Math.max(0, offset - 120), behavior: 'smooth' });
        }
      }
      return;
    }
    // normalize installments to number for saving when parcelado
    const normalized: ExpenseFormData = {
      ...formData,
      installments: formData.type === 'parcelado' ? (parseInt(String(formData.installments)) || 1) : formData.installments
    } as any;
    setSaving(true);
    try {
      await onSave(normalized, editingId || null);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar despesa (ExpenseModal):', err);
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayWheel = (e: React.WheelEvent) => {
    const sc = scrollRef.current;
    if (!sc) return;
    const delta = e.deltaY;
    const atTop = sc.scrollTop === 0;
    const atBottom = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 1;
    if ((delta < 0 && !atTop) || (delta > 0 && !atBottom)) {
      e.preventDefault();
      e.stopPropagation();
      sc.scrollTop += delta;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-[9999] p-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 64px)' }}
      onClick={onClose}
      onWheel={handleOverlayWheel}
    >
      <div ref={wrapperRef} className="bg-[#16122A] border border-white/10 w-full sm:max-w-md shadow-2xl flex flex-col overflow-hidden rounded-none sm:rounded-2xl" style={{ height: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 16px)' }} onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 left-0 right-0 w-full bg-[#16122A] p-6 border-b border-white/10 flex items-center justify-between z-[10000]">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#EF4444]/20 to-[#DC2626]/20 flex items-center justify-center"><i className="ri-subtract-line text-2xl text-[#EF4444]"></i></div>
            <h2 className="text-2xl font-bold text-[#F9FAFB]">{title || (editingId ? 'Editar Despesa' : 'Nova Despesa')}</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"><i className="ri-close-line text-xl text-[#F9FAFB]"></i></button>
        </div>
        <div className="p-6 flex-1">
          <form className="flex flex-col h-full" onSubmit={handleSubmit}>
            <div ref={scrollRef} className="space-y-5 overflow-y-auto overscroll-contain pr-2" style={{ maxHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 140px)', paddingBottom: formData.type === 'parcelado' ? 'calc(env(safe-area-inset-bottom) + 200px)' : 'calc(env(safe-area-inset-bottom) + 96px)' }}>
              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Data</label>
                <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required className="w-full bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] text-sm focus:outline-none focus:border-[#EF4444] transition-all" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Categoria</label>
                <div className="flex gap-2">
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required className="flex-1 bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] text-sm focus:outline-none focus:border-[#EF4444] transition-all cursor-pointer">
                    <option value="">Selecione uma categoria</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  {onAddCategory && (
                    <button type="button" onClick={onAddCategory} className="w-12 h-12 rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/30 flex items-center justify-center transition-all cursor-pointer flex-shrink-0">
                      <i className="ri-add-line text-xl text-[#EF4444]"></i>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Tipo</label>
                <div className="flex gap-2">
                  <select
                    data-testid="expense-type-select"
                    value={formData.type}
                    onChange={e => {
                      const newType = e.target.value as any;
                      setFormData(prev => ({ ...prev, type: newType, installments: newType === 'parcelado' ? '' : prev.installments } as any));
                      setTimeout(() => {
                        const sc = scrollRef.current;
                        if (!sc) return;
                        requestAnimationFrame(() => {
                          const reserve = 220; // space to keep above sticky footer/botões
                          if (newType === 'parcelado' && parceladoRef.current) {
                            const el = parceladoRef.current as HTMLElement;
                            const elRect = el.getBoundingClientRect();
                            const scRect = sc.getBoundingClientRect();
                            const offset = elRect.top - scRect.top + sc.scrollTop;
                            sc.scrollTo({ top: Math.max(0, offset - reserve), behavior: 'smooth' });
                          }
                          if (newType === 'assinatura' && assinaturaRef.current) {
                            const el = assinaturaRef.current as HTMLElement;
                            const elRect = el.getBoundingClientRect();
                            const scRect = sc.getBoundingClientRect();
                            const offset = elRect.top - scRect.top + sc.scrollTop;
                            sc.scrollTo({ top: Math.max(0, offset - reserve), behavior: 'smooth' });
                          }
                        });
                      }, 60);
                    }}
                    className="flex-1 bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] text-sm focus:outline-none focus:border-[#EF4444] transition-all cursor-pointer"
                  >
                    <option value="normal">Normal</option>
                    <option value="parcelado">Parcelado</option>
                    <option value="assinatura">Assinatura</option>
                  </select>
                </div>
                <div className="mt-2 text-sm text-[#9CA3AF]">Selecionado: {formData.type}</div>
                {formData.type === 'assinatura' && (
                  <div className="mt-3 p-3 rounded-lg bg-[#0B1220] border border-white/5 text-sm text-[#9CA3AF]">
                    Assinatura: serão criados 12 lançamentos mensais a partir da data informada. Você poderá editar ou excluir os lançamentos individualmente depois.
                  </div>
                )}
              </div>

              {formData.type === 'parcelado' && (
                <div ref={parceladoRef} className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Número de Parcelas</label>
                    <input type="number" min={1} value={formData.installments as any} onChange={e => setFormData({ ...formData, installments: e.target.value })} className="w-full bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-[#EF4444] transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Entrada (opcional)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">R$</span>
                      <input type="number" step="0.01" min="0" value={formData.entrada as any} onChange={e => setFormData({ ...formData, entrada: e.target.value })} className="w-full bg-[#0E0B16] border border-white/10 rounded-lg pl-12 pr-4 py-3 text-[#F9FAFB] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#EF4444] transition-all text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {formData.type === 'assinatura' && (
                <div ref={assinaturaRef}>
                  <p className="text-sm text-[#9CA3AF]">Assinatura: serão criados 12 lançamentos mensais a partir da data informada.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Descrição (opcional)</label>
                <textarea placeholder="Observações adicionais (opcional)" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[#0E0B16] border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#EF4444] transition-all" rows={3} />
              </div>
              <div className="bg-[#16122A] p-4 border-t border-white/10">
                <label className="block text-sm font-medium text-[#F9FAFB] mb-2">Valor</label>
                <div className="relative mb-3">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">R$</span>
                  <input ref={amountRef} type="number" step="0.01" min="0.01" placeholder="0,00" value={formData.amount as any} onChange={e => setFormData({ ...formData, amount: e.target.value })} required className="w-full bg-[#0E0B16] border border-white/10 rounded-lg pl-12 pr-4 py-3 text-[#F9FAFB] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#EF4444] transition-all" />
                </div>
              </div>

              <div className="bg-[#16122A] p-4 border-t border-white/10 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-[#F9FAFB] font-medium transition-all cursor-pointer whitespace-nowrap">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] text-white font-semibold transition-all cursor-pointer shadow-lg shadow-[#EF4444]/20 whitespace-nowrap disabled:opacity-60">{saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Adicionar'}</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
