import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  CheckCircle2,
  Package,
  Plus,
  Loader2,
} from "lucide-react";

interface MaterialTemplate {
  id: string;
  name: string;
  code: string;
  category?: string;
  created_at: string;
}

interface Shop {
  id: string;
  name: string;
}

const UNIT_OPTIONS = ["pcs", "kg", "meter", "sqft", "cum", "litre", "set", "nos"];
const Required = () => <span className="text-red-500 ml-1">*</span>;

export default function SupplierMaterials() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"templates" | "submissions">("templates");
  
  // Material Templates State
  const [templates, setTemplates] = useState<MaterialTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Supplier Submissions State
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  // Form State
  const [selectedTemplate, setSelectedTemplate] = useState<MaterialTemplate | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    rate: "",
    unit: "",
    brandname: "",
    modelnumber: "",
    subcategory: "",
    technicalspecification: "",
  });

  // Load material templates on mount
  useEffect(() => {
    loadMaterialTemplates();
    loadSupplierSubmissions();
    loadShops();
  }, []);

  const loadMaterialTemplates = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/material-templates", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast({
        title: "Error",
        description: "Failed to load material templates",
        variant: "destructive",
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadSupplierSubmissions = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/supplier/my-submissions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error("Error loading submissions:", error);
      // This endpoint might not exist yet, so we'll handle the error gracefully
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const loadShops = async () => {
    try {
      const response = await fetch("/api/shops");
      const data = await response.json();
      setShops(data.shops || []);
    } catch (error) {
      console.error("Error loading shops:", error);
      toast({
        title: "Error",
        description: "Failed to load shops",
        variant: "destructive",
      });
    }
  };

  const handleSelectTemplate = (template: MaterialTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      rate: "",
      unit: "",
      brandname: "",
      modelnumber: "",
      subcategory: "",
      technicalspecification: "",
    });
    setSelectedShop("");
  };

  const handleSubmitMaterial = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTemplate || !selectedShop) {
      toast({
        title: "Error",
        description: "Please select a template and shop",
        variant: "destructive",
      });
      return;
    }

    if (!formData.rate || !formData.unit) {
      toast({
        title: "Error",
        description: "Rate and unit are required",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/material-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          shop_id: selectedShop,
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit material");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: "Material submitted for approval",
      });

      // Reset form
      setSelectedTemplate(null);
      setFormData({
        rate: "",
        unit: "",
        brandname: "",
        modelnumber: "",
        subcategory: "",
        technicalspecification: "",
      });
      setSelectedShop("");

      // Reload submissions
      loadSupplierSubmissions();
    } catch (error) {
      console.error("Error submitting material:", error);
      toast({
        title: "Error",
        description: "Failed to submit material",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Material Management</h1>
          <p className="text-gray-600">
            Select from available material templates and add your details
          </p>
        </div>

        <div className="grid gap-8">
          {/* Available Templates Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5" />
              <h2 className="text-2xl font-semibold">Available Material Templates</h2>
            </div>

            {loadingTemplates ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    No material templates available yet
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? "ring-2 ring-blue-500 bg-blue-50"
                        : "hover:shadow-lg"
                    }`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.code}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {template.category && (
                        <Badge variant="outline">{template.category}</Badge>
                      )}
                      {selectedTemplate?.id === template.id && (
                        <div className="mt-4 text-sm text-blue-600 font-semibold">
                          ✓ Selected
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Submission Form Section */}
          {selectedTemplate && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle>Submit Material Details</CardTitle>
                <CardDescription>
                  Completing submission for: <strong>{selectedTemplate.name}</strong> (
                  {selectedTemplate.code})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitMaterial} className="space-y-6">
                  {/* Shop Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>
                        Shop <Required />
                      </Label>
                      <Select value={selectedShop} onValueChange={setSelectedShop}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a shop" />
                        </SelectTrigger>
                        <SelectContent>
                          {shops.map((shop) => (
                            <SelectItem key={shop.id} value={shop.id}>
                              {shop.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>
                        Rate <Required />
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter rate"
                        value={formData.rate}
                        onChange={(e) =>
                          setFormData({ ...formData, rate: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Unit and Brand Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>
                        Unit <Required />
                      </Label>
                      <Select
                        value={formData.unit}
                        onValueChange={(value) =>
                          setFormData({ ...formData, unit: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Brand Name</Label>
                      <Input
                        placeholder="Enter brand name"
                        value={formData.brandname}
                        onChange={(e) =>
                          setFormData({ ...formData, brandname: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Model Number and Subcategory */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Model Number</Label>
                      <Input
                        placeholder="Enter model number"
                        value={formData.modelnumber}
                        onChange={(e) =>
                          setFormData({ ...formData, modelnumber: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label>Subcategory</Label>
                      <Input
                        placeholder="Enter subcategory"
                        value={formData.subcategory}
                        onChange={(e) =>
                          setFormData({ ...formData, subcategory: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Technical Specification */}
                  <div>
                    <Label>Technical Specification</Label>
                    <Textarea
                      placeholder="Enter technical specifications"
                      value={formData.technicalspecification}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          technicalspecification: e.target.value,
                        })
                      }
                      rows={4}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="gap-2"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Submit for Approval
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedTemplate(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* My Submissions Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5" />
              <h2 className="text-2xl font-semibold">My Submissions</h2>
            </div>

            {loadingSubmissions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : submissions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    No submissions yet
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Material Name</p>
                          <p className="font-semibold">{submission.template_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <div className="flex items-center gap-2 mt-1">
                            {submission.approved === true ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <Badge variant="outline" className="bg-green-50">
                                  Approved
                                </Badge>
                              </>
                            ) : submission.approved === false ? (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <Badge variant="outline" className="bg-red-50">
                                  Rejected
                                </Badge>
                              </>
                            ) : (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                                <Badge variant="outline" className="bg-yellow-50">
                                  Pending
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Rate</p>
                          <p className="font-semibold">{submission.rate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Unit</p>
                          <p className="font-semibold">{submission.unit}</p>
                        </div>
                      </div>
                      {submission.approval_reason && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-800">
                            <strong>Rejection Reason:</strong> {submission.approval_reason}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
