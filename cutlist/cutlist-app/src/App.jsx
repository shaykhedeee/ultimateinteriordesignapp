import React, { useState, useEffect } from "react";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import CabinetForm from "./components/Calculator/CabinetForm";
import PartListTable from "./components/Calculator/PartListTable";
import SettingsPanel from "./components/WhiteLabel/SettingsPanel";
import ProjectManager from "./components/Calculator/ProjectManager";
import QuickImport from "./components/Calculator/QuickImport";
import NestVisualizer from "./components/Nesting/NestVisualizer";
import defaultWhiteLabel from "./config/whiteLabel.json";
import { nestPanels } from "./utils/nestOptimizer";

import {
  calculateBaseCabinet,
  calculateWallCabinet,
  calculateDrawerCabinet,
  calculateWardrobe,
  calculateBlindCornerBase,
  calculateLCornerBase
} from "./utils/cabinetMath";
import { getBrandingProfile } from "./services/storageService";

export default function App() {
  // Preloaded standard configurations (Base kitchen, Wall glass unit, and Sliding Wardrobe)
  const defaultCabinets = [
    {
      id: "B-1082",
      type: "base",
      name: "Modular Hob Cabinet",
      width: 900,
      height: 720,
      depth: 560,
      carcassThickness: 18,
      backingThickness: 9,
      backingRecessOffset: 16,
      backingGrooveDepth: 8,
      carcassEdgeband: 0.8,
      shutterEdgeband: 2.0,
      carcassMaterial: "18mm BWR Plywood",
      backingMaterial: "9mm BWR Plywood",
      shutterMaterial: "18mm Acrylic/MDF",
      shutterType: "double",
      numShelves: 1
    },
    {
      id: "WD-9032",
      type: "wardrobe",
      name: "Master Sliding Wardrobe",
      width: 1500,
      height: 2100,
      depth: 600,
      carcassThickness: 18,
      backingThickness: 9,
      backingRecessOffset: 16,
      backingGrooveDepth: 8,
      carcassEdgeband: 0.8,
      shutterEdgeband: 2.0,
      carcassMaterial: "18mm BWR Plywood",
      backingMaterial: "9mm BWR Plywood",
      shutterMaterial: "18mm Acrylic/MDF",
      shutterType: "sliding",
      numShelves: 4,
      hasVerticalDivider: true
    },
    {
      id: "W-9403",
      type: "wall",
      name: "Overhead Glass Unit",
      width: 600,
      height: 600,
      depth: 300,
      carcassThickness: 18,
      backingThickness: 6,
      backingRecessOffset: 12,
      backingGrooveDepth: 6,
      carcassEdgeband: 0.8,
      shutterEdgeband: 2.0,
      carcassMaterial: "18mm HDMR",
      backingMaterial: "6mm HDMR",
      shutterMaterial: "18mm PU Lacquer",
      shutterType: "single",
      numShelves: 2
    }
  ];

  const [cabinets, setCabinets] = useState(defaultCabinets);

  // Active Project metadata state
  const [projectMetadata, setProjectMetadata] = useState({
    id: "",
    projectName: "Luxury 3BHK Cutlist Plan",
    clientName: "Mr. Mehta",
    siteReference: "Orchid Heights, Sector 3, HSR Layout, Bengaluru",
    supervisorName: "Gopal Carpenter"
  });

  // White-label settings state
  const [whiteLabel, setWhiteLabel] = useState(defaultWhiteLabel);

  // Load custom branding from database on app mount
  useEffect(() => {
    async function loadSavedBranding() {
      try {
        const savedBranding = await getBrandingProfile();
        if (savedBranding) {
          setWhiteLabel(savedBranding);
          // Apply color themes directly to document root variables
          if (savedBranding.primaryColor) {
            document.documentElement.style.setProperty("--primary-color", savedBranding.primaryColor);
          }
          if (savedBranding.secondaryColor) {
            document.documentElement.style.setProperty("--secondary-color", savedBranding.secondaryColor);
          }
          if (savedBranding.accentColor) {
            document.documentElement.style.setProperty("--accent-color", savedBranding.accentColor);
          }
        }
      } catch (err) {
        console.error("Failed to load custom branding:", err);
      }
    }
    loadSavedBranding();
  }, []);

  const handleAddCabinet = (newCabinet) => {
    setCabinets((prev) => [...prev, newCabinet]);
  };

  const handleDeleteCabinet = (id) => {
    setCabinets((prev) => prev.filter((c) => c.id !== id));
  };

  // Callback from project manager when loading a project
  const handleLoadProject = (loadedProject) => {
    setCabinets(loadedProject.cabinets || []);
    setProjectMetadata({
      id: loadedProject.id,
      projectName: loadedProject.name,
      clientName: loadedProject.clientName,
      siteReference: loadedProject.siteReference,
      supervisorName: loadedProject.supervisorName
    });
  };

  // Callback from project manager to save metadata changes
  const handleSaveMetadata = (updatedMeta) => {
    setProjectMetadata((prev) => ({
      ...prev,
      projectName: updatedMeta.projectName,
      clientName: updatedMeta.clientName,
      siteReference: updatedMeta.siteReference,
      supervisorName: updatedMeta.supervisorName
    }));
  };

  // Callback from project manager when creating a new project
  const handleNewProject = () => {
    setCabinets([]);
    setProjectMetadata({
      id: "",
      projectName: "New Modular Plan",
      clientName: "",
      siteReference: "",
      supervisorName: ""
    });
  };

  // Callback from SettingsPanel when corporate branding profile updates
  const handleBrandingUpdate = (newBranding) => {
    setWhiteLabel(newBranding);
  };

  // Expand all cabinet items into a flat list of cut parts for the Nesting Engine
  const getFlatPartsList = () => {
    const flatList = [];
    cabinets.forEach((cab) => {
      let parts = [];
      if (cab.type === "base") {
        parts = calculateBaseCabinet(cab);
      } else if (cab.type === "wall") {
        parts = calculateWallCabinet(cab);
      } else if (cab.type === "drawer") {
        parts = calculateDrawerCabinet(cab);
      } else if (cab.type === "wardrobe") {
        parts = calculateWardrobe(cab);
      } else if (cab.type === "blind_corner") {
        parts = calculateBlindCornerBase(cab);
      } else if (cab.type === "l_corner") {
        parts = calculateLCornerBase(cab);
      } else if (cab.type === "custom") {
        parts = cab.customParts || [];
      }
      
      parts.forEach(p => {
        flatList.push({
          ...p,
          cabinetId: cab.id,
          cabinetName: cab.name
        });
      });
    });
    return flatList;
  };

  const allParts = getFlatPartsList();

  // Nesting Configurations lifted to App level for dynamic synchronization
  const [bladeKerf, setBladeKerf] = useState(3);
  const [trimMargin, setTrimMargin] = useState(10);
  const [nestingMode, setNestingMode] = useState("cnc");

  // Global High-Efficiency Nesting Calculation
  const nestingResult = nestPanels(allParts, { bladeKerf, trimMargin, mode: nestingMode });

  return (
    <div className="app-container">
      {/* 1. White-Labeled Brand Header */}
      <Header whiteLabel={whiteLabel} />

      {/* 2. Main Work Area Grid */}
      <main className="main-grid">
        {/* Left Column: Sidebar Inputs */}
        <section className="sidebar-column no-print">
          {/* Project Management Dashboard */}
          <ProjectManager
            currentCabinets={cabinets}
            currentProjectMetadata={projectMetadata}
            onLoadProject={handleLoadProject}
            onNewProject={handleNewProject}
            onSaveMetadata={handleSaveMetadata}
          />

          {/* Active Cabinet Calculator Form */}
          <CabinetForm onAddCabinet={handleAddCabinet} />

          {/* Copy Paste Excel Importer */}
          <QuickImport onAddBulkPanels={handleAddCabinet} />

          {/* Advanced Real-Time Branding Customizer */}
          <SettingsPanel
            whiteLabel={whiteLabel}
            onBrandingUpdate={handleBrandingUpdate}
          />
        </section>

        {/* Right Column: Output Tables & Nesting Plans */}
        <section className="content-column">
          {/* Core Cutting Parts Sheet Table & Pricing synchronizer */}
          <PartListTable
            cabinets={cabinets}
            onDeleteCabinet={handleDeleteCabinet}
            nestingResult={nestingResult}
          />

          {/* Real-time 2D Nesting Sheet Visualizer maps */}
          <NestVisualizer 
            parts={allParts} 
            nestingResult={nestingResult}
            bladeKerf={bladeKerf}
            setBladeKerf={setBladeKerf}
            trimMargin={trimMargin}
            setTrimMargin={setTrimMargin}
            nestingMode={nestingMode}
            setNestingMode={setNestingMode}
          />
        </section>
      </main>

      {/* 3. White-Labeled Disclaimer Footer */}
      <Footer whiteLabel={whiteLabel} />
    </div>
  );
}
