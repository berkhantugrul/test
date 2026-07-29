// streamChat.js
export const streamChat = async (prompt, onToken, onFormWidget, onError) => {
  try {
    const response = await fetch("http://localhost:8000/api/v1/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    });

    const contentType = response.headers.get("content-type");

    // 🎯 BACKEND DOĞRUDAN JSON (FORM) DÖNDÜYSE:
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (data.type === "FORM_WIDGET") {
        onFormWidget(data); // Form widget callback'ini çalıştır!
        return;
      }
    }

    // 🎯 NORMAL STREAM AKIŞI:
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onToken(decoder.decode(value, { stream: true }));
    }

  } catch (err) {
    if (onError) onError(err);
  }
};
