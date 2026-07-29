{/* 💬 ChatWindow.jsx içinde messages.map döngüsü içi */}
{msg.type === 'FORM_WIDGET' || Boolean(msg.form_schema) ? (
  <div className="w-full">
    <p className="whitespace-pre-wrap font-sans font-medium mb-3">{msg.text}</p>
    
    <FormWidget
      schema={msg.form_schema}
      onSubmit={(formData) => handleFormSubmit(msg.form_schema?.form_id || 'new_vip_rest_form', formData)}
      isDark={isDark}
    />
  </div>
) : (
  /* Standart Metin Mesajı */
  <span className="whitespace-pre-wrap font-sans font-normal">{msg.text}</span>
)}
