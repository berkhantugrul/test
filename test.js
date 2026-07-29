// Kullanıcı mesajı eklendikten HEMEN SONRA:
  try {
    const checkRes = await fetch('http://localhost:8000/api/v1/chat/check-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userPrompt }),
    });
    
    const formResult = await checkRes.json();

    // EĞER FORM GEREKİYORSA: streamChat çalıştırılmaz!
    if (formResult && (formResult.has_form || formResult.type === 'FORM_WIDGET' || formResult.form_schema)) {
      const schemaData = formResult.form_schema || formResult.formSchema || formResult.schema || formResult;

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          type: 'FORM_WIDGET',
          text: formResult.content || "⚙️ Lütfen aşağıdaki parametreleri doldurun:",
          form_schema: schemaData
        }
      ]);
      return; // 🛑 streamChat çalıştırmadan burada durur
    }
  } catch (err) {
    console.error("Form kontrol hatası:", err);
  }
