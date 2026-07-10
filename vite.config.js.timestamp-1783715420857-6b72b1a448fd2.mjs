// vite.config.js
import { defineConfig } from "file:///C:/Users/USER/Documents/Muskans%20autocad%20solution/THE%20ULTIMATE%20INTERIOR%20DESIGN%20APPLICATION/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/USER/Documents/Muskans%20autocad%20solution/THE%20ULTIMATE%20INTERIOR%20DESIGN%20APPLICATION/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/USER/Documents/Muskans%20autocad%20solution/THE%20ULTIMATE%20INTERIOR%20DESIGN%20APPLICATION/node_modules/@tailwindcss/vite/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  root: "frontend",
  server: {
    port: 5175,
    host: "127.0.0.1"
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    target: "es2020",
    cssMinify: true,
    rollupOptions: {
      output: {
        // Split heavy vendors so they cache independently and parse in parallel.
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "vendor-react";
            if (id.includes("three") || id.includes("@react-three")) return "vendor-3d";
            if (id.includes("chart") || id.includes("d3")) return "vendor-charts";
            if (id.includes("pdf") || id.includes("jspdf") || id.includes("canvas")) return "vendor-pdf";
            return "vendor";
          }
        }
      }
    }
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "zustand", "axios"],
    rolldownOptions: { output: { target: "es2020" } }
  },
  esbuild: { target: "es2020" }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVU0VSXFxcXERvY3VtZW50c1xcXFxNdXNrYW5zIGF1dG9jYWQgc29sdXRpb25cXFxcVEhFIFVMVElNQVRFIElOVEVSSU9SIERFU0lHTiBBUFBMSUNBVElPTlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcVVNFUlxcXFxEb2N1bWVudHNcXFxcTXVza2FucyBhdXRvY2FkIHNvbHV0aW9uXFxcXFRIRSBVTFRJTUFURSBJTlRFUklPUiBERVNJR04gQVBQTElDQVRJT05cXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL1VTRVIvRG9jdW1lbnRzL011c2thbnMlMjBhdXRvY2FkJTIwc29sdXRpb24vVEhFJTIwVUxUSU1BVEUlMjBJTlRFUklPUiUyMERFU0lHTiUyMEFQUExJQ0FUSU9OL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ0B0YWlsd2luZGNzcy92aXRlJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCksIHRhaWx3aW5kY3NzKCldLFxuICByb290OiAnZnJvbnRlbmQnLFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTc1LFxuICAgIGhvc3Q6ICcxMjcuMC4wLjEnXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiAnLi4vZGlzdCcsXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gICAgdGFyZ2V0OiAnZXMyMDIwJyxcbiAgICBjc3NNaW5pZnk6IHRydWUsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIC8vIFNwbGl0IGhlYXZ5IHZlbmRvcnMgc28gdGhleSBjYWNoZSBpbmRlcGVuZGVudGx5IGFuZCBwYXJzZSBpbiBwYXJhbGxlbC5cbiAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdyZWFjdCcpKSByZXR1cm4gJ3ZlbmRvci1yZWFjdCc7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3RocmVlJykgfHwgaWQuaW5jbHVkZXMoJ0ByZWFjdC10aHJlZScpKSByZXR1cm4gJ3ZlbmRvci0zZCc7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2NoYXJ0JykgfHwgaWQuaW5jbHVkZXMoJ2QzJykpIHJldHVybiAndmVuZG9yLWNoYXJ0cyc7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3BkZicpIHx8IGlkLmluY2x1ZGVzKCdqc3BkZicpIHx8IGlkLmluY2x1ZGVzKCdjYW52YXMnKSkgcmV0dXJuICd2ZW5kb3ItcGRmJztcbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nLCAnenVzdGFuZCcsICdheGlvcyddLFxuICAgIHJvbGxkb3duT3B0aW9uczogeyBvdXRwdXQ6IHsgdGFyZ2V0OiAnZXMyMDIwJyB9IH1cbiAgfSxcbiAgZXNidWlsZDogeyB0YXJnZXQ6ICdlczIwMjAnIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFxZCxTQUFTLG9CQUFvQjtBQUNsZixPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFFeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFBQSxFQUNoQyxNQUFNO0FBQUEsRUFDTixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLElBQ2IsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBO0FBQUEsUUFFTixhQUFhLElBQUk7QUFDZixjQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFDL0IsZ0JBQUksR0FBRyxTQUFTLE9BQU8sRUFBRyxRQUFPO0FBQ2pDLGdCQUFJLEdBQUcsU0FBUyxPQUFPLEtBQUssR0FBRyxTQUFTLGNBQWMsRUFBRyxRQUFPO0FBQ2hFLGdCQUFJLEdBQUcsU0FBUyxPQUFPLEtBQUssR0FBRyxTQUFTLElBQUksRUFBRyxRQUFPO0FBQ3RELGdCQUFJLEdBQUcsU0FBUyxLQUFLLEtBQUssR0FBRyxTQUFTLE9BQU8sS0FBSyxHQUFHLFNBQVMsUUFBUSxFQUFHLFFBQU87QUFDaEYsbUJBQU87QUFBQSxVQUNUO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLFNBQVMsYUFBYSxvQkFBb0IsV0FBVyxPQUFPO0FBQUEsSUFDdEUsaUJBQWlCLEVBQUUsUUFBUSxFQUFFLFFBQVEsU0FBUyxFQUFFO0FBQUEsRUFDbEQ7QUFBQSxFQUNBLFNBQVMsRUFBRSxRQUFRLFNBQVM7QUFDOUIsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
