/** @typedef {{ id: string; category: string; displayName: string; gltfAssetPath: string; snapOrigin: { x: number; y: number }; metadata: FurnitureMetadata }} FurnitureFamily */
/** @typedef {{ roomSuitability: string[]; placementType: 'freestanding' | 'wall_mounted' | 'corner'; dimensions: { width: number; height?: number; depth?: number }; materialZones: MaterialZone[]; priceBand: 'budget' | 'mid-range' | 'premium'; hardwareIncluded?: boolean; edgeBanding?: string[] }} FurnitureMetadata */
/** @typedef {{ name: string; gltfPathFragment: string; defaultMaterialId?: string }} MaterialZone */
/** @typedef {{ id: string; name: string; categoryId: string; vendorId?: string; pricePerSquareFoot?: number; swatchUrl?: string; gltfMaterialId?: string; tags: string[]; createdAt?: string }} MaterialEntry */
/** @typedef {{ id: string; brandName: string; materials: string[]; furnitureFamilies?: string[] }} BrandLibrary */
