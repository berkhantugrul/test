import React from "react";
import FormWidget from "./FormWidget";

export default function ChatMessage({ message, onFormSubmit }) {
  // EĞER FORMSA FORM WIDGET'I BASSIN
  if (message.type === "FORM_WIDGET" && message.form_schema) {
    return (
      <div className="chat-bubble ai bg-gray-800 text-white p-4 rounded-xl my-2">
        <p className="text-sm font-semibold mb-3">{message.text}</p>
        <FormWidget
          schema={message.form_schema}
          onSubmit={onFormSubmit}
        />
      </div>
    );
  }

  // NORMAL SOHBET MESAJI
  return (
    <div className={`chat-bubble ${message.sender}`}>
      <p className="whitespace-pre-wrap">{message.text}</p>
    </div>
  );
}
