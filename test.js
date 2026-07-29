if (formResult && (formResult.has_form || formResult.type === 'FORM_WIDGET')) {
        let rawSchema = formResult.form_schema || formResult.formSchema || formResult.schema;

        // 🎯 Katmanlı iç içe objeyi aç (Unwrap)
        while (rawSchema && rawSchema.form_schema) {
          rawSchema = rawSchema.form_schema;
        }

        console.log("🚀 [DEBUG] En Derindeki Temiz Şema:", rawSchema);

        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            type: 'FORM_WIDGET',
            text: formResult.content || "Lütfen aşağıdaki formu doldurun:",
            form_schema: rawSchema
          }
        ]);
