import os
import httpx

# F5 Bağlantı Bilgileri
F5_HOST = os.getenv("F5_HOST", "https://10.10.1.50")
F5_USER = os.getenv("F5_USER", "admin")
F5_PASS = os.getenv("F5_PASS", "sifre")


async def f5_request(client: httpx.AsyncClient, endpoint: str) -> dict:
    """httpx.AsyncClient kullanarak F5 REST API isteği atar"""
    url = f"{F5_HOST}{endpoint}"
    response = await client.get(url)
    
    if response.status_code != 200:
        raise Exception(f"F5 Hatası [{response.status_code}]: {response.text}")
        
    return response.json()


async def fetch_all_vips(partition: str = "Common") -> list:
    """F5 üzerindeki tüm Virtual Server (VIP) isimlerini asenkron olarak getirir."""
    endpoint = "/mgmt/tm/ltm/virtual?$select=name,fullPath,destination"
    
    # SSL doğrulamasını (verify=False) kapatıp BasicAuth ile oturum açıyoruz
    async with httpx.AsyncClient(
        auth=(F5_USER, F5_PASS), 
        verify=False, 
        timeout=10.0
    ) as client:
        data = await f5_request(client, endpoint)
        
        vips = []
        for item in data.get("items", []):
            if partition and f"/{partition}/" not in item.get("fullPath", ""):
                continue
            vips.append(item.get("name"))
            
        return sorted(vips)


async def fetch_vip_topology(vip_name: str, partition: str = "Common") -> dict:
    """Belirli bir VIP'in tüm bağımlılıklarını asenkron olarak çeker."""
    vip_path = f"~{partition}~{vip_name}"
    endpoint = f"/mgmt/tm/ltm/virtual/{vip_path}?expandSubcollections=true"
    
    # Bağlantı havuzunu (connection pool) tek istemcide yönetiyoruz
    async with httpx.AsyncClient(
        auth=(F5_USER, F5_PASS), 
        verify=False, 
        timeout=10.0
    ) as client:
        vip_data = await f5_request(client, endpoint)
        
        # 1. VIP Temel Bilgileri
        profiles = [p.get("name") for p in vip_data.get("profilesReference", {}).get("items", [])]
        rules = [r.split("/")[-1] for r in vip_data.get("rules", [])]
        policies = [p.split("/")[-1] for p in vip_data.get("policies", [])]
        
        pool_raw = vip_data.get("pool", "")
        pool_name = pool_raw.split("/")[-1] if pool_raw else None
        
        monitors = []
        pool_members = []

        # 2. Bağlı Pool varsa Detaylarını Çek
        if pool_name:
            try:
                pool_path = f"~{partition}~{pool_name}"
                pool_endpoint = f"/mgmt/tm/ltm/pool/{pool_path}?expandSubcollections=true"
                pool_data = await f5_request(client, pool_endpoint)
                
                # Sağlık Kontrolü (Monitor)
                raw_monitor = pool_data.get("monitor", "")
                monitors = [m.split("/")[-1] for m in raw_monitor.split(" ") if m and m != "and"]
                
                # Pool Üyeleri (Members)
                members_items = pool_data.get("membersReference", {}).get("items", [])
                pool_members = [m.get("name") for m in members_items]
            except Exception as e:
                print(f"Pool detayları çekilemedi ({pool_name}):", e)

        return {
            "vip_name": vip_name,
            "destination": vip_data.get("destination", "").split("/")[-1],
            "profiles": profiles,
            "rules": rules,
            "policies": policies,
            "pool": pool_name,
            "monitors": monitors,
            "pool_members": pool_members
        }

from f5_service import fetch_all_vips, fetch_vip_topology

@app.get("/api/v1/f5/vips")
async def get_vips(partition: str = "Common"):
    try:
        vips = await fetch_all_vips(partition=partition)
        return vips
    except Exception as e:
        print("F5 API Hatası (vips):", e)
        # Fallback Mock Veri
        return ["VS_PAYMENT_API", "VS_WEB_PORTAL", "VS_MOBILE_BACKEND", "VS_AUTH_SERVICE"]


# 2. SEÇİLEN VIP'İN TOPOLOJİSİNİ DÖNEN ASENKRON ENDPOINT
@app.get("/api/v1/f5/vip-topology/{vip_name}")
async def get_vip_topology(vip_name: str, partition: str = "Common"):
    try:
        topology = await fetch_vip_topology(vip_name=vip_name, partition=partition)
        return topology
    except Exception as e:
        print(f"F5 API Hatası ({vip_name}):", e)
        raise HTTPException(status_code=500, detail=str(e))
