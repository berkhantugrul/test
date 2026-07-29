const handleFormSubmit = async (formId, formData) => {
  try {
    const response = await fetch('http://localhost:8000/api/v1/chat/form-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_id: formId, data: formData }),
    });

    const result = await response.json();

    setMessages((prev) => [
      ...prev,
      {
        sender: 'ai',
        type: 'TEXT',
        text: result.content || result.message || "VIP konfigürasyonu başarıyla tamamlandı."
      }
    ]);
  } catch (err) {
    console.error("Form gönderim hatası:", err);
  }
};
