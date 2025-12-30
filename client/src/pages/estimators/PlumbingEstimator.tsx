import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useData, Material } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Download, CheckCircle2, Star } from "lucide-react";
import { StepIndicator } from "@/components/StepIndicator";
import html2pdf from "html2pdf.js";

interface MaterialWithQuantity {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  shopId: string;
  shopName: string;
}

interface SelectedMaterialConfig {
  materialId: string;
  selectedShopId: string;
}

// Plumbing configuration with material requirements
const PLUMBING_CONFIG = {
  hotwater: {
    label: "Hot Water System",
    materialRequirements: [
      { code: "PLUMB-001", label: "PVC Pipe 20mm" },
      { code: "PLUMB-002", label: "Sink Basin" },
      { code: "PLUMB-005", label: "Water Tap" },
    ],
  },
  coldwater: {
    label: "Cold Water System",
    materialRequirements: [
      { code: "PLUMB-001", label: "PVC Pipe 20mm" },
      { code: "PLUMB-003", label: "Sanitary Fittings" },
      { code: "PLUMB-005", label: "Water Tap" },
    ],
  },
  drainage: {
    label: "Drainage System",
    materialRequirements: [
      { code: "PLUMB-004", label: "Drain Pipe" },
      { code: "PLUMB-003", label: "Sanitary Fittings" },
      { code: "PLUMB-008", label: "Plumbing Elbow" },
    ],
  },
  complete: {
    label: "Complete Plumbing Setup",
    materialRequirements: [
      { code: "PLUMB-001", label: "PVC Pipe 20mm" },
      { code: "PLUMB-002", label: "Sink Basin" },
      { code: "PLUMB-003", label: "Sanitary Fittings" },
      { code: "PLUMB-004", label: "Drain Pipe" },
      { code: "PLUMB-005", label: "Water Tap" },
      { code: "PLUMB-006", label: "Toilet Seat" },
      { code: "PLUMB-007", label: "Water Tank" },
      { code: "PLUMB-008", label: "Plumbing Elbow" },
    ],
  },
};

export default function PlumbingEstimator() {
  const { shops: storeShops, materials: storeMaterials } = useData();
  const [step, setStep] = useState(1);
  const [systemType, setSystemType] = useState<"hotwater" | "coldwater" | "drainage" | "complete" | null>(null);
  const [pipeLengthMeters, setPipeLengthMeters] = useState<number | null>(50);
  const [fixtureCount, setFixtureCount] = useState<number | null>(3);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterialConfig[]>([]);
  const [customQuantities, setCustomQuantities] = useState<Map<string, number>>(new Map());

  const steps = [
    { number: 1, title: "System Type", description: "Choose plumbing system" },
    { number: 2, title: "Specifications", description: "Enter dimensions" },
    { number: 3, title: "Materials", description: "Select materials & shops" },
    { number: 4, title: "Review", description: "Check required/missing" },
    { number: 5, title: "BOQ", description: "Review & export" },
  ];

  // Get config for selected system
  const getCurrentConfig = () => {
    if (!systemType) return null;
    return PLUMBING_CONFIG[systemType];
  };

  // Get required material codes for the system
  const getRequiredMaterialCodes = (): string[] => {
    const config = getCurrentConfig();
    if (!config) return [];
    return config.materialRequirements.map((r) => r.code);
  };

  // Get available materials for the system (ALL plumbing materials, not just required)
  const getAvailableMaterials = () => {
    // Show all plumbing materials (not just required ones for the system)
    const allPlumbingMaterials = storeMaterials.filter((m) => m.category === "Plumbing");

    // Deduplicate by code - return only ONE instance per material code (with ALL shops available)
    const uniqueMaterialsMap = new Map<string, Material>();
    
    for (const material of allPlumbingMaterials) {
      const key = material.code;
      // Keep the first occurrence of each material code
      if (!uniqueMaterialsMap.has(key)) {
        uniqueMaterialsMap.set(key, material);
      }
    }
    
    return Array.from(uniqueMaterialsMap.values());
  };

  // Get all shops that have a specific material code
  const getShopsForMaterial = (materialCode: string) => {
    return storeMaterials.filter((m) => m.code === materialCode);
  };

  // Get the unit type for a material code
  const getUnitForMaterial = (materialCode: string): string => {
    const material = storeMaterials.find((m) => m.code === materialCode);
    return material?.unit || "units";
  };

  // Find best shop for a material
  const getBestShop = (materialCode: string): { shopId: string; shopName: string; rate: number } | null => {
    const materialsByCode = storeMaterials.filter((m) => m.code === materialCode);
    if (materialsByCode.length === 0) return null;

    let bestOption = materialsByCode[0];
    for (const mat of materialsByCode) {
      if (mat.rate < bestOption.rate) {
        bestOption = mat;
      }
    }

    const shop = storeShops.find((s) => s.id === bestOption.shopId);
    return {
      shopId: bestOption.shopId,
      shopName: shop?.name || "Unknown",
      rate: bestOption.rate,
    };
  };

  // Real-world plumbing calculations
  const calculateQuantity = (materialCode: string, materialUnit: string): number => {
    const pipeLength = pipeLengthMeters || 50;
    const fixtures = fixtureCount || 3;

    let quantity = 0;

    switch (materialCode) {
      case "PLUMB-001": // PVC Pipe 20mm - based on total pipe run
        quantity = pipeLength * 1.15; // 15% wastage
        break;
      case "PLUMB-002": // Sink Basin - 1 per 2 fixtures
        quantity = Math.ceil(fixtures / 2);
        break;
      case "PLUMB-003": // Sanitary Fittings - 4-5 per fixture
        quantity = fixtures * 4;
        break;
      case "PLUMB-004": // Drain Pipe - similar to supply pipe
        quantity = pipeLength * 1.15;
        break;
      case "PLUMB-005": // Water Tap - 1 per fixture
        quantity = fixtures;
        break;
      case "PLUMB-006": // Toilet Seat - 1 per 3 fixtures
        quantity = Math.ceil(fixtures / 3);
        break;
      case "PLUMB-007": // Water Tank - 1000L per 3-4 fixtures
        quantity = 1; // typically one tank
        break;
      case "PLUMB-008": // Plumbing Elbow - 2-3 per fixture connection
        quantity = fixtures * 2;
        break;
      default:
        quantity = 1;
    }

    return Math.max(1, Math.ceil(quantity));
  };

  // Get materials with quantities and shop info
  const getMaterialsWithDetails = (): MaterialWithQuantity[] => {
    const materials = storeMaterials;

    return selectedMaterials
      .map((selection) => {
        const material = materials.find((m) => m.id === selection.materialId);
        if (!material) return null;

        const shop = storeShops.find((s) => s.id === selection.selectedShopId);
        const quantity = calculateQuantity(material.code, material.unit);

        return {
          id: material.id,
          name: material.name,
          quantity,
          unit: material.unit,
          rate: material.rate,
          shopId: selection.selectedShopId,
          shopName: shop?.name || "Unknown",
        };
      })
      .filter((m): m is MaterialWithQuantity => m !== null);
  };

  // Get required materials and their selection status
  const getRequiredMaterialsStatus = () => {
    const requiredCodes = getRequiredMaterialCodes();
    const selectedCodes = new Set(
      selectedMaterials
        .map((sel) => storeMaterials.find((m) => m.id === sel.materialId)?.code)
        .filter(Boolean)
    );

    const selected = requiredCodes.filter((code) => selectedCodes.has(code));
    const missing = requiredCodes.filter((code) => !selectedCodes.has(code));

    return { selected, missing };
  };

  // Get extra materials (selected but not required)
  const getExtraMaterials = (): MaterialWithQuantity[] => {
    const requiredCodes = getRequiredMaterialCodes();
    return getMaterialsWithDetails().filter(
      (mat) => !requiredCodes.includes(storeMaterials.find((m) => m.id === mat.id)?.code || "")
    );
  };

  const calculateTotalCost = (): number => {
    return getMaterialsWithDetails().reduce((sum, m) => sum + m.quantity * m.rate, 0);
  };

  const handleToggleMaterial = (materialId: string) => {
    const existingSelection = selectedMaterials.find((m) => m.materialId === materialId);

    if (existingSelection) {
      setSelectedMaterials((prev) => prev.filter((m) => m.materialId !== materialId));
    } else {
      const bestShop = getBestShop(storeMaterials.find((m) => m.id === materialId)?.code || "");
      if (bestShop) {
        setSelectedMaterials((prev) => [
          ...prev,
          { materialId, selectedShopId: bestShop.shopId },
        ]);
      }
    }
  };

  const handleChangeShop = (materialId: string, newShopId: string) => {
    setSelectedMaterials((prev) =>
      prev.map((m) =>
        m.materialId === materialId ? { ...m, selectedShopId: newShopId } : m
      )
    );
  };

  const handleExportPDF = async () => {
    const element = document.getElementById("boq-pdf");

    if (!element) {
      alert("BOQ content not found");
      return;
    }

    const html2pdf = (await import("html2pdf.js")).default;

    html2pdf()
      .set({
        margin: 10,
        filename: "Plumbing_BOQ.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Plumbing Estimator</h2>
          <p className="text-muted-foreground mt-1">Complete plumbing system estimation with material selection</p>
        </div>

        <StepIndicator steps={steps} currentStep={step} onStepClick={(s) => s <= step && setStep(s)} />

        <Card className="border-border/50">
          <CardContent className="pt-8 min-h-96">
            <AnimatePresence mode="wait">
              {/* STEP 1: System Type Selection */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div>
                    <Label className="text-lg font-semibold mb-4 block">Select Plumbing System Type</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(PLUMBING_CONFIG).map(([key, config]) => (
                        <Card
                          key={key}
                          className={cn(
                            "cursor-pointer border-2 transition-all hover:shadow-md",
                            systemType === key ? "border-primary bg-primary/5" : "border-border/50"
                          )}
                          onClick={() => setSystemType(key as any)}
                        >
                          <CardContent className="pt-6">
                            <h3 className="font-semibold text-base">{config.label}</h3>
                            <p className="text-xs text-muted-foreground mt-2">
                              {config.materialRequirements.length} materials included
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-6">
                    <Button disabled={!systemType} onClick={() => setStep(2)}>
                      Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Specifications */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Total Pipe Length (meters)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 50"
                        value={pipeLengthMeters || ""}
                        onChange={(e) => setPipeLengthMeters(e.target.value ? parseFloat(e.target.value) : null)}
                        className="text-base"
                      />
                      <p className="text-xs text-muted-foreground">Including horizontal and vertical runs, with 15% wastage</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Number of Fixtures</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 3"
                        value={fixtureCount || ""}
                        onChange={(e) => setFixtureCount(e.target.value ? parseFloat(e.target.value) : null)}
                        className="text-base"
                      />
                      <p className="text-xs text-muted-foreground">Sinks, toilets, showers, etc.</p>
                    </div>
                  </div>
                  <div className="flex justify-between gap-2 pt-6">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button disabled={!pipeLengthMeters || !fixtureCount} onClick={() => setStep(3)}>
                      Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Material Selection */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Label className="text-lg font-semibold mb-4 block">Select Materials & Suppliers</Label>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {getAvailableMaterials().map((mat) => {
                      const isSelected = selectedMaterials.find((m) => storeMaterials.find((x) => x.id === m.materialId)?.code === mat.code);
                      const availableShops = getShopsForMaterial(mat.code);

                      return (
                        <Card key={mat.code} className={cn("border", isSelected ? "border-primary bg-primary/5" : "border-border/50")}>
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id={mat.code}
                                checked={!!isSelected}
                                onCheckedChange={() => {
                                  // Find and toggle based on material code
                                  const selectedWithCode = selectedMaterials.find((m) => storeMaterials.find((x) => x.id === m.materialId)?.code === mat.code);
                                  if (selectedWithCode) {
                                    setSelectedMaterials((prev) => prev.filter((m) => m !== selectedWithCode));
                                  } else {
                                    // Auto-select first material with this code from best shop
                                    const bestShop = availableShops.reduce((best, current) => 
                                      current.rate < best.rate ? current : best
                                    );
                                    setSelectedMaterials((prev) => [
                                      ...prev,
                                      { materialId: bestShop.id, selectedShopId: bestShop.shopId },
                                    ]);
                                  }
                                }}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <label htmlFor={mat.code} className="font-semibold cursor-pointer block">
                                  {mat.name}
                                </label>
                                <p className="text-xs text-muted-foreground mt-1">{mat.code}</p>

                                {isSelected && (
                                  <div className="mt-3 space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground">Select Supplier:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {availableShops.map((option) => {
                                        const shop = storeShops.find((s) => s.id === option.shopId);
                                        const isThisShopSelected = isSelected?.selectedShopId === option.shopId;
                                        return (
                                          <Button
                                            key={option.id}
                                            variant={isThisShopSelected ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => {
                                              const selectedWithCode = selectedMaterials.find((m) => storeMaterials.find((x) => x.id === m.materialId)?.code === mat.code);
                                              if (selectedWithCode) {
                                                handleChangeShop(selectedWithCode.materialId, option.shopId);
                                              }
                                            }}
                                            className="justify-between text-xs"
                                          >
                                            <span>{shop?.name}</span>
                                            <span className="font-bold">₹{option.rate}</span>
                                          </Button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  <div className="flex justify-between gap-2 pt-6">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button disabled={selectedMaterials.length === 0} onClick={() => setStep(4)}>
                      Review Required <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Review Required/Missing Materials */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Review Material Status</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Selected Required Materials */}
                    {getRequiredMaterialsStatus().selected.length > 0 && (
                      <Card className="border-green-200 bg-green-50/50">
                        <CardHeader>
                          <CardTitle className="text-base text-green-700 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" /> Selected Required Materials ({getRequiredMaterialsStatus().selected.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {getRequiredMaterialsStatus().selected.map((code) => {
                            const label = getCurrentConfig()?.materialRequirements.find((r) => r.code === code)?.label || code;
                            const baseQuantity = calculateQuantity(code, "");
                            const customQty = customQuantities.get(code);
                            const finalQuantity = customQty !== undefined ? customQty : baseQuantity;
                            const unit = getUnitForMaterial(code);
                            return (
                              <div key={code} className="flex items-center justify-between gap-2 p-3 bg-white rounded border border-green-200 text-sm">
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="text-green-600 font-bold">✓</span>
                                  <div>
                                    <p className="font-medium">{label}</p>
                                    <p className="text-xs text-muted-foreground">{code}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 w-7 p-0"
                                    onClick={() => {
                                      const newQty = Math.max(1, finalQuantity - 1);
                                      setCustomQuantities(new Map(customQuantities.set(code, newQty)));
                                    }}
                                  >
                                    −
                                  </Button>
                                  <div className="text-center min-w-16">
                                    <p className="font-bold text-primary">{finalQuantity}</p>
                                    <p className="text-xs text-muted-foreground">{unit}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 w-7 p-0"
                                    onClick={() => {
                                      const newQty = finalQuantity + 1;
                                      setCustomQuantities(new Map(customQuantities.set(code, newQty)));
                                    }}
                                  >
                                    +
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    )}

                    {/* Missing Required Materials */}
                    {getRequiredMaterialsStatus().missing.length > 0 && (
                      <Card className="border-red-200 bg-red-50/50">
                        <CardHeader>
                          <CardTitle className="text-base text-red-700 flex items-center gap-2">
                            <span className="text-lg">⚠️</span> Missing Required Materials ({getRequiredMaterialsStatus().missing.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {getRequiredMaterialsStatus().missing.map((code) => {
                            const label = getCurrentConfig()?.materialRequirements.find((r) => r.code === code)?.label || code;
                            const material = getAvailableMaterials().find((m) => m.code === code);
                            const quantity = calculateQuantity(code, "");
                            const unit = getUnitForMaterial(code);
                            return (
                              <div key={code} className="p-3 bg-white rounded border border-red-200 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 font-medium text-red-700">
                                    <span>✗</span>
                                    {label}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-red-600">{quantity}</p>
                                    <p className="text-xs text-muted-foreground">{unit}</p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs border-red-300 hover:bg-red-100 w-full"
                                  onClick={() => {
                                    if (material) {
                                      const bestShop = getShopsForMaterial(code).reduce((best, current) => 
                                        current.rate < best.rate ? current : best
                                      );
                                      setSelectedMaterials((prev) => [
                                        ...prev,
                                        { materialId: bestShop.id, selectedShopId: bestShop.shopId },
                                      ]);
                                    }
                                  }}
                                >
                                  + Add this material
                                </Button>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    )}

                    {/* Extra Materials */}
                    {getExtraMaterials().length > 0 && (
                      <Card className="border-blue-200 bg-blue-50/50">
                        <CardHeader>
                          <CardTitle className="text-base text-blue-700 flex items-center gap-2">
                            <Star className="h-5 w-5" /> Extra Materials ({getExtraMaterials().length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {getExtraMaterials().map((mat) => (
                            <div key={mat.id} className="flex items-center justify-between gap-2 text-sm p-2 bg-white rounded border border-blue-200">
                              <div>
                                <p className="font-medium">{mat.name}</p>
                                <p className="text-xs text-muted-foreground">{storeMaterials.find((m) => m.id === mat.id)?.code}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-blue-700">{mat.quantity}</p>
                                <p className="text-xs text-muted-foreground">{mat.unit}</p>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="flex justify-between gap-2 pt-6">
                    <Button variant="outline" onClick={() => setStep(3)}>
                      <ChevronLeft className="mr-2 h-4 w-4" /> Back to Materials
                    </Button>
                    <Button 
                      onClick={() => setStep(5)}
                      disabled={getRequiredMaterialsStatus().missing.length > 0}
                    >
                      Proceed to BOQ <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: BOQ Review - Real-world Professional Format */}
              {step === 5 && (
  <motion.div
    key="step5"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="space-y-6"
  >
    <div id="boq-pdf" className="space-y-6 bg-white">

      {/* BOQ Header */}
      <div className="text-center space-y-1 pb-6 border-b-2">
        <h1 className="text-2xl font-bold">BILL OF QUANTITIES (BOQ)</h1>
        <p className="text-sm text-muted-foreground">
          Plumbing Installation System
        </p>
        <p className="text-xs text-muted-foreground">
          Date: {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* ================= CONTENT START ================= */}
      <div className="space-y-6">

        {/* Project Specifications */}
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase">
              Project Specifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <p className="text-muted-foreground font-semibold">
                  System Type
                </p>
                <p className="font-bold text-sm">
                  {getCurrentConfig()?.label}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-semibold">
                  Total Pipe Length
                </p>
                <p className="font-bold text-sm">
                  {pipeLengthMeters} meters
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground font-semibold">
                  No. of Fixtures
                </p>
                <p className="font-bold text-sm">
                  {fixtureCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Materials Table */}
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase">
              Materials & Specifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b-2">
                    <th className="p-2 text-left font-bold">S.No</th>
                    <th className="p-2 text-left font-bold">
                      Material Description
                    </th>
                    <th className="p-2 text-left font-bold">Code</th>
                    <th className="p-2 text-center font-bold">Qty</th>
                    <th className="p-2 text-center font-bold">Unit</th>
                    <th className="p-2 text-right font-bold">Rate (₹)</th>
                    <th className="p-2 text-right font-bold">
                      Amount (₹)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getMaterialsWithDetails().map((mat, idx) => (
                    <tr
                      key={mat.id}
                      className="border-b hover:bg-slate-50"
                    >
                      <td className="p-2 text-center font-semibold">
                        {idx + 1}
                      </td>
                      <td className="p-2">
                        <p className="font-semibold">{mat.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Supplier: {mat.shopName}
                        </p>
                      </td>
                      <td className="p-2 font-mono text-xs text-muted-foreground">
                        {
                          storeMaterials.find(
                            (x) => x.id === mat.id
                          )?.code
                        }
                      </td>
                      <td className="p-2 text-center font-bold">
                        {mat.quantity}
                      </td>
                      <td className="p-2 text-center text-muted-foreground">
                        {mat.unit}
                      </td>
                      <td className="p-2 text-right">
                        ₹{mat.rate.toFixed(2)}
                      </td>
                      <td className="p-2 text-right font-semibold">
                        ₹{(mat.quantity * mat.rate).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Inline Summary (PDF-safe) */}
            <div className="mt-6 space-y-2 border-t-2 pt-4 ml-auto w-80">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="text-right font-semibold">
                  Subtotal:
                </div>
                <div className="text-right">
                  ₹{calculateTotalCost().toFixed(2)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="text-right text-muted-foreground">
                  GST (18%):
                </div>
                <div className="text-right text-muted-foreground">
                  ₹{(calculateTotalCost() * 0.18).toFixed(2)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 font-bold text-sm bg-primary/10 p-2 rounded border">
                <div className="text-right">TOTAL AMOUNT:</div>
                <div className="text-right">
                  ₹{(calculateTotalCost() * 1.18).toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase">
              Terms & Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-muted-foreground">
            <p>• This BOQ is valid for 30 days</p>
            <p>• Prices include delivery within city limits</p>
            <p>• Payment: 50% advance, 50% on delivery</p>
            <p>• GST as applicable</p>
          </CardContent>
        </Card>

        {/* COST SUMMARY – BOTTOM */}
        <Card className="border bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="p-6 space-y-6 max-w-md ml-auto">
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Estimated Total Cost
              </p>
              <p className="text-4xl font-bold text-primary">
                ₹{(calculateTotalCost() * 1.18).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                (Incl. 18% GST)
              </p>
            </div>

            <div className="space-y-3 text-xs bg-white p-3 rounded border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Subtotal:
                </span>
                <span className="font-semibold">
                  ₹{calculateTotalCost().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <span className="text-muted-foreground">
                  GST (18%):
                </span>
                <span className="font-semibold">
                  ₹{(calculateTotalCost() * 0.18).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>
                  ₹{(calculateTotalCost() * 1.18).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4">
              <Button onClick={handleExportPDF} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep(1);
                  setSystemType(null);
                  setPipeLengthMeters(50);
                  setFixtureCount(3);
                  setSelectedMaterials([]);
                }}
              >
                New Estimate
              </Button>
            </div>
          </div>
        </Card>

      </div>
      {/* ================= CONTENT END ================= */}
    </div>

    {/* Back Button */}
    <div className="flex justify-start gap-2 pt-6">
      <Button variant="outline" onClick={() => setStep(4)}>
        <ChevronLeft className="mr-2 h-4 w-4" /> Back
      </Button>
    </div>
  </motion.div>
)}

            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
