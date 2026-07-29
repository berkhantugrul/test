const checkForm = async (prompt) => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/chat/check-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      return await response.json();
    } catch (err) {
      return { has_form: false };
    }
  };

  // =========================================================================
  // 3. YENİ: Form Doldurulup Gönderildiğinde Çalışan Fonksiyon (MCP)
  // =========================================================================
  const submitForm = async (formId, formData) => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/chat/form-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form_id: formId, data: formData }),
      });

      const result = await response.json();

      // MCP çalıştıktan sonra gelen yanıtı doğrudan chat listesine ekliyoruz
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          type: "TEXT",
          text: result.content,
        },
      ]);
    } catch (err) {
      console.error("Form gönderim hatası:", err);
    }
  };

  // =========================================================================
  // 4. YENİ: Ana Yönlendirici Fonksiyon (Giriş Kapısı)
  // =========================================================================
  const sendMessage = async (prompt) => {
    if (!prompt.trim() || isStreaming) return;

    // Kullanıcı mesajını ekrana bas
    setMessages((prev) => [...prev, { sender: "user", text: prompt }]);

    // 🎯 ADIM A: Önce bağımsız form kontrolü yap
    const formRes = await checkForm(prompt);

    if (formRes?.has_form) {
      // 🛑 Form gerekiyorsa: streamChat'e HİÇ GİRMEDEN ekrana Form basılır
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          type: "FORM_WIDGET",
          text: formRes.content,
          form_schema: formRes.form_schema,
        },
      ]);
      return; // StreamChat tetiklenmeden burada biter
    }

    // 🎯 ADIM B: Form gerekmiyorsa: Orijinal streamChat fonksiyonu çalışır
    await streamChat(prompt);
  };
