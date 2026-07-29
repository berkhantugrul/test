{msg.type === 'FORM_WIDGET' ? (
  <div className="w-full">
    <p className="whitespace-pre-wrap font-sans font-medium mb-3">{msg.text}</p>
    
    {msg.form_schema ? (
      <FormWidget
        schema={msg.form_schema}
        onSubmit={(formData) => handleFormSubmit(msg.form_schema.form_id || 'new_vip_rest_form', formData)}
        isDark={isDark}
      />
    ) : (
      <div className="p-3 border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs rounded-lg font-mono">
        ⚠️ Mesaj tipi FORM_WIDGET ancak 'form_schema' içeriği boş/geçersiz geldi.
      </div>
    )}
  </div>
) : (
  /* Normal Metin Mesajı */
  <span className="whitespace-pre-wrap font-sans font-normal">{msg.text}</span>
)}
