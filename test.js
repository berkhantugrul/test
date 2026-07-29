# api/llm_module.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.skill_retriever import skill_retriever

router = APIRouter(prefix="/api/v1/chat", tags=["Form & Skill Engine"])

class FormCheckRequest(BaseModel):
    message: str

class FormSubmitRequest(BaseModel):
    form_id: str
    data: dict

# ------------------------------------------------------------------------------
# 🎯 1. YENİ ENDPOINT: Sadece Form Gerekli mi Kontrol Eden Bağımsız Servis
# ------------------------------------------------------------------------------
@router.post("/check-form")
async def check_form_requirement(req: FormCheckRequest):
    user_prompt = req.message.strip()
    if not user_prompt:
        return {"has_form": False}

    # Prompt'a karşılık gelen .md kartını sorgula
    relevant_skills = skill_retriever.retrieve_relevant_skills(user_prompt, top_k=1)

    if relevant_skills:
        selected_skill = relevant_skills[0]
        # Eğer kart içerisinde form_schema varsa Form verisini dön
        if "form_schema" in selected_skill and selected_skill["form_schema"]:
            return {
                "has_form": True,
                "type": "FORM_WIDGET",
                "content": f"{selected_skill.get('name', 'İşlem')} için lütfen aşağıdaki formu doldurun:",
                "form_schema": selected_skill["form_schema"]
            }

    return {"has_form": False}


# ------------------------------------------------------------------------------
# 🎯 2. YENİ ENDPOINT: Form Doldurulduğunda MCP Fonksiyonunu Çalıştıran Servis
# ------------------------------------------------------------------------------
@router.post("/form-submit")
async def handle_form_submission(req: FormSubmitRequest):
    if req.form_id == "new_vip_rest_form":
        from f5_server import TOOL_REGISTRY
        target_tool = TOOL_REGISTRY.get("create_vip_via_rest")

        if not target_tool:
            raise HTTPException(status_code=500, detail="MCP Fonksiyonu bulunamadı.")

        # Formdan gelen ham JSON paketi doğrudan MCP fonksiyonuna paslanır
        mcp_result = await target_tool(payload=req.data)

        if mcp_result.get("status") == "success":
            return {
                "status": "success",
                "content": (
                    f"✅ **{req.data.get('application_name')}** uygulaması için VIP ve Pool başarıyla oluşturuldu!\n\n"
                    f"• **Virtual Server:** `{mcp_result.get('vip_name')}` ({mcp_result.get('vip_destination')})\n"
                    f"• **Pool:** `{mcp_result.get('pool_name')}`"
                )
            }
        else:
            return {
                "status": "error",
                "content": f"❌ VIP oluşturulamadı: {mcp_result.get('details', 'Hata')}"
            }

    raise HTTPException(status_code=400, detail="Tanımsız Form ID")
