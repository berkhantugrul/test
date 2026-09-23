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


async def fetch_pool_details(client: httpx.AsyncClient, pool_name: str, partition: str = "Common") -> dict:
    """Hem Varsayılan hem de CSW Pool'larının üye ve monitör detaylarını çeken yardımcı fonksiyon."""
    if not pool_name:
        return {"monitors": [], "members": []}
    
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
        
        return {"monitors": monitors, "members": pool_members}
    except Exception as e:
        print(f"Pool detayları çekilemedi ({pool_name}):", e)
        return {"monitors": [], "members": []}


async def fetch_vip_topology(vip_name: str, partition: str = "Common") -> dict:
    """Belirli bir VIP'in tüm bağımlılıklarını (iRule, Profile, Policy, Default Pool ve CSW Policy Pool'ları) çeker."""
    vip_path = f"~{partition}~{vip_name}"
    endpoint = f"/mgmt/tm/ltm/virtual/{vip_path}?expandSubcollections=true"
    
    async with httpx.AsyncClient(
        auth=(F5_USER, F5_PASS), 
        verify=False, 
        timeout=10.0
    ) as client:
        vip_data = await f5_request(client, endpoint)
        
        # 1. VIP Temel Bilgileri
        profiles = [p.get("name") for p in vip_data.get("profilesReference", {}).get("items", [])]
        rules = [r.split("/")[-1] for r in vip_data.get("rules", [])]

        pool_raw = vip_data.get("pool", "")
        default_pool_name = pool_raw.split("/")[-1] if pool_raw else None

        # 2. VIP'ye Atanmış Policy'leri Doğrudan /policies Subcollection Endpoint'inden Çek
        policies = []
        try:
            policies_endpoint = f"/mgmt/tm/ltm/virtual/{vip_path}/policies"
            policies_data = await f5_request(client, policies_endpoint)
            policies = [p.get("name") for p in policies_data.get("items", []) if p.get("name")]
        except Exception as e:
            print(f"VIP Policy listesi çekilemedi ({vip_name}):", e)

        # 3. Varsayılan Pool Detayları
        default_pool_details = await fetch_pool_details(client, default_pool_name, partition)

        # 4. Yakalanan Policy'leri Tarayarak CSW (Content Switching) Pool'larını Bulma
        csw_pools = []
        for pol_name in policies:
            try:
                pol_path = f"~{partition}~{pol_name}"
                rules_endpoint = f"/mgmt/tm/ltm/policy/{pol_path}/rules?expandSubcollections=true"
                rules_data = await f5_request(client, rules_endpoint)
                
                for rule_item in rules_data.get("items", []):
                    rule_name = rule_item.get("name")
                    actions = rule_item.get("actionsReference", {}).get("items", [])
                    
                    if not actions and "actions" in rule_item:
                        actions = rule_item.get("actions", [])

                    for act in actions:
                        # Policy kuralında bir target/forward pool yönlendirmesi var mı?
                        csw_pool_raw = act.get("pool", "")
                        if csw_pool_raw:
                            csw_pool_name = csw_pool_raw.split("/")[-1]
                            
                            # CSW Pool üyelerini ve monitörlerini çek
                            csw_pool_details = await fetch_pool_details(client, csw_pool_name, partition)
                            
                            csw_pools.append({
                                "policy_name": pol_name,
                                "rule_name": rule_name,
                                "pool_name": csw_pool_name,
                                "monitors": csw_pool_details["monitors"],
                                "members": csw_pool_details["members"]
                            })
            except Exception as e:
                print(f"Policy kuralları okunamadı ({pol_name}):", e)

        return {
            "vip_name": vip_name,
            "destination": vip_data.get("destination", "").split("/")[-1],
            "profiles": profiles,
            "rules": rules,
            "policies": policies,
            "pool": default_pool_name,
            "monitors": default_pool_details["monitors"],
            "pool_members": default_pool_details["members"],
            "csw_pools": csw_pools  # CSW Policy üzerinden gelen dinamik pool'lar ve üyeleri
        }
