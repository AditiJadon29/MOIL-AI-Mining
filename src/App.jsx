import { useEffect, useState } from "react";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Layers,
  AlertCircle,
  Bell,
  Brain,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  CloudRain,
  Cpu,
  Gauge,
  Layers3,
  Map,
  MapPin,
  Menu,
  Mountain,
  Package,
  Settings,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Truck,
  X,
  Zap,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "./App.css";


const productionData = [
  { day: "01", target: 9800, actual: 9600, forecast: null },
  { day: "05", target: 10000, actual: 10100, forecast: null },
  { day: "09", target: 10000, actual: 9400, forecast: null },
  { day: "13", target: 10200, actual: 9700, forecast: null },
  { day: "17", target: 10000, actual: 9100, forecast: null },
  { day: "21", target: 10300, actual: null, forecast: 9000 },
  { day: "25", target: 10400, actual: null, forecast: 8750 },
  { day: "29", target: 10500, actual: null, forecast: 8900 },
];


const risks = [
  {
    name: "Equipment downtime",
    value: 48,
    icon: Cpu,
    category: "Equipment",
    status: "Elevated",
    trend: "+4 pts",
    impact: "Reduced fleet availability during active production hours.",
    mitigation: "Prioritize maintenance and redeploy standby equipment.",
  },
  {
    name: "Weather conditions",
    value: 27,
    icon: CloudRain,
    category: "Environment",
    status: "Monitor",
    trend: "Stable",
    impact: "Rainfall impact may constrain haulage and exposed work areas.",
    mitigation: "Review the shift plan against the rainfall assumption.",
  },
  {
    name: "Blasting delays",
    value: 17,
    icon: Zap,
    category: "Production",
    status: "Watch",
    trend: "−2 pts",
    impact: "Delayed blast clearance may reduce available face time.",
    mitigation: "Re-sequence scheduled blasts with the dispatch team.",
  },
  {
    name: "Other constraints",
    value: 8,
    icon: Settings,
    category: "Workforce",
    status: "Stable",
    trend: "−1 pt",
    impact: "Minor residual constraints across shift readiness.",
    mitigation: "Monitor crew allocation at the next shift handover.",
  },
];

const riskTrendData = [
  { period: "W1", equipment: 39, environment: 23, production: 19, workforce: 11 },
  { period: "W2", equipment: 41, environment: 24, production: 18, workforce: 10 },
  { period: "W3", equipment: 40, environment: 25, production: 20, workforce: 10 },
  { period: "W4", equipment: 42, environment: 24, production: 19, workforce: 9 },
  { period: "W5", equipment: 43, environment: 26, production: 18, workforce: 9 },
  { period: "W6", equipment: 44, environment: 25, production: 19, workforce: 8 },
  { period: "W7", equipment: 43, environment: 26, production: 18, workforce: 9 },
  { period: "W8", equipment: 45, environment: 25, production: 18, workforce: 8 },
  { period: "W9", equipment: 46, environment: 26, production: 17, workforce: 8 },
  { period: "W10", equipment: 45, environment: 27, production: 18, workforce: 8 },
  { period: "W11", equipment: 47, environment: 27, production: 18, workforce: 8 },
  { period: "W12", equipment: 48, environment: 27, production: 17, workforce: 8 },
];

const DEFAULT_PREDICTION_INPUTS = {
  equipment_downtime: 60,
  rainfall: 30,
  equipment_availability: 70,
  geological_confidence: 85,
  workforce_availability: 80,
  target_production: 10000,
};

const PREDICTION_FIELDS = [
  { name: "equipment_downtime", label: "Equipment downtime", unit: "%", min: 0, max: 100, step: 1 },
  { name: "rainfall", label: "Rainfall impact", unit: "%", min: 0, max: 100, step: 1 },
  { name: "equipment_availability", label: "Equipment availability", unit: "%", min: 0, max: 100, step: 1 },
  { name: "geological_confidence", label: "Geological confidence", unit: "%", min: 0, max: 100, step: 1 },
  { name: "workforce_availability", label: "Workforce availability", unit: "%", min: 0, max: 100, step: 1 },
  { name: "target_production", label: "Target production", unit: "tonnes", min: 1, max: 1000000, step: 100 },
];

const reserveZones = [
  {
    zoneId: "SYN-01",
    name: "East Ridge",
    score: 91,
    confidence: 86,
    potential: "High",
    estimatedPotential: "2.4 Mt · illustrative",
    environment: "Rainfall impact 18% · synthetic",
    priority: "P1 · Field validation",
    location: [21.85, 80.20],
  },
  {
    zoneId: "SYN-02",
    name: "Central Seam",
    score: 68,
    confidence: 67,
    potential: "Moderate",
    estimatedPotential: "1.1 Mt · illustrative",
    environment: "Rainfall impact 27% · synthetic",
    priority: "P2 · Detailed survey",
    location: [22.20, 80.75],
  },
  {
    zoneId: "SYN-03",
    name: "South Extension",
    score: 36,
    confidence: 41,
    potential: "Low",
    estimatedPotential: "0.5 Mt · illustrative",
    environment: "Rainfall impact 34% · synthetic",
    priority: "P3 · Reconnaissance",
    location: [21.45, 79.65],
  },
];

const environmentalIndicators = [
  { name: "Rainfall impact", value: "18%", unit: "model input assumption", trend: "Synthetic scenario value", status: "Normal", freshness: "8 min", source: "Synthetic weather series", icon: CloudRain },
  { name: "Vegetation index", value: "0.62", unit: "NDVI", trend: "+0.03 from prior period", status: "Stable", freshness: "Daily sample", source: "Synthetic indicator", icon: TrendingUp },
  { name: "Surface moisture", value: "26%", unit: "relative index", trend: "4 pts below reference", status: "Monitor", freshness: "8 min", source: "Synthetic estimate", icon: CloudRain },
  { name: "Temperature", value: "31 °C", unit: "surface estimate", trend: "2 °C above cycle reference", status: "Warm", freshness: "8 min", source: "Synthetic weather series", icon: Gauge },
  { name: "Land disturbance", value: "3.8 ha", unit: "30-day estimate", trend: "Within review threshold", status: "Review", freshness: "30-day window", source: "Synthetic activity layer", icon: Mountain },
  { name: "Cloud coverage", value: "12%", unit: "scene estimate", trend: "Low obstruction", status: "Clear", freshness: "Daily sample", source: "Synthetic indicator", icon: Layers3 },
];

const dataSources = [
  { name: "Geological Data", status: "Prototype", lastUpdate: "Prototype dataset", freshness: "Static demo", coverage: "3 illustrative zones", observations: "3 synthetic zone records", connection: "Local synthetic records" },
  { name: "Production Data", status: "Connected", lastUpdate: "On model request", freshness: "Current response", coverage: "Prediction endpoint", observations: "Model request / response", connection: "FastAPI /predict" },
  { name: "Equipment Data", status: "Prototype", lastUpdate: "Prototype dataset", freshness: "Static demo", coverage: "Fleet input profile", observations: "Synthetic operating inputs", connection: "Local prediction form" },
  { name: "Weather Data", status: "Prototype", lastUpdate: "Sample profile", freshness: "8 min · illustrative", coverage: "Rainfall impact", observations: "Synthetic indicator", connection: "Local synthetic series" },
  { name: "Satellite / Environmental Data", status: "Pending", lastUpdate: "Not connected", freshness: "Unavailable", coverage: "No live coverage", observations: "No satellite observations", connection: "No live feed configured" },
];


const recommendations = [
  {
    icon: Truck,
    title: "Redeploy available equipment",
    description:
      "Shift standby equipment toward the high-production mining zone.",
    priority: "High priority",
  },
  {
    icon: CalendarDays,
    title: "Adjust mine schedule",
    description:
      "Optimize upcoming mining activities around predicted weather conditions.",
    priority: "Medium priority",
  },
  {
    icon: Zap,
    title: "Review blasting schedule",
    description:
      "Reschedule delayed blasting operations to protect production continuity.",
    priority: "Medium priority",
  },
];

function buildPredictionPayload(overrides = {}) {
  return {
    ...DEFAULT_PREDICTION_INPUTS,
    ...Object.fromEntries(
      PREDICTION_FIELDS.map((field) => [field.name, Number(overrides[field.name] ?? DEFAULT_PREDICTION_INPUTS[field.name])]),
    ),
  };
}

async function requestAiAnalysis(inputs = DEFAULT_PREDICTION_INPUTS) {
  const payload = buildPredictionPayload(inputs);
  const response = await fetch("http://127.0.0.1:8000/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.json();
}

function getCurrentSyncTime() {
  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return `${time} IST`;
}


function App() {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  const [activePage, setActivePage] = useState("overview");
  const [activeDetail, setActiveDetail] = useState(null);

  /* Global filters that intentionally scope the whole app */
  const [selectedMine, setSelectedMine] = useState("Balaghat");
  const [selectedDateRange, setSelectedDateRange] = useState("30D");

  /* Page-specific state: each module keeps its own selections independent of every other module */
  const [productionMine, setProductionMine] = useState("Balaghat");
  const [productionZone, setProductionZone] = useState("All Zones");
  const [productionDateRange, setProductionDateRange] = useState("30D");
  const [productionEquipment, setProductionEquipment] = useState("All Equipment");
  const [productionRange, setProductionRange] = useState("30D");

  const [riskEquipmentAvailability, setRiskEquipmentAvailability] = useState("84%");
  const [riskRainfall, setRiskRainfall] = useState("50%");
  const [riskDowntime, setRiskDowntime] = useState("50%");
  const [riskWorkforce, setRiskWorkforce] = useState("70%");
  const [riskBlastingDelay, setRiskBlastingDelay] = useState("15%");
  const [riskDateRange, setRiskDateRange] = useState("30D");
  const [riskRange, setRiskRange] = useState("30D");
  const [riskFilter, setRiskFilter] = useState("All Risks");
  const [selectedRiskName, setSelectedRiskName] = useState(null);

  const [selectedZone, setSelectedZone] = useState("East Ridge");
  const [reserveMapLayerVisibility, setReserveMapLayerVisibility] = useState({ prospectivity: true, environment: false, operations: false });
  const [selectedProspectivityLayer, setSelectedProspectivityLayer] = useState("Prospectivity");
  const [zoneFilter, setZoneFilter] = useState("All Zones");
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [mapLayers, setMapLayers] = useState({ prospectivity: true, environment: false, operations: false });

  const [selectedIndicator, setSelectedIndicator] = useState("Rainfall impact");
  const [satelliteDateRange, setSatelliteDateRange] = useState("30D");
  const [selectedSensor, setSelectedSensor] = useState("Synthetic weather series");

  const [geologicalZone, setGeologicalZone] = useState("East Ridge");
  const [validationFilter, setValidationFilter] = useState("All");
  const [selectedSample, setSelectedSample] = useState("Sample A-14");

  const [equipmentMine, setEquipmentMine] = useState("Balaghat");
  const [equipmentStatus, setEquipmentStatus] = useState("All");
  const [selectedEquipment, setSelectedEquipment] = useState("Fleet 4");

  const [selectedInsight, setSelectedInsight] = useState("production");
  const [insightFilter, setInsightFilter] = useState("All");
  const [insightCategory, setInsightCategory] = useState("All");
  const [insightPriority, setInsightPriority] = useState("All");
  const [insightStatus, setInsightStatus] = useState("All");
  const [expandedInsights, setExpandedInsights] = useState({});

  const [reportType, setReportType] = useState("Production Summary");
  const [reportStatus, setReportStatus] = useState("All");
  const [selectedReport, setSelectedReport] = useState("Production Summary");

  const [chartSeriesVisibility, setChartSeriesVisibility] = useState({ target: true, actual: true, forecast: true });
  const [selectedDate, setSelectedDate] = useState("2026-09-30");
  const [lastUpdated, setLastUpdated] = useState(getCurrentSyncTime);
  const [predictionInputs, setPredictionInputs] = useState(() => ({ ...DEFAULT_PREDICTION_INPUTS }));
  const [predictionValidationError, setPredictionValidationError] = useState(null);
  const [settingsApplied, setSettingsApplied] = useState(false);
  const [settings, setSettings] = useState({
    systemName: "MOIL Mining Intelligence",
    environment: "Prototype",
    timeZone: "Asia/Kolkata",
    defaultDashboard: "overview",
    forecastHorizon: "30D",
    confidenceThreshold: "82",
    refreshInterval: "15",
    dashboardRefresh: false,
    riskAlerts: true,
    productionAlerts: true,
    actionSummaries: true,
    dataQualityAlerts: true,
    emailNotifications: false,
    inAppNotifications: true,
    density: "compact",
    units: "metric",
    dateFormat: "DD MMM YYYY",
    prototypeMode: true,
  });

  const updateSetting = (key, value) => {
    setSettings((currentSettings) => ({ ...currentSettings, [key]: value }));
    setSettingsApplied(false);
  };

  const applySettings = (event) => {
    event.preventDefault();
    setProductionRange(settings.forecastHorizon);
    setSettingsApplied(true);
    setActivePage(settings.defaultDashboard);
  };

  const updatePredictionInput = (name, value) => {
    setPredictionInputs((currentInputs) => ({ ...currentInputs, [name]: value }));
    setPredictionValidationError(null);
  };

  const showDetails = (title, description, metrics = []) => {
    setActiveDetail({ type: "details", title, description, metrics });
  };

  const showZoneDetails = (zone) => {
    setSelectedZoneId(zone.zoneId);
    showDetails(`${zone.zoneId} · ${zone.name}`, "Synthetic prospectivity record. Coordinates and estimates are illustrative, not verified MOIL locations.", [
      { label: "Prospectivity score", value: `${zone.score}%` },
      { label: "Geological confidence", value: `${zone.confidence}%` },
      { label: "Zone status", value: `${zone.potential.toUpperCase()} PROSPECTIVITY` },
      { label: "Environmental condition", value: zone.environment },
      { label: "Estimated potential", value: zone.estimatedPotential },
      { label: "Exploration priority", value: zone.priority },
    ]);
  };
    const activateOnKeyDown = (event, onActivate) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onActivate();
      }
    };

  useEffect(() => {
    requestAiAnalysis()
      .then((data) => {
        setAiData(data);
        setLastUpdated(getCurrentSyncTime());
      })
      .catch((error) => {
        console.error("MOIL AI API Error:", error);
        setApiError(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!activeDetail) {
      return undefined;
    }

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setActiveDetail(null);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activeDetail]);

  const handleRunAiAnalysis = async () => {
    const invalidField = PREDICTION_FIELDS.find((field) => {
      const value = predictionInputs[field.name] === "" ? NaN : Number(predictionInputs[field.name]);
      return !Number.isFinite(value) || value < field.min || value > field.max;
    });

    if (invalidField) {
      const message = `${invalidField.label} must be between ${invalidField.min.toLocaleString()} and ${invalidField.max.toLocaleString()}${invalidField.unit === "%" ? "%" : ` ${invalidField.unit}`}.`;
      setPredictionValidationError(message);
      setAnalysisStatus({ type: "error", message });
      return;
    }

    setPredictionValidationError(null);
    setAnalysisLoading(true);
    setAnalysisStatus(null);

    try {
      const requestInputs = buildPredictionPayload(predictionInputs);
      const data = await requestAiAnalysis(requestInputs);
      setAiData(data);
      setApiError(null);
      setLastUpdated(getCurrentSyncTime());
      setAnalysisStatus({ type: "success", message: "Analysis updated" });
    } catch (error) {
      console.error("MOIL AI API Error:", error);
      setApiError(error.message);
      setAnalysisStatus({ type: "error" });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const inspectProductionMetric = (metric) => {
    const details = {
      forecast: ["AI Predicted Production", "Forecast value returned by the existing prediction endpoint.", [
        { label: "Predicted production", value: aiData ? `${aiData.predicted_production_tonnes.toLocaleString()} T` : "—" },
        { label: "Target", value: aiData ? `${aiData.target_production_tonnes.toLocaleString()} T` : "—" },
        { label: "Shortfall", value: aiData ? `${aiData.expected_shortfall_tonnes.toLocaleString()} T` : "—" },
        { label: "Model", value: aiData?.model || "Unavailable" },
      ]],
      target: ["Target Production", "Planned cycle output passed to the prediction model.", [
        { label: "Target", value: aiData ? `${aiData.target_production_tonnes.toLocaleString()} T` : "—" },
        { label: "Production cycle", value: selectedCycleLabel },
        { label: "Source", value: "Prediction input · prototype" },
      ]],
      risk: ["Production Risk", "Risk classification is calculated by the existing prediction service from shortfall percentage.", [
        { label: "Risk", value: aiData?.shortfall_risk || "—" },
        { label: "Shortfall", value: aiData ? `${aiData.expected_shortfall_tonnes.toLocaleString()} T` : "—" },
        { label: "Below target", value: aiData ? `${aiData.shortfall_percentage}%` : "—" },
        { label: "Main constraint", value: aiData?.main_constraint || "—" },
      ]],
      reserve: ["Reserve Potential", "Model estimate from the current prediction response.", [
        { label: "Potential", value: aiData ? `${aiData.reserve_potential_percent}%` : "—" },
        { label: "Data mode", value: aiData?.data_mode || "Prototype" },
      ]],
      actual: ["Current Production", "Latest reported value from the synthetic production series.", [
        { label: "Latest actual", value: currentProduction === null ? "—" : `${currentProduction.toLocaleString()} T` },
        { label: "Cycle day", value: "17 · synthetic series" },
        { label: "Target", value: aiData ? `${aiData.target_production_tonnes.toLocaleString()} T` : "—" },
      ]],
      achievement: ["Current Achievement", "Latest actual output divided by the model target.", [
        { label: "Achievement", value: currentProduction !== null && targetProduction > 0 ? `${currentAchievement.toFixed(1)}%` : "—" },
        { label: "Latest actual", value: currentProduction === null ? "—" : `${currentProduction.toLocaleString()} T` },
        { label: "Target", value: aiData ? `${aiData.target_production_tonnes.toLocaleString()} T` : "—" },
      ]],
      freshness: ["Production Data Freshness", "Timestamp reflects the most recent successful model request in this browser session.", [
        { label: "Last updated", value: lastUpdated },
        { label: "Data mode", value: aiData?.data_mode || "Prototype" },
        { label: "Forecast horizon", value: productionRange },
      ]],
      confidence: ["Forecast Confidence", "Prototype confidence metadata; the /predict response does not return a calibrated confidence interval.", [
        { label: "Prototype confidence", value: "82% · illustrative" },
        { label: "Model", value: aiData?.model || "Unavailable" },
        { label: "Data mode", value: aiData?.data_mode || "Prototype" },
      ]],
    };
    const [title, description, metrics] = details[metric];
    showDetails(title, description, metrics);
  };

  const showRiskDetails = (risk) => {
    setSelectedRiskName(risk.name);
    const currentValue = risk.name === "Equipment downtime"
      ? aiData ? `${aiData.equipment_downtime}%` : "—"
      : risk.name === "Weather conditions"
        ? aiData ? `${aiData.rainfall_impact}% impact` : "—"
        : risk.name === "Blasting delays"
          ? "17% · synthetic profile"
          : "8% · synthetic profile";

    showDetails(risk.name, risk.impact, [
      { label: "Risk category", value: risk.category },
      { label: "Current value", value: currentValue },
      { label: "Trend", value: risk.trend },
      { label: "Status", value: risk.status },
      { label: "Risk contribution", value: `${risk.value}% · synthetic profile` },
      { label: "Recommended mitigation", value: risk.mitigation },
    ]);
  };

  const showInsightDetails = (insight) => {
    showDetails(insight.title, insight.reason, [
      { label: "Category / priority", value: `${insight.category} · ${insight.priority}` },
      { label: "Supporting indicators", value: insight.indicators.join("; ") },
      { label: "Impact", value: insight.impact },
      { label: "Confidence", value: insight.confidence },
      { label: "Recommended action", value: insight.action },
      { label: "Affected area", value: insight.area },
      { label: "Data freshness", value: insight.timestamp },
    ]);
  };

  const showSourceDetails = (source) => {
    showDetails(source.name, `${source.connection}. No unconfigured live connection is implied.`, [
      { label: "Status", value: source.status },
      { label: "Last update", value: source.lastUpdate === "On model request" ? lastUpdated : source.lastUpdate },
      { label: "Data freshness", value: source.freshness },
      { label: "Coverage", value: source.coverage },
      { label: "Records / observations", value: source.observations },
      { label: "Connection type", value: source.connection },
    ]);
  };

  const inspectProductionChartPoint = (chartState) => {
    const point = chartState?.activePayload?.[0]?.payload
      ?? productionPageChartData.find((item) => item.day === chartState?.activeLabel);
    if (!point) return;

    showDetails(`Production data · day ${point.day}`, "Selected point across the visible production series.", [
      { label: "Target", value: point.target == null ? "—" : `${Number(point.target).toLocaleString()} T` },
      { label: "Actual", value: point.actual == null ? "—" : `${Number(point.actual).toLocaleString()} T` },
      { label: "Forecast", value: point.forecast == null ? "—" : `${Number(point.forecast).toLocaleString()} T` },
      { label: "Selected horizon", value: productionRange },
      { label: "Data source", value: point.forecast != null && aiData ? "Model forecast + synthetic history" : "Synthetic production history" },
    ]);
  };

  const createProductionPointDot = (series, fill) => (pointProps) => (
    <circle
      className="production-chart-point"
      cx={pointProps.cx}
      cy={pointProps.cy}
      r={4}
      fill={fill}
      role="button"
      tabIndex={0}
      aria-label={`${series} on day ${pointProps.payload?.day ?? "unknown"}`}
      onClick={(event) => {
        event.stopPropagation();
        const point = pointProps.payload;
        if (point?.day) {
          showDetails(`${series} · day ${point.day}`, "Selected production series value for this cycle day.", [
            { label: "Selected value", value: point[series.toLowerCase()] == null ? "—" : `${Number(point[series.toLowerCase()]).toLocaleString()} T` },
            { label: "Target", value: point.target == null ? "—" : `${Number(point.target).toLocaleString()} T` },
            { label: "Actual", value: point.actual == null ? "—" : `${Number(point.actual).toLocaleString()} T` },
            { label: "Forecast", value: point.forecast == null ? "—" : `${Number(point.forecast).toLocaleString()} T` },
            { label: "Selected horizon", value: productionRange },
          ]);
        }
      }}
      onKeyDown={(event) => activateOnKeyDown(event, () => {
        const point = pointProps.payload;
        if (point?.day) {
          showDetails(`${series} · day ${point.day}`, "Selected production series value for this cycle day.", [
            { label: "Selected value", value: point[series.toLowerCase()] == null ? "—" : `${Number(point[series.toLowerCase()]).toLocaleString()} T` },
            { label: "Target", value: point.target == null ? "—" : `${Number(point.target).toLocaleString()} T` },
            { label: "Actual", value: point.actual == null ? "—" : `${Number(point.actual).toLocaleString()} T` },
            { label: "Forecast", value: point.forecast == null ? "—" : `${Number(point.forecast).toLocaleString()} T` },
            { label: "Selected horizon", value: productionRange },
          ]);
        }
      })}
    />
  );

  const toggleChartSeries = (series) => {
    setChartSeriesVisibility((currentVisibility) => ({
      ...currentVisibility,
      [series]: !currentVisibility[series],
    }));
  };

  const toggleMapLayer = (layer) => {
    setMapLayers((currentLayers) => ({ ...currentLayers, [layer]: !currentLayers[layer] }));
  };

  const toggleInsightExpanded = (id) => {
    setExpandedInsights((currentExpanded) => ({ ...currentExpanded, [id]: !currentExpanded[id] }));
  };

  const inspectMetric = (label, value, description = "Current model output") => {
    showDetails(label, description, [
      { label: "Value", value: value || "—" },
      { label: "Production cycle", value: "September 2026" },
      { label: "Last synchronized", value: lastUpdated },
    ]);
  };

  const targetProduction = Number(aiData?.target_production_tonnes ?? 0);
  const predictedProduction = Number(aiData?.predicted_production_tonnes ?? 0);
  const productionAttainment = targetProduction > 0
    ? (predictedProduction / targetProduction) * 100
    : 0;
  const currentProduction = [...productionData].reverse().find((item) => item.actual !== null)?.actual ?? null;
  const currentAchievement = targetProduction > 0 && currentProduction !== null
    ? (currentProduction / targetProduction) * 100
    : 0;
  const productionChartData = productionData
    .filter((item) => productionDateRange !== "7D" || Number(item.day) >= 23)
    .map((item) => item.day === "25" && aiData
      ? { ...item, forecast: Math.round(aiData.predicted_production_tonnes) }
      : item);
  const productionPageChartData = productionData
    .filter((item) => productionRange !== "7D" || (Number(item.day) >= 17 && Number(item.day) <= 21))
    .map((item) => item.day === (productionRange === "7D" ? "21" : "29") && aiData
      ? { ...item, forecast: Math.round(aiData.predicted_production_tonnes) }
      : item);
  const productionScale = Math.max(targetProduction, predictedProduction, 1);
  const productionRisk = aiData?.shortfall_risk?.toUpperCase() ?? "";
  const productionRiskTone = productionRisk === "HIGH"
    ? "high"
    : productionRisk === "MEDIUM"
      ? "medium"
      : productionRisk
        ? "low"
        : "unknown";
  const visibleRiskTrendData = riskRange === "7D"
    ? riskTrendData.slice(-2)
    : riskRange === "30D"
      ? riskTrendData.slice(-4)
      : riskTrendData;
  const filteredRisks = risks.filter((risk) => riskFilter === "All Risks" || risk.category === riskFilter);
  const filteredReserveZones = reserveZones.filter((zone) => (
    zoneFilter === "All Zones" || zone.potential.toLowerCase() === zoneFilter.toLowerCase()
  ));
  const operationalInsights = aiData ? [
    {
      id: "production", category: "Production", priority: productionRisk === "HIGH" ? "High" : "Medium",
      status: productionRisk === "HIGH" ? "Action Required" : "Monitoring", title: "Forecast against target",
      reason: `Predicted production is ${aiData.shortfall_percentage}% below the cycle target.`,
      indicators: [`Forecast: ${Math.round(predictedProduction).toLocaleString()} T`, `Target: ${Math.round(targetProduction).toLocaleString()} T`, `Shortfall: ${Math.round(aiData.expected_shortfall_tonnes).toLocaleString()} T`],
      impact: `${Math.round(aiData.expected_shortfall_tonnes).toLocaleString()} T expected shortfall`, confidence: "82% · prototype estimate",
      action: aiData.recommended_actions?.[0] || "Review the production plan.", area: "Production cycle", timestamp: lastUpdated,
    },
    {
      id: "risk", category: "Risk", priority: productionRisk === "HIGH" ? "High" : "Medium",
      status: productionRisk === "HIGH" ? "Action Required" : "Monitoring", title: `${productionRisk || "Production"} production risk`,
      reason: `${aiData.main_constraint} is the leading model constraint.`,
      indicators: [`Risk: ${productionRisk || "Unavailable"}`, `Below target: ${aiData.shortfall_percentage}%`, `Constraint: ${aiData.main_constraint}`],
      impact: `${aiData.shortfall_risk} risk classification`, confidence: "Model output · prototype data",
      action: aiData.recommended_actions?.[0] || "Review contributing factors.", area: "Operations", timestamp: lastUpdated,
    },
    {
      id: "equipment", category: "Equipment", priority: aiData.equipment_availability < 75 ? "High" : "Low",
      status: aiData.equipment_availability < 75 ? "Action Required" : "Monitoring", title: "Fleet availability constraint",
      reason: `Equipment availability is ${aiData.equipment_availability}%.`,
      indicators: [`Availability: ${aiData.equipment_availability}%`, `Downtime input: ${aiData.equipment_downtime}%`],
      impact: aiData.main_constraint, confidence: "Model output · prototype data",
      action: aiData.recommended_actions?.find((action) => action.toLowerCase().includes("equipment")) || "Review fleet deployment.", area: "Fleet operations", timestamp: lastUpdated,
    },
    {
      id: "geological", category: "Geological", priority: "Medium", status: "Monitoring", title: "Priority prospectivity zone",
      reason: `${reserveZones[0].name} has the strongest synthetic score in the demonstration set.`,
      indicators: [`Prospectivity score: ${reserveZones[0].score}%`, `Geological confidence: ${reserveZones[0].confidence}%`],
      impact: reserveZones[0].estimatedPotential, confidence: `${reserveZones[0].confidence}% · synthetic`,
      action: reserveZones[0].priority, area: reserveZones[0].zoneId, timestamp: "Prototype zone record",
    },
    {
      id: "environment", category: "Environmental", priority: "Low", status: "Monitoring", title: "Rainfall-impact assumption",
      reason: "The environmental panel currently uses a synthetic rainfall-impact scenario.",
      indicators: [`Rainfall impact: ${environmentalIndicators[0].value}`, `Source: ${environmentalIndicators[0].source}`],
      impact: "Context only; requires field validation", confidence: "Synthetic indicator",
      action: "Review the rainfall assumption in Prediction Inputs.", area: "Environmental indicators", timestamp: environmentalIndicators[0].freshness,
    },
  ] : [];
  const filteredInsights = operationalInsights.filter((insight) => (
    (insightCategory === "All" || insight.category === insightCategory)
    && (insightPriority === "All" || insight.priority === insightPriority)
    && (insightStatus === "All" || insight.status === insightStatus)
  ));
  const insightSummary = {
    signals: filteredInsights.length,
    highPriority: filteredInsights.filter((insight) => insight.priority === "High").length,
    actionRequired: filteredInsights.filter((insight) => insight.status === "Action Required").length,
  };
  const selectedCycleLabel = selectedDate
    ? settings.dateFormat === "YYYY-MM-DD"
      ? selectedDate
      : new Intl.DateTimeFormat("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(`${selectedDate}T00:00:00`))
    : "Select date";

  return (
    <div className={`app ${settings.density === "comfortable" ? "density-comfortable" : ""}`}>

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            <Mountain size={22} />
          </div>

          <div>
            <div className="brand-name">MOIL</div>
            <div className="brand-subtitle">Mining Intelligence</div>
          </div>
        </div>


        <div className="demo-badge">
          <span></span>
          Operations mode
        </div>


        <nav className="navigation">

          <div className="nav-section">OPERATIONS</div>

          <div
  className={`nav-item ${activePage === "overview" ? "active" : ""}`}
  onClick={() => setActivePage("overview")}
>
  <Gauge size={18} />
  <span>Overview</span>
</div>

          <div
    className={`nav-item ${activePage === "production" ? "active" : ""}`}
    onClick={() => setActivePage("production")}
>
    <BarChart3 size={18} />
    <span>Production</span>
</div>

          <div
  className={`nav-item ${activePage === "risk" ? "active" : ""}`}
  onClick={() => setActivePage("risk")}
>
  <AlertCircle size={22} />
  <span>Risk Analysis</span>
  <span className="badge">3</span>
</div>

          <div
    className={`nav-item ${activePage === "equipment" ? "active" : ""}`}
    onClick={() => setActivePage("equipment")}
  >
    <Truck size={18} />
    <span>Equipment</span>
</div>

          <div className="nav-section">GEO & DATA</div>

          <div
  className={`nav-item ${activePage === "reserve" ? "active" : ""}`}
  onClick={() => setActivePage("reserve")}
>
  <Map size={18} />
  <span>Reserve Potential</span>
</div>

          <div className={`nav-item ${activePage === "environment" ? "active" : ""}`} onClick={() => setActivePage("environment")}>
            <CloudRain size={18} />
            <span>Satellite Data</span>
          </div>

          <div className={`nav-item ${activePage === "data" ? "active" : ""}`} onClick={() => setActivePage("data")}>
            <Layers3 size={18} />
            <span>Geological Data</span>
          </div>

          <div className="nav-section">INTELLIGENCE</div>

          <div
    className={`nav-item ${activePage === "insights" ? "active" : ""}`}
    onClick={() => setActivePage("insights")}
>
            <Brain size={18} />
            <span>AI Insights</span>
          </div>

          <div className={`nav-item ${activePage === "reports" ? "active" : ""}`} onClick={() => setActivePage("reports")}>
            <Package size={18} />
            <span>Reports</span>
          </div>

          <div className="nav-section">SYSTEM</div>

          <div
  className={`nav-item ${activePage === "settings" ? "active" : ""}`}
  onClick={() => setActivePage("settings")}
>
  <Settings size={18} />
  <span>Settings</span>
</div>

        </nav>


        <div className="sidebar-bottom">
          <div className="system-status">
            <div className="status-dot"></div>
            <div>
              <strong>System Online</strong>
              <small>Model services operational</small>
            </div>
          </div>
        </div>

      </aside>


      {/* MAIN */}
      <main className="main">

        {/* TOPBAR */}
        <header className="topbar">

          <div className="mobile-menu">
            <Menu />
          </div>

          <div className="title-block">
            <div className="breadcrumb">
              MOIL / Mine Operations Control
            </div>
            <h1>{settings.systemName}</h1>
            <div className="topbar-subtitle">Manganese Operations Decision Support</div>
          </div>

          <div className="top-actions">
            <div className="topbar-meta">
              <span className="header-chip live-chip"><span className="dot" /> Live</span>
              <span className="header-chip">Updated {lastUpdated}</span>
              <label className="header-select-wrap">
                <span>Site</span>
                <select value={selectedMine} onChange={(event) => setSelectedMine(event.target.value)}>
                  <option>Balaghat</option>
                  <option>Chandrapur</option>
                  <option>Jaipur</option>
                </select>
              </label>
              <label className="header-select-wrap">
                <span>Range</span>
                <select value={selectedDateRange} onChange={(event) => setSelectedDateRange(event.target.value)}>
                  <option value="7D">7D</option>
                  <option value="30D">30D</option>
                  <option value="90D">90D</option>
                </select>
              </label>
            </div>

            <button className="icon-button" type="button" aria-label="Notifications">
              <Bell size={19} />
              <span className="notification-dot"></span>
            </button>

            <div className="profile">
              <div className="profile-avatar">AI</div>

              <div className="profile-text">
                <strong>Analytics Team</strong>
                <small>MOIL Operations</small>
              </div>
            </div>

          </div>

        </header>


        {/* CONTENT */}
        <div className="content">
      {activePage === "overview" ? (
        <section className="overview-console">
          <div className="page-heading">

            <div>
              <h2>Mine Operations Overview</h2>
              <p>
                Production, reserve and operating risk monitoring across the active cycle
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "7px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  className="panel-action"
                  onClick={handleRunAiAnalysis}
                  disabled={analysisLoading || loading}
                  aria-busy={analysisLoading}
                >
                  <Brain size={14} />
                  {analysisLoading ? "Running Analysis..." : "Run Analysis"}
                </button>

                <button
                  className="date-chip date-selector"
                  type="button"
                  onClick={() => setActiveDetail({ type: "date" })}
                  aria-haspopup="dialog"
                >
                  <CalendarDays size={16} />
                  Production cycle · {selectedCycleLabel}
                </button>
              </div>

              {analysisStatus && (
                <small
                  role="status"
                  style={{ color: analysisStatus.type === "success" ? "#168f5b" : "#bd473f" }}
                >
                  {analysisStatus.type === "error"
                    ? `Analysis failed: ${apiError}`
                    : analysisStatus.message}
                </small>
              )}
            </div>

          </div>


          <div className="overview-meta-strip" aria-label="Operational data context">
            <span><strong>Last synchronized</strong> {lastUpdated}</span>
            <span><strong>Data freshness</strong> 8 min</span>
            <span><strong>Current shift</strong> B</span>
            <span><strong>Forecast horizon</strong> 30 days</span>
            <span><strong>Model confidence</strong> 82%</span>
          </div>

          <div className="operations-strip" aria-label="Operations summary workflow">
            <span className="operations-strip-label">Operations</span>
            <span className="operations-strip-item active">Overview</span>
            <span className="operations-strip-item">Production</span>
            <span className="operations-strip-item">Risk</span>
            <span className="operations-strip-item">Reserve</span>
          </div>

          {/* KPI CARDS */}
          <section className="kpi-grid">

            <div
              className="kpi-card interactive-card"
              role="button"
              tabIndex={0}
              onClick={() => showDetails("Reserve Potential", "Current reserve potential estimate from the model.", [
                { label: "Reserve potential", value: aiData ? `${aiData.reserve_potential_percent}%` : "—" },
                { label: "Data mode", value: aiData?.data_mode || "Prototype" },
              ])}
              onKeyDown={(event) => activateOnKeyDown(event, () => showDetails("Reserve Potential", "Current reserve potential estimate from the model.", [
                { label: "Reserve potential", value: aiData ? `${aiData.reserve_potential_percent}%` : "—" },
                { label: "Data mode", value: aiData?.data_mode || "Prototype" },
              ]))}
            >

              <div className="kpi-top">
                <span>Reserve Potential</span>
                <div className="kpi-icon green">
                  <Mountain size={19} />
                </div>
              </div>

              <div className="kpi-value">
  {loading ? "..." : `${aiData?.reserve_potential_percent ?? 0}%`}
</div>

              <div className="kpi-meta positive">
                Reserve model estimate
              </div>

              <div className="kpi-description">
                High-confidence manganese zones · prototype estimate
              </div>

            </div>


            <div
              className="kpi-card interactive-card"
              role="button"
              tabIndex={0}
              onClick={() => showDetails("Production Forecast", "Forecast compared with the current production target.", [
                { label: "Predicted production", value: aiData ? `${Math.round(predictedProduction).toLocaleString()} T` : "—" },
                { label: "Target production", value: aiData ? `${Math.round(targetProduction).toLocaleString()} T` : "—" },
                { label: "Expected shortfall", value: aiData ? `${Math.round(aiData.expected_shortfall_tonnes ?? 0).toLocaleString()} T` : "—" },
              ])}
              onKeyDown={(event) => activateOnKeyDown(event, () => showDetails("Production Forecast", "Forecast compared with the current production target.", [
                { label: "Predicted production", value: aiData ? `${Math.round(predictedProduction).toLocaleString()} T` : "—" },
                { label: "Target production", value: aiData ? `${Math.round(targetProduction).toLocaleString()} T` : "—" },
                { label: "Expected shortfall", value: aiData ? `${Math.round(aiData.expected_shortfall_tonnes ?? 0).toLocaleString()} T` : "—" },
              ]))}
            >

              <div className="kpi-top">
                <span>Production Forecast</span>
                <div className="kpi-icon blue">
                  <TrendingUp size={19} />
                </div>
              </div>

              <div className="kpi-value">
  {loading
    ? "..."
    : `${Math.round(aiData?.predicted_production_tonnes ?? 0).toLocaleString()} `}
  <small>T</small>
</div>
              <div className="kpi-meta negative">
                <ArrowDown size={14} />
                {loading ? "Calculating..." : `${aiData?.shortfall_percentage ?? 0}% below target`}
              </div>

              <div className="kpi-description">
                Predicted production for next cycle
              </div>

            </div>


            <div
              className="kpi-card interactive-card"
              role="button"
              tabIndex={0}
              onClick={() => showDetails("Shortfall Risk", "Current production risk signal and expected shortfall.", [
                { label: "Risk level", value: productionRisk || "—" },
                { label: "Shortfall", value: aiData ? `${Math.round(aiData.expected_shortfall_tonnes ?? 0).toLocaleString()} T` : "—" },
                { label: "Below target", value: aiData ? `${aiData.shortfall_percentage}%` : "—" },
              ])}
              onKeyDown={(event) => activateOnKeyDown(event, () => showDetails("Shortfall Risk", "Current production risk signal and expected shortfall.", [
                { label: "Risk level", value: productionRisk || "—" },
                { label: "Shortfall", value: aiData ? `${Math.round(aiData.expected_shortfall_tonnes ?? 0).toLocaleString()} T` : "—" },
                { label: "Below target", value: aiData ? `${aiData.shortfall_percentage}%` : "—" },
              ]))}
            >

              <div className="kpi-top">
                <span>Shortfall Risk</span>
                <div className="kpi-icon orange">
                  <AlertTriangle size={19} />
                </div>
              </div>

              <div className="kpi-value orange-text">
                {loading ? "..." : aiData?.shortfall_risk}

              </div>

              <div className="risk-meter">
                <div
                  className="risk-meter-fill"
                  style={{ width: `${Math.min(aiData?.shortfall_percentage ?? 0, 100)}%` }}
                />
              </div>

              <div className="kpi-description">
                Estimated shortfall:{" "}
<strong>
  {loading
    ? "..."
    : `${Math.round(
        aiData?.expected_shortfall_tonnes ?? 0
      ).toLocaleString()} T`}
</strong>
              </div>

            </div>


            <div
              className="kpi-card interactive-card"
              role="button"
              tabIndex={0}
              onClick={() => showDetails("Equipment Availability", "Fleet availability supplied to the current model cycle.", [
                { label: "Available equipment", value: aiData ? `${aiData.equipment_availability}%` : "—" },
                { label: "Equipment downtime", value: aiData ? `${aiData.equipment_downtime}%` : "—" },
              ])}
              onKeyDown={(event) => activateOnKeyDown(event, () => showDetails("Equipment Availability", "Fleet availability supplied to the current model cycle.", [
                { label: "Available equipment", value: aiData ? `${aiData.equipment_availability}%` : "—" },
                { label: "Equipment downtime", value: aiData ? `${aiData.equipment_downtime}%` : "—" },
              ]))}
            >

              <div className="kpi-top">
                <span>Equipment Availability</span>
                <div className="kpi-icon purple">
                  <Cpu size={19} />
                </div>
              </div>

              <div className="kpi-value">
  {loading ? "..." : `${aiData?.equipment_availability ?? 0}%`}
</div>

              <div className="kpi-meta negative">
                <ArrowDown size={14} />
                Model input: 70% availability
              </div>

              <div className="kpi-description">
                Current fleet operational availability
              </div>

            </div>

            <div
              className="kpi-card interactive-card"
              role="button"
              tabIndex={0}
              onClick={() => showDetails("Operational Risk", "Current production risk classification returned by the prediction model.", [
                { label: "Risk level", value: productionRisk || "—" },
                { label: "Main constraint", value: aiData?.main_constraint || "—" },
                { label: "Model confidence", value: "82% · prototype" },
              ])}
              onKeyDown={(event) => activateOnKeyDown(event, () => showDetails("Operational Risk", "Current production risk classification returned by the prediction model.", [
                { label: "Risk level", value: productionRisk || "—" },
                { label: "Main constraint", value: aiData?.main_constraint || "—" },
                { label: "Model confidence", value: "82% · prototype" },
              ]))}
            >
              <div className="kpi-top"><span>Operational Risk</span></div>
              <div className="kpi-value orange-text">{loading ? "..." : productionRisk || "—"}</div>
              <div className="kpi-meta">Model classification</div>
              <div className="kpi-description">Current production risk signal</div>
            </div>

          </section>

          <section className="panel production-intelligence">
            <div className="panel-header">
              <div>
                <h3>Production Intelligence</h3>
                <p>Model forecast against the current production target</p>
              </div>
              <div className="production-header-actions">
                <div className={`production-risk-status ${productionRiskTone}`}>
                  <span aria-hidden="true" />
                  {productionRisk ? `${productionRisk} RISK` : "Awaiting analysis"}
                </div>
                <button
                  className="panel-action"
                  type="button"
                  onClick={() => showDetails("Production Intelligence", "Cycle-level production forecast compared with the operating target.", [
                    { label: "Latest actual", value: currentProduction === null ? "—" : `${currentProduction.toLocaleString()} T` },
                    { label: "Predicted production", value: aiData ? `${Math.round(predictedProduction).toLocaleString()} T` : "—" },
                    { label: "Target production", value: aiData ? `${Math.round(targetProduction).toLocaleString()} T` : "—" },
                    { label: "Achievement", value: aiData ? `${productionAttainment.toFixed(1)}%` : "—" },
                  ])}
                >
                  Details <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="production-intelligence-layout">
              <div className="production-performance">
                <div className="production-achievement">
                  <span>Production achievement</span>
                  <strong>{aiData ? `${productionAttainment.toFixed(1)}%` : "—"}</strong>
                  <small>of target</small>
                </div>

                <div className="production-comparison-bars">
                  <div className="production-bar-row">
                    <div className="production-bar-label">
                      <span>Predicted production</span>
                      <strong>{aiData ? `${Math.round(predictedProduction).toLocaleString()} T` : "—"}</strong>
                    </div>
                    <div className="production-bar-track">
                      <div
                        className="production-bar-fill predicted"
                        style={{ width: aiData ? `${(predictedProduction / productionScale) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>

                  <div className="production-bar-row">
                    <div className="production-bar-label">
                      <span>Target production</span>
                      <strong>{aiData ? `${Math.round(targetProduction).toLocaleString()} T` : "—"}</strong>
                    </div>
                    <div className="production-bar-track">
                      <div
                        className="production-bar-fill target"
                        style={{ width: aiData ? `${(targetProduction / productionScale) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="production-shortfall">
                <div className="production-shortfall-icon">
                  <AlertTriangle size={17} />
                </div>
                <div>
                  <span>Expected shortfall</span>
                  <strong>
                    {aiData
                      ? `${Math.round(aiData.expected_shortfall_tonnes ?? 0).toLocaleString()} T`
                      : "—"}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section className="panel operational-summary">
            <div className="panel-header">
              <div>
                <h3>Operational Summary</h3>
                <p>Latest model assessment of production and operating conditions</p>
              </div>
              <Brain className="ai-header-icon" size={21} />
            </div>

            <div className="operational-summary-grid">
              <div
                className="operational-summary-item interactive-item"
                role="button"
                tabIndex={0}
                onClick={() => inspectMetric("Predicted production", aiData ? `${Math.round(predictedProduction).toLocaleString()} T` : "—", "Current production forecast from the model.")}
                onKeyDown={(event) => activateOnKeyDown(event, () => inspectMetric("Predicted production", aiData ? `${Math.round(predictedProduction).toLocaleString()} T` : "—", "Current production forecast from the model."))}
              >
                <span className="operational-summary-label">Predicted production</span>
                <strong className="operational-summary-value">
                  {aiData ? `${Math.round(predictedProduction).toLocaleString()} T` : "—"}
                </strong>
              </div>
              <div
                className="operational-summary-item interactive-item"
                role="button"
                tabIndex={0}
                onClick={() => inspectMetric("Target production", aiData ? `${Math.round(targetProduction).toLocaleString()} T` : "—", "Planned output for the active production cycle.")}
                onKeyDown={(event) => activateOnKeyDown(event, () => inspectMetric("Target production", aiData ? `${Math.round(targetProduction).toLocaleString()} T` : "—", "Planned output for the active production cycle."))}
              >
                <span className="operational-summary-label">Target production</span>
                <strong className="operational-summary-value">
                  {aiData ? `${Math.round(targetProduction).toLocaleString()} T` : "—"}
                </strong>
              </div>
              <div
                className="operational-summary-item interactive-item"
                role="button"
                tabIndex={0}
                onClick={() => inspectMetric("Expected shortfall", aiData ? `${Math.round(aiData.expected_shortfall_tonnes ?? 0).toLocaleString()} T` : "—", "Forecast production gap against target.")}
                onKeyDown={(event) => activateOnKeyDown(event, () => inspectMetric("Expected shortfall", aiData ? `${Math.round(aiData.expected_shortfall_tonnes ?? 0).toLocaleString()} T` : "—", "Forecast production gap against target."))}
              >
                <span className="operational-summary-label">Expected shortfall</span>
                <strong className="operational-summary-value">
                  {aiData
                    ? `${Math.round(aiData.expected_shortfall_tonnes ?? 0).toLocaleString()} T`
                    : "—"}
                </strong>
              </div>
              <div
                className="operational-summary-item interactive-item"
                role="button"
                tabIndex={0}
                onClick={() => inspectMetric("Production risk", productionRisk || "—", "Current model risk classification.")}
                onKeyDown={(event) => activateOnKeyDown(event, () => inspectMetric("Production risk", productionRisk || "—", "Current model risk classification."))}
              >
                <span className="operational-summary-label">Production risk</span>
                <strong
                  className={`operational-summary-value ${aiData?.shortfall_risk === "HIGH" ? "summary-risk-high" : aiData?.shortfall_risk === "MEDIUM" ? "summary-risk-medium" : ""}`}
                >
                  {aiData?.shortfall_risk || "—"}
                </strong>
              </div>
              <div
                className="operational-summary-item interactive-item"
                role="button"
                tabIndex={0}
                onClick={() => inspectMetric("Equipment availability", aiData ? `${aiData.equipment_availability ?? 0}%` : "—", "Fleet availability supplied to the model.")}
                onKeyDown={(event) => activateOnKeyDown(event, () => inspectMetric("Equipment availability", aiData ? `${aiData.equipment_availability ?? 0}%` : "—", "Fleet availability supplied to the model."))}
              >
                <span className="operational-summary-label">Equipment availability</span>
                <strong className="operational-summary-value">
                  {aiData ? `${aiData.equipment_availability ?? 0}%` : "—"}
                </strong>
              </div>
              <div
                className="operational-summary-item interactive-item"
                role="button"
                tabIndex={0}
                onClick={() => inspectMetric("Main operational constraint", aiData?.main_constraint || "—", "Primary constraint identified in the current model response.")}
                onKeyDown={(event) => activateOnKeyDown(event, () => inspectMetric("Main operational constraint", aiData?.main_constraint || "—", "Primary constraint identified in the current model response."))}
              >
                <span className="operational-summary-label">Main operational constraint</span>
                <strong className="operational-summary-value summary-constraint">
                  {aiData?.main_constraint || "—"}
                </strong>
              </div>
            </div>

            <div className="summary-comparison">
              <div className="summary-comparison-heading">
                <span>Predicted production vs target</span>
                <strong>{aiData ? `${productionAttainment.toFixed(0)}% of target` : "Awaiting analysis"}</strong>
              </div>
              <div
                className="summary-comparison-track"
                role="progressbar"
                aria-label="Predicted production against target"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(Math.max(productionAttainment, 0), 100)}
                aria-valuetext={aiData ? `${productionAttainment.toFixed(0)}% of target` : "Awaiting analysis"}
              >
                <div
                  className="summary-comparison-fill"
                  style={{ width: `${Math.min(Math.max(productionAttainment, 0), 100)}%` }}
                />
              </div>
              <div className="summary-comparison-values">
                <span>Predicted: {aiData ? `${Math.round(predictedProduction).toLocaleString()} T` : "—"}</span>
                <span>Target: {aiData ? `${Math.round(targetProduction).toLocaleString()} T` : "—"}</span>
              </div>
            </div>
          </section>

{/* OPERATIONAL RISK BREAKDOWN */}
<div className="panel" style={{ marginTop: "22px" }}>
  <div className="panel-header">
    <div>
      <h3>Operational Risk Breakdown</h3>
      <p>Model-identified factors affecting production performance</p>
    </div>
    <div className="chart-badge">LIVE</div>
  </div>

  <div className="risk-factor-grid">
    <div className="risk-factor-card">
      <div className="risk-factor-title">Equipment Downtime</div>
      <div className="risk-factor-value">{aiData ? aiData.equipment_downtime : "—"}%</div>
      <div className="risk-factor-bar">
        <div style={{ width: `${aiData ? Math.min(aiData.equipment_downtime, 100) : 0}%` }} />
      </div>
    </div>

    <div className="risk-factor-card">
      <div className="risk-factor-title">Rainfall Impact</div>
      <div className="risk-factor-value">{aiData ? aiData.rainfall_impact : "—"}%</div>
      <div className="risk-factor-bar">
        <div style={{ width: `${aiData ? Math.min(aiData.rainfall_impact, 100) : 0}%` }} />
      </div>
    </div>

    <div className="risk-factor-card">
      <div className="risk-factor-title">Equipment Availability</div>
      <div className="risk-factor-value">{aiData ? aiData.equipment_availability : "—"}%</div>
      <div className="risk-factor-bar">
        <div style={{ width: `${aiData ? Math.min(aiData.equipment_availability, 100) : 0}%` }} />
      </div>
    </div>

    <div className="risk-factor-card">
      <div className="risk-factor-title">Workforce Availability</div>
      <div className="risk-factor-value">{aiData ? aiData.workforce_availability : "—"}%</div>
      <div className="risk-factor-bar">
        <div style={{ width: `${aiData ? Math.min(aiData.workforce_availability, 100) : 0}%` }} />
      </div>
    </div>
  </div>
</div>

          {/* MAIN GRID */}
          <section className="dashboard-grid">

            {/* MAP */}
            <div className="panel map-panel">

              <div className="panel-header">

                <div>
                  <h3>Reserve Potential Map</h3>
                  <p>Geological indicators and assessed potential zones</p>
                </div>

                <button
                  className="panel-action"
                  type="button"
                  onClick={() => setActiveDetail({ type: "map" })}
                >
                  Full map <ChevronRight size={15} />
                </button>

              </div>


              <div className="map-wrapper">

                <MapContainer
                  center={[21.9, 80.3]}
                  zoom={6}
                  scrollWheelZoom={false}
                  className="map"
                >

                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />


                  <Circle
                    center={[21.85, 80.20]}
                    radius={18000}
                    pathOptions={{
                      color: "#168f5b",
                      fillColor: "#168f5b",
                      fillOpacity: 0.35,
                    }}
                  >
                    <Popup>
                      <strong>East Ridge · Priority zone</strong>
                      <br />
                      High potential · 86% confidence
                    </Popup>
                  </Circle>


                  <Circle
                    center={[22.20, 80.75]}
                    radius={22000}
                    pathOptions={{
                      color: "#d69b22",
                      fillColor: "#d69b22",
                      fillOpacity: 0.30,
                    }}
                  >
                    <Popup>
                      <strong>Central Seam · Monitor</strong>
                      <br />
                      Moderate potential · 67% confidence
                    </Popup>
                  </Circle>


                  <Circle
                    center={[21.45, 79.65]}
                    radius={15000}
                    pathOptions={{
                      color: "#d94a45",
                      fillColor: "#d94a45",
                      fillOpacity: 0.30,
                    }}
                  >
                    <Popup>
                      <strong>South Extension · Review</strong>
                      <br />
                      Watch status · 41% confidence
                    </Popup>
                  </Circle>

                </MapContainer>


                <div className="map-legend">

                  <div className="legend-title">
                    Zone confidence
                  </div>

                  <div>
                    <span className="legend-dot high"></span>
                    High
                  </div>

                  <div>
                    <span className="legend-dot medium"></span>
                    Medium
                  </div>

                  <div>
                    <span className="legend-dot low"></span>
                    Low
                  </div>

                </div>

              </div>

            </div>


            {/* PRODUCTION CHART */}
            <div className="panel chart-panel">

              <div className="panel-header">

                <div>
                  <h3>Production Forecast</h3>
                  <p>Daily output and {productionDateRange === "7D" ? "7-day" : "30-day"} forecast · tonnes</p>
                </div>

                <label className="chart-range-control">
                  <span>Range</span>
                  <select
                    className="chart-range-select"
                    aria-label="Production forecast range"
                    value={productionDateRange}
                    onChange={(event) => setProductionDateRange(event.target.value)}
                  >
                    <option value="7D">7D</option>
                    <option value="30D">30D</option>
                    <option value="90D" disabled>90D · no history</option>
                  </select>
                </label>

              </div>


              <div className="chart-container">

                <ResponsiveContainer width="100%" height={280}>

                  <AreaChart data={productionChartData}>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e8ecef"
                    />

                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      label={{ value: "Day of cycle", position: "insideBottom", offset: -5, style: { fill: "#7b8780", fontSize: 11 } }}
                    />

                    <YAxis
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={45}
                      label={{ value: "Tonnes", angle: -90, position: "insideLeft", style: { fill: "#7b8780", fontSize: 11 } }}
                    />

                    <Tooltip formatter={(value, name) => [`${Number(value).toLocaleString()} t`, name]} />

                    <Area
                      type="monotone"
                      dataKey="target"
                      stroke="#8b949e"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="transparent"
                    />

                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="#168f5b"
                      strokeWidth={2.5}
                      fill="transparent"
                    />

                    <Area
                      type="monotone"
                      dataKey="forecast"
                      stroke="#d99522"
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      fill="transparent"
                    />

                  </AreaChart>

                </ResponsiveContainer>

              </div>


              <div className="chart-legend">

                <span>
                  <i className="legend-line target"></i>
                  Target
                </span>

                <span>
                  <i className="legend-line actual"></i>
                  Actual
                </span>

                <span>
                  <i className="legend-line forecast"></i>
                  Forecast
                </span>

              </div>

            </div>

          </section>


          {/* LOWER GRID */}
          <section className="lower-grid">

            {/* RISKS */}
            <div className="panel">

              <div className="panel-header">

                <div>
                  <h3>Production Risk Analysis</h3>
                  <p>Contributing factors · current shift</p>
                </div>

                <div className={`production-risk-status ${productionRiskTone}`}>
                  <span aria-hidden="true" />
                  {productionRisk ? `${productionRisk} RISK` : "Awaiting assessment"}
                </div>

              </div>


              <div className="risk-list">

                {risks.map((risk) => {

                  const Icon = risk.icon;

                  return (
                    <div
                      className="risk-row interactive-row"
                      key={risk.name}
                      role="button"
                      tabIndex={0}
                      onClick={() => showDetails(risk.name, "Representative factor impact for the current shift.", [
                        { label: "Current impact", value: `${risk.value}%` },
                        { label: "Trend", value: risk.trend },
                        { label: "Status", value: risk.status },
                      ])}
                      onKeyDown={(event) => activateOnKeyDown(event, () => showDetails(risk.name, "Representative factor impact for the current shift.", [
                        { label: "Current impact", value: `${risk.value}%` },
                        { label: "Trend", value: risk.trend },
                        { label: "Status", value: risk.status },
                      ]))}
                    >

                      <div className="risk-icon">
                        <Icon size={17} />
                      </div>

                      <div className="risk-info">

                        <div className="risk-name">
                          {risk.name}
                        </div>

                        <div className="risk-progress">
                          <div
                            style={{
                              width: `${risk.value}%`,
                            }}
                          ></div>
                        </div>

                      </div>

                      <div className="risk-row-context">
                        <span className="risk-trend">{risk.trend}</span>
                        <span className={`risk-factor-status ${risk.status.toLowerCase()}`}>{risk.status}</span>
                      </div>

                      <div className="risk-value">
                        {risk.value}%
                      </div>

                    </div>
                  );

                })}

              </div>

            </div>


            {/* RECOMMENDATIONS */}
            <div className="panel">

              <div className="panel-header">

                <div>
                  <h3>Recommended Actions</h3>
                  <p>Operational work queue · synthetic prototype items</p>
                </div>

                <Brain className="ai-header-icon" size={21} />

              </div>


              <div className="recommendation-list">

                {loading ? (
  <div className="recommendation">
    <div className="recommendation-icon">
      <Brain size={17} />
    </div>

    <div className="recommendation-content">
      <div className="recommendation-title">
        Analyzing operational conditions...
      </div>

      <div className="recommendation-description">
        Reviewing current operating conditions.
      </div>
    </div>
  </div>
) : aiData?.recommended_actions?.length ? (
  aiData.recommended_actions.map((action, index) => (
    <div
      className="recommendation interactive-recommendation"
      key={index}
      role="button"
      tabIndex={0}
      onClick={() => showDetails(action, "Operational work item generated from the current model assessment.", [
        { label: "Reason", value: aiData.main_constraint || "Review forecast variance" },
        { label: "Priority", value: index === 0 ? "Priority 1" : "Priority 2" },
        { label: "Affected area", value: index === 0 ? "Fleet operations" : index === 1 ? "Production planning" : "Mine operations" },
        { label: "Status", value: "Open" },
      ])}
      onKeyDown={(event) => activateOnKeyDown(event, () => showDetails(action, "Operational work item generated from the current model assessment.", [
        { label: "Reason", value: aiData.main_constraint || "Review forecast variance" },
        { label: "Priority", value: index === 0 ? "Priority 1" : "Priority 2" },
        { label: "Affected area", value: index === 0 ? "Fleet operations" : index === 1 ? "Production planning" : "Mine operations" },
        { label: "Status", value: "Open" },
      ]))}
    >
      <div className="recommendation-icon">
        {index === 0 ? (
          <Truck size={17} />
        ) : index === 1 ? (
          <Settings size={17} />
        ) : (
          <Zap size={17} />
        )}
      </div>

      <div className="recommendation-content">
        <div className="recommendation-title">
          {action}
        </div>

        <div className="recommendation-description">
          Reason: {aiData.main_constraint || "Review forecast variance"}
        </div>

        <div className="recommendation-work-meta">
          <span className={`priority ${index === 0 ? "priority-high" : ""}`}>{index === 0 ? "Priority 1" : "Priority 2"}</span>
          <span className="work-area">{index === 0 ? "Fleet operations" : index === 1 ? "Production planning" : "Mine operations"}</span>
          <span className="work-status">Open</span>
        </div>
      </div>

      <ChevronRight size={17} />
    </div>
  ))
) : (
  <div className="recommendation">
    <div className="recommendation-icon">
      <Brain size={17} />
    </div>

    <div className="recommendation-content">
      <div className="recommendation-title">
        No corrective action required
      </div>
    </div>
  </div>
)}
                  
                        

              </div>

            </div>

          </section>


          {/* FOOTER NOTE */}
          <div className="prototype-note">

            <ShieldCheck size={17} />

            <span>
              <strong>Prototype mode:</strong> Demonstration uses
              representative/synthetic operational data. The architecture
              is designed for integration with real geological, production,
              equipment and satellite datasets.
            </span>

          </div>

                </section>
  ) : activePage === "reserve" ? (
  <section className="page-content">

    <div className="page-title">
      <h1>Geospatial Prospectivity</h1>
      <p>Synthetic manganese-bearing zone assessment · illustrative coordinates</p>
    </div>

    <section className="kpi-grid">

      <div className="kpi-card interactive-card" role="button" tabIndex={0} onClick={() => showZoneDetails(reserveZones[0])} onKeyDown={(event) => activateOnKeyDown(event, () => showZoneDetails(reserveZones[0]))}>
        <div className="kpi-top">
          <span>Reserve Potential</span>
          <div className="kpi-icon green">
            <Map size={19} />
          </div>
        </div>

        <div className="kpi-value">
          {loading
            ? "..."
            : `${aiData?.reserve_potential_percent ?? 0}%`}
        </div>

        <div className="kpi-meta positive">
          <ArrowUp size={14} />
          High-confidence potential coverage
        </div>

        <div className="kpi-description">
          Identified geological zones with high reserve potential
        </div>
      </div>

      <div className="kpi-card interactive-card" role="button" tabIndex={0} onClick={() => showDetails("Geological Confidence", "Synthetic confidence estimate based on prototype geological evidence.", [{ label: "Prototype confidence", value: "85%" }, { label: "Data source", value: "Synthetic geological indicators" }, { label: "Validation", value: "Field verification required" }])} onKeyDown={(event) => activateOnKeyDown(event, () => showDetails("Geological Confidence", "Synthetic confidence estimate based on prototype geological evidence.", [{ label: "Prototype confidence", value: "85%" }, { label: "Data source", value: "Synthetic geological indicators" }, { label: "Validation", value: "Field verification required" }]))}>
        <div className="kpi-top">
          <span>Geological Confidence</span>
          <div className="kpi-icon blue">
            <Target size={19} />
          </div>
        </div>

        <div className="kpi-value">
          85%
        </div>

        <div className="kpi-meta positive">
          <ArrowUp size={14} />
          High confidence
        </div>

        <div className="kpi-description">
          Prototype assessment of geological evidence
        </div>
      </div>

    </section>

    <section className="reserve-zone-layout">
      <div className="panel reserve-map-panel">
        <div className="panel-header">
          <div>
            <h3>Prospectivity Map</h3>
            <p>Click a zone to inspect its prototype assessment</p>
          </div>
          <button className="panel-action" type="button" onClick={() => setActiveDetail({ type: "map" })}>Expand map <ChevronRight size={14} /></button>
        </div>

        <div className="map-module-controls">
          <div className="map-layer-toggles" role="group" aria-label="Map layers">
            <button className={`map-layer-toggle ${mapLayers.prospectivity ? "selected" : ""}`} type="button" aria-pressed={mapLayers.prospectivity} onClick={() => toggleMapLayer("prospectivity")}>Prospectivity</button>
            <button className={`map-layer-toggle ${mapLayers.environment ? "selected" : ""}`} type="button" aria-pressed={mapLayers.environment} onClick={() => toggleMapLayer("environment")}>Environment</button>
            <button className="map-layer-toggle unavailable" type="button" disabled title="No operational infrastructure geometry is connected">Operations · unavailable</button>
          </div>
          <div className="reserve-zone-filters" role="group" aria-label="Prospectivity zone filter">
            {["All Zones", "High", "Moderate", "Low"].map((filter) => (
              <button className={`filter-button ${zoneFilter === filter ? "selected" : ""}`} type="button" key={filter} aria-pressed={zoneFilter === filter} onClick={() => setZoneFilter(filter)}>{filter}</button>
            ))}
          </div>
        </div>

        <div className="map-wrapper reserve-map-wrapper">
          <MapContainer
            center={[21.9, 80.3]}
            zoom={7}
            scrollWheelZoom={false}
            className="map"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapLayers.prospectivity && filteredReserveZones.map((zone) => (
              <Circle
                key={zone.zoneId}
                center={zone.location}
                radius={zone.potential === "High" ? 18000 : zone.potential === "Moderate" ? 15000 : 12000}
                pathOptions={{
                  color: zone.potential === "High" ? "#168f5b" : zone.potential === "Moderate" ? "#d69b22" : "#d94a45",
                  fillColor: zone.potential === "High" ? "#168f5b" : zone.potential === "Moderate" ? "#d69b22" : "#d94a45",
                  fillOpacity: selectedZoneId === zone.zoneId ? 0.52 : 0.3,
                  weight: selectedZoneId === zone.zoneId ? 4 : 2,
                }}
                eventHandlers={{ click: () => showZoneDetails(zone) }}
              >
                <Popup>
                  <strong>{zone.zoneId} · {zone.name}</strong>
                  <br />
                  {zone.potential.toUpperCase()} PROSPECTIVITY · {zone.score}% score
                  <br />
                  {zone.confidence}% geological confidence
                </Popup>
              </Circle>
            ))}
            {mapLayers.environment && filteredReserveZones.map((zone) => (
              <CircleMarker
                key={`environment-${zone.zoneId}`}
                center={zone.location}
                radius={8}
                pathOptions={{ color: "#34739c", fillColor: "#78a9c8", fillOpacity: 0.8, weight: 2 }}
                eventHandlers={{ click: () => showZoneDetails(zone) }}
              >
                <Popup>{zone.environment} · synthetic environmental layer</Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          <div className="map-legend">
            <div className="legend-title">Confidence</div>
            <div><span className="legend-dot high" />High</div>
            <div><span className="legend-dot medium" />Moderate</div>
            <div><span className="legend-dot low" />Low</div>
          </div>
        </div>
      </div>

      <div className="panel reserve-zone-panel">
        <div className="panel-header">
          <div>
            <h3>Zone Assessment</h3>
            <p>Confidence and exploration priority</p>
          </div>
        </div>

        <div className="reserve-zone-list">
          {filteredReserveZones.map((zone) => (
            <div
              className={`reserve-zone-item interactive-zone ${selectedZoneId === zone.zoneId ? "selected-zone" : ""}`}
              key={zone.zoneId}
              role="button"
              tabIndex={0}
              onClick={() => showZoneDetails(zone)}
              onKeyDown={(event) => activateOnKeyDown(event, () => showZoneDetails(zone))}
            >
              <div className="reserve-zone-heading">
                <strong>{zone.zoneId} · {zone.name}</strong>
                <span className={`reserve-zone-status ${zone.potential.toLowerCase()}`}>
                  {zone.potential.toUpperCase()} PROSPECTIVITY
                </span>
              </div>
              <div className="reserve-zone-confidence">
                <span>Geological confidence</span>
                <strong>{zone.confidence}%</strong>
              </div>
              <div className="risk-progress">
                <div style={{ width: `${zone.confidence}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="reserve-zone-note">
          Scores, coordinates and potential estimates are synthetic and not verified MOIL locations.
        </div>
      </div>
    </section>

    <div className="panel">
      <div className="panel-header">
        <div>
          <h3>Reserve Intelligence</h3>
          <p>AI interpretation of geological potential</p>
        </div>

        <Brain className="ai-header-icon" size={21} />
      </div>

      <div className="insight-content">
        <div className="insight-item">
          <Map size={20} />
          <div>
            <strong>High-Potential Zones</strong>
            <p>
              Geological indicators suggest significant manganese
              potential in identified exploration zones.
            </p>
          </div>
        </div>

        <div className="insight-item">
          <Target size={20} />
          <div>
            <strong>Exploration Priority</strong>
            <p>
              Prioritize high-confidence zones for detailed geological
              investigation and drilling.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="prototype-note">
      <ShieldCheck size={17} />
      <span>
        <strong>Prototype mode:</strong> Reserve intelligence is
        currently demonstrated using representative operational data.
      </span>
    </div>

</section>
) : activePage === "insights" ? (
    <section className="page-content ai-insights-page">

        <div className="page-title">
            <h1>AI Insights</h1>
            <p>Model-generated operational intelligence · prototype data</p>
        </div>

        <div className="insight-summary-bar" aria-label="Insight summary">
          <div className="insight-summary-item">
            <span>Signals</span>
            <strong>{insightSummary.signals}</strong>
          </div>
          <div className="insight-summary-item highlight-item">
            <span>High priority</span>
            <strong>{insightSummary.highPriority}</strong>
          </div>
          <div className="insight-summary-item">
            <span>Action required</span>
            <strong>{insightSummary.actionRequired}</strong>
          </div>
        </div>

        <div className="insights-controls">
          <div className="filter-toolbar" role="group" aria-label="Insight category filter">
            {["All", "Production", "Risk", "Equipment", "Geological", "Environmental"].map((category) => (
              <button
                className={`filter-button ${insightCategory === category ? "selected" : ""}`}
                type="button"
                key={category}
                aria-pressed={insightCategory === category}
                onClick={() => setInsightCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <label className="insight-select-filter">
            <span>Priority</span>
            <select value={insightPriority} onChange={(event) => setInsightPriority(event.target.value)}>
              <option>All</option><option>High</option><option>Medium</option><option>Low</option>
            </select>
          </label>
          <label className="insight-select-filter">
            <span>Status</span>
            <select value={insightStatus} onChange={(event) => setInsightStatus(event.target.value)}>
              <option>All</option><option>Action Required</option><option>Monitoring</option><option>Resolved</option>
            </select>
          </label>
        </div>

        <div className="insight-record-list">
          {filteredInsights.length ? filteredInsights.map((insight) => (
            <article className={`insight-record ${expandedInsights[insight.id] ? "expanded" : ""}`} key={insight.id}>
              <button
                className="insight-record-toggle"
                type="button"
                aria-expanded={Boolean(expandedInsights[insight.id])}
                onClick={() => toggleInsightExpanded(insight.id)}
              >
                <div className="insight-record-main">
                  <span className="insight-record-category">{insight.category}</span>
                  <strong>{insight.title}</strong>
                  <span className="insight-record-reason">{insight.reason}</span>
                </div>
                <div className="insight-record-state">
                  <span className={`insight-priority ${insight.priority.toLowerCase()}`}>{insight.priority}</span>
                  <span className={`insight-state ${insight.status === "Action Required" ? "action-required" : "monitoring"}`}>{insight.status}</span>
                  <ChevronRight size={16} />
                </div>
              </button>

              {expandedInsights[insight.id] && (
                <div className="insight-record-expanded">
                  <div className="insight-supporting-values">
                    {insight.indicators.map((indicator) => <span key={indicator}>{indicator}</span>)}
                  </div>
                  <div className="insight-record-meta">
                    <span><strong>Impact</strong>{insight.impact}</span>
                    <span><strong>Confidence</strong>{insight.confidence}</span>
                    <span><strong>Area</strong>{insight.area}</span>
                    <button
                      className="insight-freshness-button"
                      type="button"
                      onClick={() => showDetails(`Data freshness · ${insight.title}`, "Freshness context for the signals underlying this insight.", [
                        { label: "Timestamp / interval", value: insight.timestamp },
                        { label: "Category", value: insight.category },
                        { label: "Source mode", value: insight.category === "Geological" || insight.category === "Environmental" ? "Synthetic prototype data" : aiData?.data_mode || "Prototype" },
                      ])}
                    >
                      <strong>Freshness</strong>{insight.timestamp}
                    </button>
                  </div>
                  <div className="insight-record-actions">
                    <button type="button" onClick={() => showInsightDetails(insight)}>Why this insight?</button>
                    <button type="button" onClick={() => showDetails(`Affected area · ${insight.area}`, insight.reason, insight.indicators.map((indicator, index) => ({ label: `Signal ${index + 1}`, value: indicator })))}>Inspect affected area</button>
                    <button type="button" onClick={() => showDetails(insight.action, "Recommended next step from this model insight.", [{ label: "Priority", value: insight.priority }, { label: "Status", value: insight.status }, { label: "Affected area", value: insight.area }])}>Open recommendation</button>
                  </div>
                </div>
              )}
            </article>
          )) : (
            <div className="empty-state">No insights match these filters yet.</div>
          )}
        </div>

        <div className="kpi-grid">

            <div className="kpi-card">
                <div className="kpi-top">
                    <span>Production Risk</span>
                </div>

                <div className="kpi-value">
                    {aiData ? aiData.shortfall_risk : "—"}
                </div>

                <p className="kpi-description">
                    Model-assessed production risk
                </p>
            </div>


            <div className="kpi-card">
                <div className="kpi-top">
                    <span>Main Constraint</span>
                </div>

                <div className="kpi-value" style={{ fontSize: "18px" }}>
                    {aiData ? aiData.main_constraint : "—"}
                </div>

                <p className="kpi-description">
                    Highest operational constraint identified by the model
                </p>
            </div>

        </div>


        <div className="panel" style={{ marginTop: "22px" }}>

            <div className="panel-header">
                <div>
                    <h3>Operational Insight</h3>
                    <p>Current production intelligence generated by the model</p>
                </div>

                <div className="chart-badge">
                    MODEL STATUS
                </div>
            </div>


            <div
                style={{
                    padding: "14px",
                    fontSize: "13px",
                    lineHeight: "1.55"
                }}
            >

                {aiData ? (
                    <>
                        <p>
                            The current model predicts{" "}
                            <strong>
                                {aiData.predicted_production_tonnes.toLocaleString()} tonnes
                            </strong>{" "}
                            against a target of{" "}
                            <strong>
                                {aiData.target_production_tonnes.toLocaleString()} tonnes
                            </strong>.
                        </p>

                        <p>
                            This represents an expected shortfall of{" "}
                            <strong>
                                {aiData.expected_shortfall_tonnes.toLocaleString()} tonnes
                            </strong>{" "}
                            ({aiData.shortfall_percentage}%).
                        </p>

                        <p>
                            The primary operational constraint identified by the
                            model is{" "}
                            <strong>
                                {aiData.main_constraint}
                            </strong>.
                        </p>
                    </>
                ) : (
                    <p>Waiting for model data...</p>
                )}

            </div>

        </div>

        <div className="insights-detail-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Operational Alert</h3>
                <p>Current model risk signal</p>
              </div>
              <div className={`production-risk-status ${productionRiskTone}`}>
                <span aria-hidden="true" />
                {productionRisk ? `${productionRisk} RISK` : "No model data"}
              </div>
            </div>
            <div className="insight-alert">
              <CircleAlert size={18} />
              <p>
                {aiData
                  ? `${aiData.main_constraint} is the primary constraint associated with the ${productionRisk.toLowerCase()} production risk assessment.`
                  : "Waiting for a model assessment."}
              </p>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Recommended Actions</h3>
                <p>Model-generated operational responses</p>
              </div>
              <Brain className="ai-header-icon" size={21} />
            </div>
            <div className="recommendation-list">
              {aiData?.recommended_actions?.length ? (
                aiData.recommended_actions.map((action, index) => (
                  <div className="recommendation" key={`${action}-${index}`}>
                    <div className="recommendation-icon"><Brain size={17} /></div>
                    <div className="recommendation-content">
                      <div className="recommendation-title">{action}</div>
                      <span className="priority">Prototype recommendation</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="recommendation-title">No recommendations available yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="prototype-note">
          <ShieldCheck size={17} />
          <span><strong>Prototype output:</strong> AI insights and recommended actions are demonstration results and require operational validation.</span>
        </div>

    </section>

) : activePage === "production" ? (
  <section className="page-content">

    <div className="page-title">
      <h1>Production Intelligence</h1>
      <p>Production forecasting and operational monitoring</p>
    </div>

    <div className="overview-meta-strip production-meta-strip">
      <span><button className="meta-detail-button" type="button" onClick={() => inspectProductionMetric("freshness")}><strong>Last updated</strong> {lastUpdated}</button></span>
      <span>
        <strong>Data freshness</strong>{" "}
        <button className="meta-detail-button" type="button" onClick={() => inspectProductionMetric("freshness")}>
          {loading ? "Syncing" : apiError ? "Unavailable" : "Fresh · current cycle"}
        </button>
      </span>
      <span><strong>Forecast horizon</strong> {productionRange}</span>
      <span><strong>Data mode</strong> {aiData?.data_mode || "Prototype"}</span>
      <span><button className="meta-detail-button" type="button" onClick={() => inspectProductionMetric("confidence")}><strong>Forecast confidence</strong> 82% · prototype</button></span>
    </div>

    {/* ================= KPI CARDS ================= */}

    <section className="kpi-grid">

      {/* Production Forecast */}
      <div className="kpi-card interactive-card" role="button" tabIndex={0} onClick={() => inspectProductionMetric("forecast")} onKeyDown={(event) => activateOnKeyDown(event, () => inspectProductionMetric("forecast"))}>
        <div className="kpi-top">
<span>Predicted Production</span>

          <div className="kpi-icon blue">
            <BarChart3 size={19} />
          </div>
        </div>

        <div className="kpi-value">
          {aiData
            ? aiData.predicted_production_tonnes.toLocaleString()
            : "—"}{" "}
          <small>T</small>
        </div>

        <div
          className={`kpi-change ${
            aiData?.shortfall_risk === "HIGH"
              ? "negative"
              : aiData?.shortfall_risk === "MEDIUM"
              ? "warning"
              : ""
          }`}
        >
          {aiData
            ? `↓ ${aiData.shortfall_percentage}% below target`
            : "Calculating..."}
        </div>

        <p className="kpi-description">
          AI predicted production for next cycle
        </p>
      </div>


      {/* Target Production */}
      <div className="kpi-card interactive-card" role="button" tabIndex={0} onClick={() => inspectProductionMetric("target")} onKeyDown={(event) => activateOnKeyDown(event, () => inspectProductionMetric("target"))}>
        <div className="kpi-top">
          <span>Target Production</span>

          <div className="kpi-icon green">
            <Target size={19} />
          </div>
        </div>

        <div className="kpi-value">
          {aiData
            ? aiData.target_production_tonnes.toLocaleString()
            : "—"}{" "}
          <small>T</small>
        </div>

        <div className="kpi-change">
          Target cycle output
        </div>

        <p className="kpi-description">
          Planned production requirement
        </p>
      </div>


      {/* Production Risk */}
      <div className="kpi-card interactive-card" role="button" tabIndex={0} onClick={() => inspectProductionMetric("risk")} onKeyDown={(event) => activateOnKeyDown(event, () => inspectProductionMetric("risk"))}>
        <div className="kpi-top">
          <span>Production Risk</span>

          <div className="kpi-icon red">
            <AlertTriangle size={19} />
          </div>
        </div>

        <div className="kpi-value">
          {aiData ? aiData.shortfall_risk : "—"}
        </div>

        <div className="kpi-change">
          {aiData
            ? `${aiData.expected_shortfall_tonnes.toLocaleString()} T expected shortfall`
            : "Calculating..."}
        </div>

        <p className="kpi-description">
          Model-assessed production risk
        </p>
      </div>


      {/* Reserve Potential */}
      <div className="kpi-card interactive-card" role="button" tabIndex={0} onClick={() => inspectProductionMetric("reserve")} onKeyDown={(event) => activateOnKeyDown(event, () => inspectProductionMetric("reserve"))}>
        <div className="kpi-top">
          <span>Reserve Potential</span>

          <div className="kpi-icon green">
            <Layers size={19} />
          </div>
        </div>

        <div className="kpi-value">
          {aiData
            ? aiData.reserve_potential_percent
            : "—"}{" "}
          <small>%</small>
        </div>

        <div className="kpi-change">
          Estimated operational potential
        </div>

        <p className="kpi-description">
          Based on geological and operational factors
        </p>
      </div>

      <div className="kpi-card interactive-card" role="button" tabIndex={0} onClick={() => inspectProductionMetric("actual")} onKeyDown={(event) => activateOnKeyDown(event, () => inspectProductionMetric("actual"))}>
        <div className="kpi-top">
          <span>Current Production</span>
          <div className="kpi-icon green">
            <TrendingUp size={19} />
          </div>
        </div>
        <div className="kpi-value">
          {currentProduction !== null ? currentProduction.toLocaleString() : "—"} <small>T</small>
        </div>
        <div className="kpi-change">Latest reported actual · day 17</div>
        <p className="kpi-description">Synthetic production series for prototype review</p>
      </div>

      <div className="kpi-card interactive-card" role="button" tabIndex={0} onClick={() => inspectProductionMetric("achievement")} onKeyDown={(event) => activateOnKeyDown(event, () => inspectProductionMetric("achievement"))}>
        <div className="kpi-top">
          <span>Current Achievement</span>
          <div className="kpi-icon blue">
            <Target size={19} />
          </div>
        </div>
        <div className="kpi-value">
          {currentProduction !== null && targetProduction > 0 ? currentAchievement.toFixed(1) : "—"}<small>%</small>
        </div>
        <div className="kpi-change">Latest actual vs target</div>
        <p className="kpi-description">Based on the latest reported actual output</p>
      </div>

    </section>

    <section className="panel prediction-workbench">
      <div className="panel-header">
        <div>
          <h3>Prediction Inputs</h3>
          <p>Adjust operating assumptions and submit them to the current prediction model</p>
        </div>
        <div className="chart-badge">MODEL INPUTS</div>
      </div>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          handleRunAiAnalysis();
        }}
      >
        <div className="prediction-input-grid">
          {PREDICTION_FIELDS.map((field) => (
            <label className="prediction-input-field" key={field.name} htmlFor={`prediction-${field.name}`}>
              <span>{field.label}</span>
              <div className="prediction-input-control">
                <input
                  id={`prediction-${field.name}`}
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={predictionInputs[field.name]}
                  aria-invalid={Boolean(predictionValidationError)}
                  onChange={(event) => updatePredictionInput(field.name, event.target.value)}
                />
                <small>{field.unit}</small>
              </div>
            </label>
          ))}
        </div>

        <div className="prediction-submit-row">
          <span className="prediction-data-note">Prototype inputs · values are sent to the configured model.</span>
          <button
            className="prediction-run-button"
            type="submit"
            disabled={analysisLoading || loading}
            aria-busy={analysisLoading}
          >
            <Brain size={16} />
            {analysisLoading ? "Running analysis..." : "Run Analysis"}
          </button>
        </div>

        {predictionValidationError && (
          <p className="prediction-error" role="alert">{predictionValidationError}</p>
        )}
        {analysisStatus && (
          <p className={`prediction-status ${analysisStatus.type}`} role="status">
            {analysisStatus.type === "error"
              ? `Analysis failed: ${apiError || analysisStatus.message}`
              : analysisStatus.message}
          </p>
        )}
      </form>
    </section>


    {/* ================= OPERATIONAL INSIGHT ================= */}

    {aiData && (
      <div className="panel" style={{ marginBottom: "20px" }}>

        <div className="panel-header">

          <div>
            <h3>Operational Insight</h3>
            <p>Current production constraint identified by the model</p>
          </div>

          <div className="chart-badge">
            MODEL STATUS
          </div>

        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            padding: "10px 0"
          }}
        >

          <div>
            <span
              style={{
                fontSize: "12px",
                color: "#7b8794"
              }}
            >
              MAIN CONSTRAINT
            </span>

            <h3 style={{ marginTop: "8px" }}>
              {aiData.main_constraint}
            </h3>
          </div>


          <div>
            <span
              style={{
                fontSize: "12px",
                color: "#7b8794"
              }}
            >
              RECOMMENDED ACTION
            </span>

            <p style={{ marginTop: "8px" }}>
              {aiData.recommended_actions?.[0] ||
                "Continue monitoring production conditions."}
            </p>
          </div>

        </div>

      </div>
    )}


    {/* ================= PRODUCTION CHART ================= */}

    <div className="panel chart-panel">

      <div className="panel-header">

        <div>
          <h3>Production Forecast</h3>
          <p>{productionRange} view · target, actual and model forecast · tonnes</p>
        </div>

        <div className="production-chart-controls">
          <button
            className={`production-risk-status ${productionRiskTone}`}
            type="button"
            onClick={() => inspectProductionMetric("risk")}
          >
            <span aria-hidden="true" />
            {productionRisk ? `${productionRisk} RISK` : "Awaiting model"}
          </button>
          <label className="chart-range-control">
            <span>Forecast horizon</span>
            <select
              className="chart-range-select"
              aria-label="Production page forecast horizon"
              value={productionRange}
              onChange={(event) => setProductionRange(event.target.value)}
            >
              <option value="7D">7D</option>
              <option value="30D">30D</option>
              <option value="90D" disabled>90D · no history</option>
            </select>
          </label>
          <button
            className="panel-action"
            type="button"
            onClick={handleRunAiAnalysis}
            disabled={analysisLoading || loading}
            aria-busy={analysisLoading}
          >
            {analysisLoading ? "Refreshing..." : "Refresh Forecast"}
          </button>
        </div>

      </div>


      <div className="chart-container">

        <ResponsiveContainer width="100%" height={280}>

          <AreaChart data={productionPageChartData} onClick={inspectProductionChartPoint}>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e8ecef"
            />


            <XAxis
              dataKey="day"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Day of cycle", position: "insideBottom", offset: -5, style: { fill: "#7b8780", fontSize: 11 } }}
            />


            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={45}
              label={{ value: "Tonnes", angle: -90, position: "insideLeft", style: { fill: "#7b8780", fontSize: 11 } }}
            />


            <Tooltip formatter={(value, name) => [`${Number(value).toLocaleString()} t`, name]} />


            {/* TARGET */}
            {chartSeriesVisibility.target && (
              <Area
                type="monotone"
                dataKey="target"
                stroke="#8b949e"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="transparent"
                dot={createProductionPointDot("Target", "#8b949e")}
                activeDot={{ r: 5 }}
              />
            )}


            {/* ACTUAL */}
            {chartSeriesVisibility.actual && (
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#168f5b"
                strokeWidth={2}
                fill="transparent"
                connectNulls={false}
                dot={createProductionPointDot("Actual", "#168f5b")}
                activeDot={{ r: 5 }}
              />
            )}


            {/* MODEL FORECAST */}
            {chartSeriesVisibility.forecast && (
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="#d99522"
                strokeWidth={2}
                strokeDasharray="6 4"
                fill="transparent"
                connectNulls={true}
                dot={createProductionPointDot("Forecast", "#d99522")}
                activeDot={{ r: 5 }}
              />
            )}
          </AreaChart>

        </ResponsiveContainer>

      </div>

      {!Object.values(chartSeriesVisibility).some(Boolean) && (
        <div className="chart-empty-state">All production series are hidden. Select a legend item to restore a series.</div>
      )}


      {/* CHART LEGEND */}

      <div className="chart-legend">
        <button className="chart-legend-toggle" type="button" aria-pressed={chartSeriesVisibility.target} onClick={() => toggleChartSeries("target")}><i className="legend-line target" />Target</button>
        <button className="chart-legend-toggle" type="button" aria-pressed={chartSeriesVisibility.actual} onClick={() => toggleChartSeries("actual")}><i className="legend-line actual" />Actual</button>
        <button className="chart-legend-toggle" type="button" aria-pressed={chartSeriesVisibility.forecast} onClick={() => toggleChartSeries("forecast")}><i className="legend-line forecast" />Forecast</button>
      </div>

    </div>


    {/* ================= MODEL INFORMATION ================= */}

    {aiData && (
      <div
        className="panel"
        style={{
          marginTop: "20px",
          fontSize: "13px",
          color: "#7b8794"
        }}
      >
        <strong style={{ color: "#25313c" }}>
          Model:
        </strong>{" "}
        {aiData.model}
        {" • "}
        <strong style={{ color: "#25313c" }}>
          Data:
        </strong>{" "}
        {aiData.data_mode}
      </div>
    )}

    </section>

) : activePage === "risk" ? (

  <section className="page-content">

    <div className="page-title">
      <h1>Risk Analysis</h1>
      <p>Production risk assessment and operational constraints</p>
    </div>

    {/* RISK SUMMARY */}
    <section className="kpi-grid">

      {/* Overall Risk */}
      <div className="kpi-card interactive-card" role="button" tabIndex={0} onClick={() => showDetails("Overall Production Risk", "Risk class and shortfall are returned by the current prediction model.", [{ label: "Risk level", value: aiData?.shortfall_risk || "—" }, { label: "Shortfall", value: aiData ? `${aiData.expected_shortfall_tonnes.toLocaleString()} T` : "—" }, { label: "Below target", value: aiData ? `${aiData.shortfall_percentage}%` : "—" }, { label: "Main constraint", value: aiData?.main_constraint || "—" }])} onKeyDown={(event) => activateOnKeyDown(event, () => showDetails("Overall Production Risk", "Risk class and shortfall are returned by the current prediction model.", [{ label: "Risk level", value: aiData?.shortfall_risk || "—" }, { label: "Shortfall", value: aiData ? `${aiData.expected_shortfall_tonnes.toLocaleString()} T` : "—" }, { label: "Below target", value: aiData ? `${aiData.shortfall_percentage}%` : "—" }, { label: "Main constraint", value: aiData?.main_constraint || "—" }]))}>
        <div className="kpi-top">
          <span>Production Risk</span>
          <div className="kpi-icon">
            !
          </div>
        </div>

        <div
          className="kpi-value"
          style={{
            color:
              aiData?.shortfall_risk === "HIGH"
                ? "#d64545"
                : aiData?.shortfall_risk === "MEDIUM"
                ? "#e09a22"
                : "#168f5b"
          }}
        >
          {aiData?.shortfall_risk || "—"}
        </div>

        <div className="kpi-change negative">
          Model-assessed production risk
        </div>

        <p className="kpi-description">
          Based on predicted production shortfall
        </p>
      </div>


      {/* Expected Shortfall */}
      <div className="kpi-card">
        <div className="kpi-top">
          <span>Expected Shortfall</span>
          <div className="kpi-icon blue">
            ↓
          </div>
        </div>

        <div className="kpi-value">
          {aiData
            ? aiData.expected_shortfall_tonnes.toLocaleString()
            : "—"}{" "}
          <small>T</small>
        </div>

        <div className="kpi-change negative">
          {aiData?.shortfall_percentage ?? "—"}% below target
        </div>

        <p className="kpi-description">
          Estimated production gap for next cycle
        </p>
      </div>


      {/* Main Constraint */}
      <div className="kpi-card">
        <div className="kpi-top">
          <span>Main Constraint</span>
          <div className="kpi-icon green">
            !
          </div>
        </div>

        <div
          className="kpi-value"
          style={{
            fontSize: "18px",
            lineHeight: "1.2"
          }}
        >
          {aiData?.main_constraint || "—"}
        </div>

        <div className="kpi-change">
          Primary operational constraint
        </div>

        <p className="kpi-description">
          Factor with the highest operational impact
        </p>
      </div>


      {/* Reserve Potential */}
      <div className="kpi-card">
        <div className="kpi-top">
          <span>Reserve Potential</span>
          <div className="kpi-icon green">
            %
          </div>
        </div>

        <div className="kpi-value">
          {aiData?.reserve_potential_percent ?? "—"}
          <small>%</small>
        </div>

        <div className="kpi-change">
          Estimated operational potential
        </div>

        <p className="kpi-description">
          Based on geological and operational factors
        </p>
      </div>

    </section>

    <div className="panel" style={{ marginTop: "20px" }}>
      <div className="panel-header">
        <div>
          <h3>Contributing Risk Factors</h3>
          <p>Representative factor profile used for the prototype assessment</p>
        </div>
        <div className={`production-risk-status ${productionRiskTone}`}>
          <span aria-hidden="true" />
          {productionRisk ? `${productionRisk} RISK` : "Awaiting analysis"}
        </div>
      </div>

      <div className="filter-toolbar" role="group" aria-label="Risk category filter">
        {["All Risks", "Production", "Equipment", "Environment", "Workforce"].map((filter) => (
          <button
            className={`filter-button ${riskFilter === filter ? "selected" : ""}`}
            type="button"
            key={filter}
            aria-pressed={riskFilter === filter}
            onClick={() => setRiskFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="risk-list">
        {filteredRisks.map((risk) => {
          const Icon = risk.icon;
          return (
            <button
              className={`risk-row interactive-row ${selectedRiskName === risk.name ? "selected-risk" : ""}`}
              type="button"
              key={risk.name}
              aria-pressed={selectedRiskName === risk.name}
              onClick={() => showRiskDetails(risk)}
            >
              <div className="risk-icon"><Icon size={17} /></div>
              <div className="risk-info">
                <div className="risk-name">{risk.name}</div>
                <div className="risk-progress">
                  <div style={{ width: `${risk.value}%` }} />
                </div>
              </div>
              <div className="risk-row-context">
                <span className="risk-trend">{risk.trend}</span>
                <span className={`risk-factor-status ${risk.status.toLowerCase()}`}>{risk.status}</span>
              </div>
              <div className="risk-value">{risk.value}%</div>
            </button>
          );
        })}
        {!filteredRisks.length && <p className="empty-state">No risk factors match this filter.</p>}
      </div>
    </div>

    <div className="panel risk-trend-panel">
      <div className="panel-header">
        <div>
          <h3>Risk Trend</h3>
          <p>Synthetic factor contribution trend · percentage</p>
        </div>
        <label className="chart-range-control">
          <span>Window</span>
          <select className="chart-range-select" aria-label="Risk trend timeframe" value={riskRange} onChange={(event) => setRiskRange(event.target.value)}>
            <option value="7D">7D</option>
            <option value="30D">30D</option>
            <option value="90D">90D</option>
          </select>
        </label>
      </div>
      <div className="chart-container risk-trend-chart">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={visibleRiskTrendData}
            onClick={(chartState) => {
              if (!chartState?.activeLabel) return;
              const point = visibleRiskTrendData.find((entry) => entry.period === chartState.activeLabel);
              if (point) showDetails(`Risk trend · ${point.period}`, "Synthetic weekly risk contributions for the prototype.", [
                { label: "Equipment", value: `${point.equipment}%` },
                { label: "Environment", value: `${point.environment}%` },
                { label: "Production", value: `${point.production}%` },
                { label: "Workforce", value: `${point.workforce}%` },
              ]);
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8ecef" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip formatter={(value, name) => [`${value}%`, name]} />
            {filteredRisks.map((risk) => {
              const key = risk.category.toLowerCase();
              const color = risk.category === "Equipment" ? "#168f5b" : risk.category === "Environment" ? "#d69b22" : risk.category === "Production" ? "#34739c" : "#8b949e";
              return <Area key={risk.name} type="monotone" dataKey={key} name={risk.name} stroke={color} fill="none" strokeWidth={2} dot={{ r: 3 }} />;
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        {filteredRisks.map((risk) => <span key={risk.name}>{risk.name}</span>)}
      </div>
    </div>


    {/* RISK DETAILS */}
    <div
      className="panel"
      style={{
        marginTop: "24px",
        padding: "14px"
      }}
    >

      <div className="panel-header">
        <div>
          <h3>Risk Assessment</h3>
          <p>Model assessment of current production conditions</p>
        </div>

        <div
          className="chart-badge"
          style={{
            color:
              aiData?.shortfall_risk === "HIGH"
                ? "#d64545"
                : aiData?.shortfall_risk === "MEDIUM"
                ? "#e09a22"
                : "#168f5b"
          }}
        >
          {aiData?.shortfall_risk || "—"} RISK
        </div>
      </div>


      {/* Risk explanation */}
      <div
        style={{
          marginTop: "24px",
          padding: "12px",
          borderRadius: "4px",
          background: "#f7f9f8",
          border: "1px solid #e5ebe8"
        }}
      >

        <h4 style={{ marginBottom: "10px" }}>
          Operational Assessment
        </h4>

        <p style={{ margin: 0, lineHeight: "1.6" }}>
          The current model predicts{" "}
          <strong>
            {aiData
              ? aiData.predicted_production_tonnes.toLocaleString()
              : "—"}{" "}
            tonnes
          </strong>{" "}
          against a target of{" "}
          <strong>
            {aiData
              ? aiData.target_production_tonnes.toLocaleString()
              : "—"}{" "}
            tonnes
          </strong>
          , resulting in an expected shortfall of{" "}
          <strong>
  {aiData
    ? aiData.expected_shortfall_tonnes.toLocaleString()
    : "—"}{" "}
  tonnes
</strong>
.
</p>

      </div>


      {/* Constraint + Equipment */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "18px",
          marginTop: "20px"
        }}
      >

        <div
          style={{
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #e5ebe8"
          }}
        >
          <span style={{ color: "#718096", fontSize: "13px" }}>
            Primary Constraint
          </span>

          <h3 style={{ marginTop: "8px" }}>
            {aiData?.main_constraint || "—"}
          </h3>

          <p style={{ color: "#718096", marginBottom: 0 }}>
            Highest contributing operational constraint identified by
            the model.
          </p>
        </div>


        <div
          style={{
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #e5ebe8"
          }}
        >
          <span style={{ color: "#718096", fontSize: "13px" }}>
            Equipment Availability
          </span>

          <h3 style={{ marginTop: "8px" }}>
            {aiData?.equipment_availability ?? "—"}%
          </h3>

          <p style={{ color: "#718096", marginBottom: 0 }}>
            Equipment availability supplied as a model input.
          </p>
        </div>

      </div>

    </div>


    {/* RECOMMENDED ACTIONS */}
    <div
      className="panel"
      style={{
        marginTop: "24px",
        padding: "14px"
      }}
    >

      <div className="panel-header">
        <div>
          <h3>Recommended Actions</h3>
          <p>Suggested operational responses based on current conditions</p>
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>

        {aiData?.recommended_actions?.map((action, index) => (

          <button
            type="button"
            className="risk-mitigation-action"
            key={index}
            onClick={() => showDetails(action, "Prototype mitigation based on the current model result.", [
              { label: "Primary constraint", value: aiData.main_constraint || "—" },
              { label: "Risk level", value: aiData.shortfall_risk || "—" },
              { label: "Mitigation status", value: "Proposed · not dispatched" },
            ])}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              padding: "16px",
              marginBottom: "12px",
              borderRadius: "4px",
              background: "#f7f9f8",
              border: "1px solid #e5ebe8"
            }}
          >

            <div
              style={{
                minWidth: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#168f5b",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "600"
              }}
            >
              {index + 1}
            </div>

            <span style={{ lineHeight: "1.5" }}>
              {action}
            </span>

          </button>

        ))}

      </div>

    </div>

  </section>
) : activePage === "data" ? (
  <section className="page-content">

    <div className="page-title">
      <h1>Data Sources</h1>
      <p>
        Data infrastructure supporting production and reserve intelligence
      </p>
    </div>

    <section className="kpi-grid">

      <div className="kpi-card">
        <div className="kpi-top">
          <span>Current Data Mode</span>
          <div className="kpi-icon green">
            <Layers3 size={19} />
          </div>
        </div>

        <div className="kpi-value" style={{ fontSize: "18px" }}>
          Synthetic
        </div>

        <p className="kpi-description">
          Demonstration data currently used by the prototype
        </p>
      </div>


      <div className="kpi-card">
        <div className="kpi-top">
          <span>Forecast Model</span>
          <div className="kpi-icon blue">
            <Brain size={19} />
          </div>
        </div>

        <div className="kpi-value" style={{ fontSize: "18px" }}>
          ML Regression
        </div>

        <p className="kpi-description">
          Multivariate Linear Regression
        </p>
      </div>

    </section>


    <div className="panel source-status-panel">
      <div className="panel-header">
        <div>
          <h3>Source Connectivity</h3>
          <p>Current integration status for operational data domains</p>
        </div>
      </div>
      <div className="source-status-grid">
        {dataSources.map((source) => {
          const isProductionSource = source.name === "Production Data";
          const liveStatus = isProductionSource
            ? apiError ? "Unavailable" : loading ? "Connecting" : "Connected"
            : source.status;
          const statusClass = liveStatus.toLowerCase().replaceAll(" ", "-");

          return (
            <div className="source-status-row" key={source.name}>
              <button className="source-detail-trigger" type="button" onClick={() => showSourceDetails(source)}>
                <strong>{source.name}</strong>
                <small>{source.coverage} · {source.connection}</small>
              </button>
              <span className={`source-status ${statusClass}`}>{liveStatus}</span>
              {isProductionSource && (
                <button
                  className="source-refresh-button"
                  type="button"
                  disabled={analysisLoading || loading}
                  onClick={handleRunAiAnalysis}
                >
                  {analysisLoading ? "Syncing" : "Refresh"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>

    <div className="panel">

      <div className="panel-header">
        <div>
          <h3>Prototype Data Inputs</h3>
          <p>
            Operational variables currently supplied to the prediction model
          </p>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "16px",
        marginTop: "20px"
      }}>

        <div className="insight-card">
          <strong>Equipment Downtime</strong>
          <p>Equipment operational downtime percentage</p>
        </div>

        <div className="insight-card">
          <strong>Rainfall Impact</strong>
          <p>Weather-related operational impact</p>
        </div>

        <div className="insight-card">
          <strong>Equipment Availability</strong>
          <p>Percentage of available mining equipment</p>
        </div>

        <div className="insight-card">
          <strong>Geological Confidence</strong>
          <p>Confidence associated with geological conditions</p>
        </div>

        <div className="insight-card">
          <strong>Workforce Availability</strong>
          <p>Available workforce percentage</p>
        </div>

        <div className="insight-card">
          <strong>Target Production</strong>
          <p>Planned production requirement for the cycle</p>
        </div>

      </div>

    </div>


    <div className="panel">

      <div className="panel-header">
        <div>
          <h3>Future Data Integration</h3>
          <p>
            Planned sources for deployment-ready intelligence
          </p>
        </div>
      </div>

      <div className="insight-card" style={{ marginTop: "20px" }}>
        <strong>MOIL Operational Data</strong>
        <p>
          Production, equipment and workforce records from operational
          systems.
        </p>
      </div>

      <div className="insight-card">
        <strong>Geological & Exploration Data</strong>
        <p>
          Geological surveys, exploration information and reserve-related
          datasets.
        </p>
      </div>

      <div className="insight-card">
        <strong>Satellite & Environmental Data</strong>
        <p>
          Remote sensing and environmental observations for operational
          monitoring.
        </p>
      </div>

    </div>

  </section>
  ) : activePage === "reports" ? (
    <section className="page-content">
      <div className="page-title">
        <h1>Reports</h1>
        <p>Operational report catalogue and document management</p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Report Catalogue</h3>
            <p>Current operational reports, summaries and exports</p>
          </div>
          <button className="panel-action" type="button">Generate Report</button>
        </div>

        <div className="settings-control-grid" style={{ marginTop: 12 }}>
          <label className="settings-field" htmlFor="report-type">
            <span>Report type</span>
            <select id="report-type" value={reportType} onChange={(event) => setReportType(event.target.value)}>
              <option>Production Summary</option>
              <option>Risk Review</option>
              <option>Reserve Snapshot</option>
            </select>
          </label>
          <label className="settings-field" htmlFor="report-status">
            <span>Report status</span>
            <select id="report-status" value={reportStatus} onChange={(event) => setReportStatus(event.target.value)}>
              <option>All</option>
              <option>Ready</option>
              <option>Draft</option>
              <option>Validated</option>
            </select>
          </label>
        </div>

        <div className="source-status-grid" style={{ marginTop: 12 }}>
          {[
            { name: "Production Summary", type: "Operations", period: "30 Sep 2026", owner: "Operations", status: "Ready", created: "12:45 IST" },
            { name: "Risk Review", type: "Safety", period: "Q4 Cycle", owner: "Risk Analyst", status: "Draft", created: "11:10 IST" },
            { name: "Reserve Snapshot", type: "Geology", period: "30D", owner: "Geology", status: "Validated", created: "08:30 IST" },
          ].filter((report) => (reportStatus === "All" ? true : report.status === reportStatus)).map((report) => (
            <div className="source-status-row" key={report.name}>
              <button className="source-detail-trigger" type="button" onClick={() => setSelectedReport(report.name)}>
                <strong>{report.name}</strong>
                <small>{report.type} · {report.period}</small>
              </button>
              <span className="source-status connected">{report.status}</span>
              <span className="source-status connected" style={{ background: "#f3f4f5", color: "#4d5350" }}>{report.owner}</span>
              <button className="source-refresh-button" type="button">View</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  ) : activePage === "equipment" ? (
    <section className="page-content">
      <div className="page-title">
        <h1>Equipment</h1>
        <p>Equipment availability, maintenance status and site-specific fleet context</p>
      </div>

      <div className="settings-control-grid" style={{ marginBottom: 18 }}>
        <label className="settings-field" htmlFor="equipment-mine">
          <span>Mine</span>
          <select id="equipment-mine" value={equipmentMine} onChange={(event) => setEquipmentMine(event.target.value)}>
            <option>Balaghat</option>
            <option>Chandrapur</option>
            <option>Jaipur</option>
          </select>
        </label>
        <label className="settings-field" htmlFor="equipment-status">
          <span>Status</span>
          <select id="equipment-status" value={equipmentStatus} onChange={(event) => setEquipmentStatus(event.target.value)}>
            <option>All</option>
            <option>Available</option>
            <option>Maintenance</option>
            <option>Standby</option>
          </select>
        </label>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Fleet Overview</h3>
            <p>{equipmentMine} · equipment operating profile</p>
          </div>
          <div className="chart-badge">{selectedEquipment}</div>
        </div>

        <div className="source-status-grid">
          {[
            { name: "Fleet 1", status: "Available", availability: "92%" },
            { name: "Fleet 2", status: "Maintenance", availability: "67%" },
            { name: "Fleet 3", status: "Standby", availability: "81%" },
            { name: "Fleet 4", status: "Available", availability: "84%" },
          ].filter((item) => (equipmentStatus === "All" ? true : item.status === equipmentStatus)).map((item) => (
            <button key={item.name} type="button" className="source-status-row source-detail-trigger" onClick={() => setSelectedEquipment(item.name)}>
              <strong>{item.name}</strong>
              <small>{item.status} · {item.availability}</small>
              <span className="source-status connected">{item.availability}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  ) : activePage === "environment" ? (
    <section className="page-content">
      <div className="page-title">
        <h1>Environmental Intelligence</h1>
        <p>Weather, vegetation and surface indicators for operating context</p>
      </div>

      <div className="environment-source-strip">
        <span className="source-status prototype">PROTOTYPE / SYNTHETIC</span>
        <span>Satellite and live environmental feeds are not connected.</span>
        <span className="environment-freshness">Sample freshness · 8 min</span>
      </div>

      <div className="environment-grid">
        {environmentalIndicators.map((indicator) => {
          const Icon = indicator.icon;
          return (
            <button
              className="panel environment-card"
              type="button"
              key={indicator.name}
              onClick={() => showDetails(indicator.name, `${indicator.source}. Synthetic demonstration values; not a live remote-sensing observation.`, [
                { label: "Current value", value: `${indicator.value} · ${indicator.unit}` },
                { label: "Trend", value: indicator.trend },
                { label: "Status", value: indicator.status },
                { label: "Data freshness", value: indicator.freshness },
                { label: "Source", value: indicator.source },
              ])}
            >
              <div className="environment-card-heading">
                <span className="environment-icon"><Icon size={18} /></span>
                <span className={`environment-status ${indicator.status.toLowerCase()}`}>{indicator.status}</span>
              </div>
              <span className="environment-label">{indicator.name}</span>
              <strong className="environment-value">{indicator.value}</strong>
              <span className="environment-unit">{indicator.unit}</span>
              <span className="environment-trend">{indicator.trend}</span>
              <span className="environment-source">{indicator.source} · {indicator.freshness}</span>
            </button>
          );
        })}
      </div>

      <div className="panel environment-context-panel">
        <div className="panel-header">
          <div>
            <h3>Operating Context</h3>
            <p>Environmental indicators are prototype context only and are not submitted as a satellite feed.</p>
          </div>
          <div className="chart-badge">NO LIVE FEED</div>
        </div>
        <p className="environment-context-copy">
          This synthetic rainfall-impact assumption can be copied into Prediction Inputs for review. Prospectivity-zone environmental notes are also synthetic and require field validation.
        </p>
        <button
          className="panel-action environment-use-action"
          type="button"
          onClick={() => {
            const rainfall = environmentalIndicators.find((indicator) => indicator.name === "Rainfall impact");
            updatePredictionInput("rainfall", String(Number.parseFloat(rainfall?.value ?? "0")));
            setActivePage("production");
          }}
        >
          Use rainfall assumption in prediction <ChevronRight size={14} />
        </button>
      </div>
    </section>
  ) : activePage === "settings" ? (
  <>
  <section className="page-content settings-page">
    <div className="page-title">
      <h1>Settings</h1>
      <p>Application preferences and prototype system configuration</p>
    </div>

    <div className="settings-prototype-strip">
      <div>
        <strong>Prototype Mode</strong>
        <span>Synthetic operational and environmental data is active</span>
      </div>
      <span className="source-status prototype">ACTIVE</span>
    </div>

    <form className="settings-console" onSubmit={applySettings}>
      <section className="settings-group" id="settings-general">
        <div className="settings-group-heading">
          <h2>General</h2>
          <p>Workspace identity and regional defaults</p>
        </div>
        <div className="settings-control-grid">
          <label className="settings-field" htmlFor="settings-system-name">
            <span>System name</span>
            <input id="settings-system-name" value={settings.systemName} onChange={(event) => updateSetting("systemName", event.target.value)} />
          </label>
          <label className="settings-field" htmlFor="settings-environment">
            <span>Environment</span>
            <select id="settings-environment" value={settings.environment} onChange={(event) => updateSetting("environment", event.target.value)}>
              <option>Prototype</option>
              <option>Staging</option>
            </select>
          </label>
          <label className="settings-field" htmlFor="settings-timezone">
            <span>Time zone</span>
            <select id="settings-timezone" value={settings.timeZone} onChange={(event) => updateSetting("timeZone", event.target.value)}>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
          <label className="settings-field" htmlFor="settings-dashboard">
            <span>Default dashboard</span>
            <select id="settings-dashboard" value={settings.defaultDashboard} onChange={(event) => updateSetting("defaultDashboard", event.target.value)}>
              <option value="overview">Operational Overview</option>
              <option value="production">Production Intelligence</option>
              <option value="risk">Risk Analysis</option>
            </select>
          </label>
        </div>
      </section>

      <section className="settings-group" id="settings-model">
        <div className="settings-group-heading">
          <h2>AI / Model</h2>
          <p>Current prediction model configuration</p>
        </div>
        <div className="settings-control-grid">
          <div className="settings-readonly"><span>Model name</span><strong>{aiData?.model || "Multivariate Linear Regression"}</strong></div>
          <div className="settings-readonly"><span>Model version</span><strong>v1.0 · prototype</strong></div>
          <label className="settings-field" htmlFor="settings-horizon">
            <span>Forecast horizon</span>
            <select id="settings-horizon" value={settings.forecastHorizon} onChange={(event) => updateSetting("forecastHorizon", event.target.value)}>
              <option value="7D">7 days</option>
              <option value="30D">30 days</option>
              <option value="90D" disabled>90 days · history unavailable</option>
            </select>
          </label>
          <label className="settings-field" htmlFor="settings-confidence">
            <span>Confidence threshold · {settings.confidenceThreshold}%</span>
            <input id="settings-confidence" type="range" min="50" max="100" step="1" value={settings.confidenceThreshold} onChange={(event) => updateSetting("confidenceThreshold", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="settings-group" id="settings-data">
        <div className="settings-group-heading">
          <h2>Data</h2>
          <p>Refresh preference and source availability</p>
        </div>
        <div className="settings-control-grid">
          <div className="settings-readonly"><span>Data mode</span><strong>{aiData?.data_mode || "Synthetic demonstration data"}</strong></div>
          <label className="settings-field" htmlFor="settings-refresh">
            <span>Data refresh interval</span>
            <select id="settings-refresh" value={settings.refreshInterval} onChange={(event) => updateSetting("refreshInterval", event.target.value)}>
              <option value="5">Every 5 minutes</option>
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes</option>
            </select>
          </label>
          <div className="settings-readonly"><span>Data freshness</span><strong>{apiError ? "Unavailable" : loading ? "Checking" : "Current · prototype"}</strong></div>
          <div className="settings-readonly"><span>Environmental source</span><strong><span className="source-status pending">Pending connection</span></strong></div>
        </div>
      </section>

      <section className="settings-group" id="settings-notifications">
        <div className="settings-group-heading">
          <h2>Notifications</h2>
          <p>Local notification preferences for this prototype</p>
        </div>
        <div className="settings-toggle-grid">
          <label className="settings-option"><span><strong>Risk alerts</strong><small>Flag high or changing production risk</small></span><input type="checkbox" checked={settings.riskAlerts} onChange={(event) => updateSetting("riskAlerts", event.target.checked)} /></label>
          <label className="settings-option"><span><strong>Production alerts</strong><small>Flag forecast and target variance</small></span><input type="checkbox" checked={settings.productionAlerts} onChange={(event) => updateSetting("productionAlerts", event.target.checked)} /></label>
          <label className="settings-option"><span><strong>Data quality alerts</strong><small>Flag stale or unavailable source data</small></span><input type="checkbox" checked={settings.dataQualityAlerts} onChange={(event) => updateSetting("dataQualityAlerts", event.target.checked)} /></label>
          <label className="settings-option"><span><strong>Email notifications</strong><small>Email delivery is not configured</small></span><input type="checkbox" checked={settings.emailNotifications} onChange={(event) => updateSetting("emailNotifications", event.target.checked)} /></label>
          <label className="settings-option"><span><strong>In-app notifications</strong><small>Show alerts in the dashboard</small></span><input type="checkbox" checked={settings.inAppNotifications} onChange={(event) => updateSetting("inAppNotifications", event.target.checked)} /></label>
        </div>
      </section>

      <section className="settings-group" id="settings-display">
        <div className="settings-group-heading">
          <h2>Display</h2>
          <p>Dashboard presentation preferences</p>
        </div>
        <div className="settings-control-grid">
          <label className="settings-field" htmlFor="settings-density">
            <span>Density</span>
            <select id="settings-density" value={settings.density} onChange={(event) => updateSetting("density", event.target.value)}><option value="compact">Compact</option><option value="comfortable">Comfortable</option></select>
          </label>
          <label className="settings-field" htmlFor="settings-units">
            <span>Units</span>
            <select id="settings-units" value={settings.units} onChange={(event) => updateSetting("units", event.target.value)}><option value="metric">Metric · tonnes</option><option value="imperial">Imperial · short tons</option></select>
          </label>
          <label className="settings-field" htmlFor="settings-date-format">
            <span>Date format</span>
            <select id="settings-date-format" value={settings.dateFormat} onChange={(event) => updateSetting("dateFormat", event.target.value)}><option>DD MMM YYYY</option><option>YYYY-MM-DD</option></select>
          </label>
          <label className="settings-option"><span><strong>Dashboard refresh</strong><small>Refresh data only when requested</small></span><input type="checkbox" checked={settings.dashboardRefresh} onChange={(event) => updateSetting("dashboardRefresh", event.target.checked)} /></label>
        </div>
      </section>

      <section className="settings-group" id="settings-system">
        <div className="settings-group-heading">
          <h2>System</h2>
          <p>Service status and build metadata</p>
        </div>
        <div className="settings-status-grid">
          <div className="settings-status-item"><span>API status</span><strong className={apiError ? "status-error" : "status-ok"}>{apiError ? "Unavailable" : aiData ? "Connected" : "Checking"}</strong></div>
          <div className="settings-status-item"><span>Backend status</span><strong className={apiError ? "status-error" : "status-ok"}>{apiError ? "Offline" : aiData ? "Online" : "Checking"}</strong></div>
          <div className="settings-status-item"><span>Frontend version</span><strong>Prototype build</strong></div>
          <div className="settings-status-item"><span>Last synchronization</span><strong>{lastUpdated}</strong></div>
        </div>
      </section>

      <div className="settings-apply-row">
        <span role="status">{settingsApplied ? "Preferences applied for this session." : "Settings are held locally and are not persisted to the backend."}</span>
        <button className="prediction-run-button" type="submit">Apply settings</button>
      </div>
    </form>
  </section>

  <section className="page-content" hidden>

    <div className="page-title">
      <h1>System Configuration</h1>
    </div>


    {/* SYSTEM STATUS */}

    <section className="kpi-grid">

      <div className="kpi-card">

        <div className="kpi-top">
          <span>System Status</span>

          <div className="kpi-icon green">
            ●
          </div>
        </div>

        <div
          className="kpi-value"
          style={{ fontSize: "20px" }}
        >
          Online
        </div>

        <div className="kpi-change">
          Model services operational
        </div>

        <p className="kpi-description">
          Backend and intelligence services are currently available
        </p>

      </div>


      <div className="kpi-card">

        <div className="kpi-top">
          <span>Environment</span>

          <div className="kpi-icon blue">
            ●
          </div>
        </div>

        <div
          className="kpi-value"
          style={{ fontSize: "20px" }}
        >
          Prototype
        </div>

        <div className="kpi-change">
          Demonstration environment
        </div>

        <p className="kpi-description">
          Current deployment is configured for prototype evaluation
        </p>

      </div>

    </section>


    {/* AI CONFIGURATION */}

    <div className="panel">

      <div className="panel-header">

        <div>
          <h3>Forecast Model Configuration</h3>

          <p>
            Current machine-learning configuration
          </p>
        </div>

        <div className="chart-badge">
          ACTIVE
        </div>

      </div>


      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "16px",
          marginTop: "20px"
        }}
      >

        <div
          style={{
            padding: "14px",
            border: "1px solid #e5e9e7",
            borderRadius: "4px",
            background: "#fafcfb"
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#7a8790",
              marginBottom: "8px"
            }}
          >
            MODEL
          </div>

          <strong
            style={{
              fontSize: "15px",
              color: "#16251f"
            }}
          >
            Multivariate Linear Regression
          </strong>

          <p
            style={{
              marginTop: "8px",
              color: "#7a8790"
            }}
          >
            Production forecasting and operational risk analysis
          </p>
        </div>


        <div
          style={{
            padding: "14px",
            border: "1px solid #e5e9e7",
            borderRadius: "4px",
            background: "#fafcfb"
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#7a8790",
              marginBottom: "8px"
            }}
          >
            DATA MODE
          </div>

          <strong
            style={{
              fontSize: "15px",
              color: "#16251f"
            }}
          >
            Synthetic Demonstration Data
          </strong>

          <p
            style={{
              marginTop: "8px",
              color: "#7a8790"
            }}
          >
            Synthetic prototype values supplied to the forecast model
          </p>
        </div>

      </div>

    </div>


    <div className="panel settings-preferences">
      <div className="panel-header">
        <div>
          <h3>Operations Preferences</h3>
          <p>Local prototype settings for this dashboard session</p>
        </div>
      </div>

      <div className="settings-preferences-grid">
        <label className="settings-field" htmlFor="refresh-interval">
          <span>Data refresh interval</span>
          <select
            id="refresh-interval"
            value={settings.refreshInterval}
            onChange={(event) => updateSetting("refreshInterval", event.target.value)}
          >
            <option value="5">Every 5 minutes</option>
            <option value="15">Every 15 minutes</option>
            <option value="30">Every 30 minutes</option>
          </select>
        </label>

        <label className="settings-option">
          <span><strong>Production risk alerts</strong><small>Flag changes in shortfall risk</small></span>
          <input
            type="checkbox"
            checked={settings.productionAlerts}
            onChange={(event) => updateSetting("productionAlerts", event.target.checked)}
          />
        </label>

        <label className="settings-option">
          <span><strong>Action summaries</strong><small>Show model-recommended actions</small></span>
          <input
            type="checkbox"
            checked={settings.actionSummaries}
            onChange={(event) => updateSetting("actionSummaries", event.target.checked)}
          />
        </label>

        <label className="settings-option">
          <span><strong>Prototype mode</strong><small>Use representative demonstration data</small></span>
          <input
            type="checkbox"
            checked={settings.prototypeMode}
            onChange={(event) => updateSetting("prototypeMode", event.target.checked)}
          />
        </label>
      </div>
    </div>

    {/* MONITORING */}

    <div className="panel">

      <div className="panel-header">

        <div>
          <h3>Operational Monitoring</h3>

          <p>
            Intelligence services currently enabled
          </p>
        </div>

      </div>


      <div style={{ marginTop: "18px" }}>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 4px",
            borderBottom: "1px solid #edf0ef"
          }}
        >

          <div>
            <strong>Production Monitoring</strong>

            <p
              style={{
                margin: "5px 0 0",
                color: "#89949c"
              }}
            >
              Tracks production forecast against target output
            </p>
          </div>

          <span
            style={{
              padding: "7px 14px",
              borderRadius: "20px",
              background: "#e8f7ef",
              color: "#168f5b",
              fontSize: "13px",
              fontWeight: 600
            }}
          >
            ENABLED
          </span>

        </div>


        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 4px",
            borderBottom: "1px solid #edf0ef"
          }}
        >

          <div>
            <strong>Risk Analysis</strong>

            <p
              style={{
                margin: "5px 0 0",
                color: "#89949c"
              }}
            >
              Identifies production shortfall and operational constraints
            </p>
          </div>

          <span
            style={{
              padding: "7px 14px",
              borderRadius: "20px",
              background: "#e8f7ef",
              color: "#168f5b",
              fontSize: "13px",
              fontWeight: 600
            }}
          >
            ENABLED
          </span>

        </div>


        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 4px"
          }}
        >

          <div>
            <strong>Operational recommendations</strong>

            <p
              style={{
                margin: "5px 0 0",
                color: "#89949c"
              }}
            >
              Generates operational actions from model predictions
            </p>
          </div>

          <span
            style={{
              padding: "7px 14px",
              borderRadius: "20px",
              background: "#e8f7ef",
              color: "#168f5b",
              fontSize: "13px",
              fontWeight: 600
            }}
          >
            ENABLED
          </span>

        </div>

      </div>

    </div>


    {/* SYSTEM INFORMATION */}

    <div className="panel">

      <div className="panel-header">

        <div>
          <h3>System Information</h3>

          <p>
            Current prototype environment
          </p>
        </div>

      </div>


      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "14px",
          marginTop: "20px"
        }}
      >

        <div
          style={{
            padding: "18px",
            borderRadius: "4px",
            background: "#f6f8f7"
          }}
        >
          <div style={{ color: "#89949c", fontSize: "12px" }}>
            API STATUS
          </div>

          <strong
            style={{
              display: "block",
              marginTop: "7px",
              fontSize: "18px"
            }}
          >
            Connected
          </strong>
        </div>


        <div
          style={{
            padding: "18px",
            borderRadius: "4px",
            background: "#f6f8f7"
          }}
        >
          <div style={{ color: "#89949c", fontSize: "12px" }}>
            MODEL VERSION
          </div>

          <strong
            style={{
              display: "block",
              marginTop: "7px",
              fontSize: "18px"
            }}
          >
            v1.0
          </strong>
        </div>


        <div
          style={{
            padding: "18px",
            borderRadius: "4px",
            background: "#f6f8f7"
          }}
        >
          <div style={{ color: "#89949c", fontSize: "12px" }}>
            DATA SOURCE
          </div>

          <strong
            style={{
              display: "block",
              marginTop: "7px",
              fontSize: "18px"
            }}
          >
            Prototype
          </strong>
        </div>

      </div>

    </div>

  </section>
  </>
) : (
  <section className="page-content">
    <div className="page-title">
      <h1>Operational Overview</h1>
      <p>
        Mining intelligence and production risk monitoring
      </p>
    </div>
  </section>
)}

  </div>
</main>

  {activeDetail && (
    <div
      className="detail-backdrop"
      onMouseDown={() => setActiveDetail(null)}
    >
      <section
        className={`detail-dialog ${activeDetail.type === "map" ? "map-detail-dialog" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="detail-dialog-header">
          <div>
            <h2 id="detail-dialog-title">
              {activeDetail.type === "map"
                ? "Reserve Potential Map"
                : activeDetail.type === "date"
                  ? "Production Cycle Date"
                  : activeDetail.title}
            </h2>
            {activeDetail.type === "map" && <p>Prototype zones with confidence and status detail</p>}
          </div>
          <button
            className="detail-close"
            type="button"
            aria-label="Close details"
            onClick={() => setActiveDetail(null)}
          >
            <X size={18} />
          </button>
        </div>

        {activeDetail.type === "details" && (
          <>
            <p className="detail-description">{activeDetail.description}</p>
            <dl className="detail-metrics">
              {activeDetail.metrics.map((metric) => (
                <div className="detail-metric" key={metric.label}>
                  <dt>{metric.label}</dt>
                  <dd>{metric.value}</dd>
                </div>
              ))}
            </dl>
          </>
        )}

        {activeDetail.type === "date" && (
          <div className="cycle-date-content">
            <label htmlFor="cycle-date">Reference date</label>
            <input
              id="cycle-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
            <p>Historical cycle data is not connected in this prototype. The current model result remains the active dataset.</p>
          </div>
        )}

        {activeDetail.type === "map" && (
          <>
          <div className="map-layer-toggles detail-map-layers" role="group" aria-label="Expanded map layers">
            <button className={`map-layer-toggle ${mapLayers.prospectivity ? "selected" : ""}`} type="button" aria-pressed={mapLayers.prospectivity} onClick={() => toggleMapLayer("prospectivity")}>Prospectivity</button>
            <button className={`map-layer-toggle ${mapLayers.environment ? "selected" : ""}`} type="button" aria-pressed={mapLayers.environment} onClick={() => toggleMapLayer("environment")}>Environment</button>
            <button className="map-layer-toggle unavailable" type="button" disabled>Operations · unavailable</button>
          </div>
          <div className="map-wrapper detail-map-wrapper">
            <MapContainer
              center={[21.9, 80.3]}
              zoom={7}
              scrollWheelZoom
              className="map"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapLayers.prospectivity && filteredReserveZones.map((zone) => {
                const color = zone.potential === "High"
                  ? "#168f5b"
                  : zone.potential === "Moderate"
                    ? "#d69b22"
                    : "#d94a45";

                return (
                  <Circle
                    key={zone.name}
                    center={zone.location}
                    radius={zone.potential === "High" ? 18000 : zone.potential === "Moderate" ? 15000 : 12000}
                    pathOptions={{ color, fillColor: color, fillOpacity: selectedZoneId === zone.zoneId ? 0.52 : 0.3, weight: selectedZoneId === zone.zoneId ? 4 : 2 }}
                    eventHandlers={{ click: () => showZoneDetails(zone) }}
                  >
                    <Popup>
                      <strong>{zone.zoneId} · {zone.name}</strong>
                      <br />
                      {zone.potential.toUpperCase()} PROSPECTIVITY · {zone.score}% score
                      <br />
                      {zone.confidence}% geological confidence
                    </Popup>
                  </Circle>
                );
              })}
              {mapLayers.environment && filteredReserveZones.map((zone) => (
                <CircleMarker
                  key={`detail-environment-${zone.zoneId}`}
                  center={zone.location}
                  radius={8}
                  pathOptions={{ color: "#34739c", fillColor: "#78a9c8", fillOpacity: 0.8, weight: 2 }}
                  eventHandlers={{ click: () => showZoneDetails(zone) }}
                >
                  <Popup>{zone.environment} · synthetic environmental layer</Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          </>
        )}
      </section>
    </div>
  )}

</div>
);
}

export default App;