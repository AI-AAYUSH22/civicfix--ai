import os
import re

mumbai_wards = [
    {"name": "Ward A - Churchgate, Colaba, Fort", "code": "A", "city": "Mumbai", "lat": 18.9220, "lng": 72.8347},
    {"name": "Ward B - Masjid Bunder, Dongri", "code": "B", "city": "Mumbai", "lat": 18.9515, "lng": 72.8375},
    {"name": "Ward C - Pydhonie, Bhuleshwar", "code": "C", "city": "Mumbai", "lat": 18.9525, "lng": 72.8273},
    {"name": "Ward D - Malabar Hill, Grant Road", "code": "D", "city": "Mumbai", "lat": 18.9667, "lng": 72.8167},
    {"name": "Ward E - Byculla, Nagpada", "code": "E", "city": "Mumbai", "lat": 18.9772, "lng": 72.8335},
    {"name": "Ward F/North - Matunga, Sion", "code": "F/N", "city": "Mumbai", "lat": 19.0268, "lng": 72.8553},
    {"name": "Ward F/South - Parel, Sewri", "code": "F/S", "city": "Mumbai", "lat": 18.9954, "lng": 72.8396},
    {"name": "Ward G/North - Dadar, Dharavi", "code": "G/N", "city": "Mumbai", "lat": 19.0178, "lng": 72.8478},
    {"name": "Ward G/South - Worli, Lower Parel", "code": "G/S", "city": "Mumbai", "lat": 19.0068, "lng": 72.8156},
    {"name": "Ward H/East - Santacruz East, Kalina", "code": "H/E", "city": "Mumbai", "lat": 19.0805, "lng": 72.8530},
    {"name": "Ward H/West - Bandra West", "code": "H/W", "city": "Mumbai", "lat": 19.0596, "lng": 72.8295},
    {"name": "Ward K/East - Andheri East", "code": "K/E", "city": "Mumbai", "lat": 19.1136, "lng": 72.8697},
    {"name": "Ward K/West - Andheri West", "code": "K/W", "city": "Mumbai", "lat": 19.1363, "lng": 72.8277},
    {"name": "Ward P/North - Malad", "code": "P/N", "city": "Mumbai", "lat": 19.1866, "lng": 72.8486},
    {"name": "Ward P/South - Goregaon", "code": "P/S", "city": "Mumbai", "lat": 19.1645, "lng": 72.8499},
    {"name": "Ward R/Central - Borivali", "code": "R/C", "city": "Mumbai", "lat": 19.2307, "lng": 72.8567},
    {"name": "Ward R/North - Dahisar", "code": "R/N", "city": "Mumbai", "lat": 19.2501, "lng": 72.8593},
    {"name": "Ward R/South - Kandivali", "code": "R/S", "city": "Mumbai", "lat": 19.2045, "lng": 72.8360},
    {"name": "Ward L - Kurla, Sakinaka", "code": "L", "city": "Mumbai", "lat": 19.0726, "lng": 72.8845},
    {"name": "Ward M/East - Govandi, Mankhurd", "code": "M/E", "city": "Mumbai", "lat": 19.0560, "lng": 72.9126},
    {"name": "Ward M/West - Chembur", "code": "M/W", "city": "Mumbai", "lat": 19.0345, "lng": 72.8953},
    {"name": "Ward N - Ghatkopar", "code": "N", "city": "Mumbai", "lat": 19.0864, "lng": 72.9082},
    {"name": "Ward S - Bhandup, Vikhroli", "code": "S", "city": "Mumbai", "lat": 19.1438, "lng": 72.9304},
    {"name": "Ward T - Mulund", "code": "T", "city": "Mumbai", "lat": 19.1723, "lng": 72.9565},
]

thane_wards = [
    {"name": "Naupada - Kopri", "code": "TMC-1", "city": "Thane", "lat": 19.1824, "lng": 72.9696},
    {"name": "Uthalsar", "code": "TMC-2", "city": "Thane", "lat": 19.1979, "lng": 72.9774},
    {"name": "Majiwada - Manpada", "code": "TMC-3", "city": "Thane", "lat": 19.2301, "lng": 72.9712},
    {"name": "Vartak Nagar", "code": "TMC-4", "city": "Thane", "lat": 19.2066, "lng": 72.9529},
    {"name": "Wagle Estate", "code": "TMC-5", "city": "Thane", "lat": 19.1915, "lng": 72.9463},
    {"name": "Lokmanya Nagar - Savarkar Nagar", "code": "TMC-6", "city": "Thane", "lat": 19.2132, "lng": 72.9427},
    {"name": "Kalwa", "code": "TMC-7", "city": "Thane", "lat": 19.1994, "lng": 72.9972},
    {"name": "Mumbra", "code": "TMC-8", "city": "Thane", "lat": 19.1760, "lng": 73.0233},
    {"name": "Diva", "code": "TMC-9", "city": "Thane", "lat": 19.1852, "lng": 73.0401},
]

navi_mumbai_wards = [
    {"name": "Belapur", "code": "NMMC-1", "city": "Navi Mumbai", "lat": 19.0163, "lng": 73.0374},
    {"name": "Nerul", "code": "NMMC-2", "city": "Navi Mumbai", "lat": 19.0330, "lng": 73.0180},
    {"name": "Turbhe", "code": "NMMC-3", "city": "Navi Mumbai", "lat": 19.0725, "lng": 73.0157},
    {"name": "Vashi", "code": "NMMC-4", "city": "Navi Mumbai", "lat": 19.0700, "lng": 72.9980},
    {"name": "Kopar Khairane", "code": "NMMC-5", "city": "Navi Mumbai", "lat": 19.1026, "lng": 73.0035},
    {"name": "Ghansoli", "code": "NMMC-6", "city": "Navi Mumbai", "lat": 19.1254, "lng": 72.9992},
    {"name": "Airoli", "code": "NMMC-7", "city": "Navi Mumbai", "lat": 19.1517, "lng": 72.9934},
    {"name": "Digha", "code": "NMMC-8", "city": "Navi Mumbai", "lat": 19.1678, "lng": 72.9930},
]

all_wards = mumbai_wards + thane_wards + navi_mumbai_wards

# 1. Patch demo_data.py
demo_data_path = "backend/app/seed/demo_data.py"
with open(demo_data_path, "r", encoding="utf-8") as f:
    demo_content = f.read()

python_wards_str = "    wards_data = [\n"
for w in all_wards:
    python_wards_str += f'        {{"name": "{w["name"]}", "code": "{w["code"]}", "city": "{w["city"]}", "lat": {w["lat"]}, "lng": {w["lng"]}}},\n'
python_wards_str += "    ]"

demo_content = re.sub(
    r'wards_data = \[\s*.*?\s*\]',
    python_wards_str,
    demo_content,
    flags=re.DOTALL
)

# Fix roads so they don't break
roads_replacement = '''
    # 4. Roads
    roads_data = [
        (wards[7], "Gokhale Road North"),
        (wards[7], "Ranade Road"),
        (wards[10], "Hill Road"),
        (wards[10], "Linking Road"),
        (wards[11], "Sahar Road"),
        (wards[11], "Andheri-Kurla Road"),
        (wards[18], "LBS Marg"),
        (wards[24], "Gokhale Road Thane"),
        (wards[26], "Ghodbunder Highway"),
        (wards[36], "Palm Beach Road"),
        (wards[34], "Nerul Station Road"),
    ]
'''
demo_content = re.sub(
    r'# 4\. Roads.*?roads_data = \[.*?\]',
    roads_replacement.strip(),
    demo_content,
    flags=re.DOTALL
)

# Fix cases to point to the correct updated wards indices
# Case 1 & 2: G/N (Dadar) -> wards[7]
# Case 3 & 4: H/W (Bandra) -> wards[10]
# Case 5 & 6: K/E (Andheri) -> wards[11]
cases_replacement = '''
    # 5. Realistic Cases across all lifecycle stages
    now = datetime.utcnow()
    c1 = contractors[0]
    w1 = wards[7]  # G/N
    r1 = roads[0]
'''
demo_content = re.sub(
    r'# 5\. Realistic Cases across all lifecycle stages.*?\n    r1 = roads\[0\]',
    cases_replacement.strip(),
    demo_content,
    flags=re.DOTALL
)

demo_content = demo_content.replace('ward_id=wards[1].id', 'ward_id=wards[10].id')
demo_content = demo_content.replace('ward_id=wards[2].id', 'ward_id=wards[11].id')


with open(demo_data_path, "w", encoding="utf-8") as f:
    f.write(demo_content)

# 2. Patch mockData.ts
mock_data_path = "frontend/src/data/mockData.ts"
with open(mock_data_path, "r", encoding="utf-8") as f:
    mock_content = f.read()

ts_wards_str = "export const wards: Ward[] = [\n"
for w in all_wards:
    pending = 12 if "Mumbai" in w["city"] else (4 if "Thane" in w["city"] else 2)
    ts_wards_str += f"  {{ id: '{w['code']}', name: '{w['name']}', city: '{w['city']}', pendingCount: {pending} }},\n"
ts_wards_str += "];"

mock_content = re.sub(
    r'export const wards: Ward\[\] = \[\s*.*?\s*\];',
    ts_wards_str,
    mock_content,
    flags=re.DOTALL
)
with open(mock_data_path, "w", encoding="utf-8") as f:
    f.write(mock_content)

print("Patching complete!")
