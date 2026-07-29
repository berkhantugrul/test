// src/components/FormWidget.jsx
import React, { useState } from 'react';

export default function FormWidget({ schema, onSubmit, isDark = true }) {
  // 🎯 1. Şema iç içe gelmişse (nested) en derin katmana kadar in
  let actualSchema = schema;
  while (actualSchema && actualSchema.form_schema) {
    actualSchema = actualSchema.form_schema;
  }

  // 🎯 2. Input alanlarının dizisi (fields)
  const fields = actualSchema?.fields || actualSchema?.fields_schema || [];

  // ⚠️ Eğer 'fields' dizisi hâlâ boşsa ekrana kırmızılı teşhis kutusu bas
  if (!actualSchema || !fields || fields.length === 0) {
    return (
      <div className="p-3 my-2 border border-amber-500/50 bg-amber-500/10 text-amber-300 text-xs rounded-lg font-mono">
        ⚠️ Form şeması ulaştı ancak 'fields' (input alanları) dizisi ayıklanamadı.
        <br />
        <span className="text-[10px] text-zinc-400">Gelen Şema Yapısı: {JSON.stringify(schema)}</span>
      </div>
    );
  }

  // Form State Tanımlaması
  const [formData, setFormData] = useState(() => {
    const initial = {};
    fields.forEach((field) => {
      initial[field.name] = field.default !== undefined ? field.default : '';
    });
    return initial;
  });

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`mt-3 p-4 rounded-xl border shadow-md transition-all ${
        isDark 
          ? "bg-zinc-950 border-zinc-800 text-zinc-100" 
          : "bg-white border-zinc-200 text-zinc-800"
      }`}
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800/60">
        <span className="text-sm">⚙️</span>
        <h4 className="text-xs font-bold tracking-wide uppercase text-zinc-400">
          {actualSchema.title || "İşlem Formu"}
        </h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map((field) => {
          const isFullWidth = field.name === 'pool_members';
          
          return (
            <div key={field.name} className={isFullWidth ? "md:col-span-2" : "col-span-1"}>
              <label className="block text-[11px] font-medium mb-1 text-zinc-400">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              
              {field.type === 'select' ? (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 text-xs outline-none transition border ${
                    isDark 
                      ? "bg-zinc-900 border-zinc-700/60 text-zinc-200 focus:border-red-500" 
                      : "bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500"
                  }`}
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={formData[field.name] || ''}
                  placeholder={field.placeholder || ''}
                  required={field.required}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-xs outline-none transition ${
                    isDark 
                      ? "bg-zinc-900 border-zinc-700/60 text-zinc-200 placeholder-zinc-600 focus:border-red-500" 
                      : "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-red-500"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <button
        type="submit"
        className="mt-4 w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium py-2 px-4 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-md shadow-red-600/20"
      >
        <span>🚀</span>
        <span>VIP Konfigürasyonunu Oluştur</span>
      </button>
    </form>
  );
}
