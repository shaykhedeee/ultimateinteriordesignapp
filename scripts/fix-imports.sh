line=$(grep -n "import PipelineStudio" frontend/src/App.jsx | cut -d: -f1)
sed -i "${line}iimport PipelineStudio from './screens/PipelineStudio.jsx';" frontend/src/App.jsx
# remove duplicate added import if any
sed -i "/^$((line+1))p/d" frontend/src/App.jsx || true
sed -n '18,35p' frontend/src/App.jsx
