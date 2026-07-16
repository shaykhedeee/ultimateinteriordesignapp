
from pathlib import Path
path = Path(r'X:\OFFLINEGANG\ULTIMATE INTERIOR DESIGN APP\ultimateinteriordesignapp\server\services\aura-chat-service.js')
text = path.read_text(encoding='utf-8')
text = text.replace('Authorization: *** ${key}`', 'Authorization: `Bearer ${key}`')
path.write_text(text, encoding='utf-8')
print('PATCHED')
