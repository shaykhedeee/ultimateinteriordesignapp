import sys
sys.path.insert(0, r'X:\OFFLINEGANG\ULTIMATE INTERIOR DESIGN APP\ultimateinteriordesignapp\llm_orchestrator')
from orchestrator import InteriorDesignOrchestrator

orc = InteriorDesignOrchestrator(llm=None)
proj = orc.create_project('smoothed')
fp = {
    'rooms': [
        {'id': 'living', 'name': 'Living Room', 'corners': [{'x':0,'y':0},{'x':5.2,'y':0},{'x':5.2,'y':3.8},{'x':0,'y':3.8}], 'room_type': 'living_room'},
        {'id': 'kitchen', 'name': 'Kitchen', 'corners': [{'x':5.4,'y':0},{'x':8.4,'y':0},{'x':8.4,'y':3.8},{'x':5.4,'y':3.8}], 'room_type': 'kitchen'},
        {'id': 'bed', 'name': 'Master Bed', 'corners': [{'x':5.4,'y':4.0},{'x':8.4,'y':4.0},{'x':8.4,'y':8.0},{'x':5.4,'y':8.0}], 'room_type': 'bedroom'},
    ]
}
res = orc.ingest_floor_plan(proj.project_id, fp)
print('ROOMS:', list(res['rooms'].keys()))

for rid in ['living', 'kitchen', 'bed']:
    layout = orc.generate_layout(proj.project_id, rid)
    qa = orc.run_qa(proj.project_id, rid)
    print(f"{rid}: {len(layout['placed_furniture'])} items -> QA {qa['final_verdict']} score={qa['watchdog_score']}")
    for item in layout['placed_furniture']:
        print(f"  {item['name']} @ ({item['x']}, {item['y']}) rot={item['rotation']}")

print('ALL PASS')
