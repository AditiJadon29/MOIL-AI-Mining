from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np


app = FastAPI(
    title="MOIL AI Mining Intelligence API",
    description="AI/ML prototype for manganese reserve and production intelligence",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# AI/ML MODEL
# =========================================================
# Synthetic historical mining data for the prototype.
#
# Features:
# 1. Equipment downtime (%)
# 2. Rainfall impact (%)
# 3. Equipment availability (%)
# 4. Geological confidence (%)
# 5. Workforce availability (%)
#
# In the final system these would be replaced with
# real historical MOIL/geological/satellite datasets.

X_train = np.array([
    [10,  5, 95, 92, 95],
    [15,  8, 94, 90, 93],
    [20, 10, 92, 88, 90],
    [25, 15, 90, 86, 88],
    [30, 18, 88, 84, 86],
    [35, 22, 85, 82, 84],
    [40, 25, 83, 80, 82],
    [45, 30, 80, 78, 80],
    [50, 35, 77, 75, 78],
    [55, 40, 74, 72, 75],
    [60, 45, 70, 68, 72],
    [65, 50, 67, 65, 70],
])

y_train = np.array([
    10800,
    10500,
    10200,
    9900,
    9600,
    9300,
    9000,
    8600,
    8200,
    7800,
    7400,
    7000,
])


# Add bias column
X_with_bias = np.column_stack([
    np.ones(len(X_train)),
    X_train
])

# Train linear regression using NumPy
coefficients = np.linalg.lstsq(
    X_with_bias,
    y_train,
    rcond=None
)[0]


def predict_production(features):

    features_with_bias = np.array([
        1,
        *features
    ])

    prediction = np.dot(
        features_with_bias,
        coefficients
    )

    return max(0, float(prediction))


# =========================================================
# INPUT MODEL
# =========================================================

class MiningInput(BaseModel):

    equipment_downtime: float = 20
    rainfall: float = 10
    equipment_availability: float = 90
    geological_confidence: float = 80
    workforce_availability: float = 85

    target_production: float = 10000


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/")
def home():

    return {
        "system": "MOIL AI Mining Intelligence",
        "status": "online",
        "version": "1.0",
        "model": "Multivariate Linear Regression",
        "data_mode": "Synthetic demonstration data"
    }


# =========================================================
# PREDICTION
# =========================================================

@app.post("/predict")
def predict(data: MiningInput):

    features = [
        data.equipment_downtime,
        data.rainfall,
        data.equipment_availability,
        data.geological_confidence,
        data.workforce_availability
    ]

    predicted_production = predict_production(features)

    shortfall = max(
        0,
        data.target_production - predicted_production
    )

    shortfall_percentage = (
        shortfall / data.target_production
    ) * 100


    # -----------------------------------------------------
    # RISK
    # -----------------------------------------------------

    if shortfall_percentage >= 15:
        risk = "HIGH"

    elif shortfall_percentage >= 7:
        risk = "MEDIUM"

    else:
        risk = "LOW"


    # -----------------------------------------------------
    # MAIN CONSTRAINT
    # -----------------------------------------------------

    constraints = {
        "Equipment Downtime": data.equipment_downtime,
        "Rainfall Impact": data.rainfall,
        "Equipment Unavailability":
            100 - data.equipment_availability,
        "Workforce Constraints":
            100 - data.workforce_availability
    }

    main_constraint = max(
        constraints,
        key=constraints.get
    )


    # -----------------------------------------------------
    # RECOMMENDATIONS
    # -----------------------------------------------------

    recommendations = []


    if data.equipment_downtime > 40:

        recommendations.append(
            "Redeploy standby equipment to critical mining zones."
        )


    if data.rainfall > 30:

        recommendations.append(
            "Adjust mine schedule around predicted rainfall."
        )


    if data.equipment_availability < 75:

        recommendations.append(
            "Prioritize maintenance of low-availability equipment."
        )


    if data.workforce_availability < 70:

        recommendations.append(
            "Reallocate workforce to high-priority production activities."
        )


    if not recommendations:

        recommendations.append(
            "Maintain current schedule and continuously monitor production."
        )


    # -----------------------------------------------------
    # RESERVE POTENTIAL
    # -----------------------------------------------------

    reserve_potential = (
        0.45 * data.geological_confidence
        + 0.25 * data.equipment_availability
        + 0.15 * data.workforce_availability
        + 0.15 * (100 - min(data.rainfall, 100))
    )

    reserve_potential = max(
        0,
        min(100, reserve_potential)
    )


    return {

        "predicted_production_tonnes":
            round(predicted_production, 2),

        "target_production_tonnes":
            round(data.target_production, 2),

        "expected_shortfall_tonnes":
            round(shortfall, 2),

        "shortfall_percentage":
            round(shortfall_percentage, 2),

        "shortfall_risk":
            risk,

        "main_constraint":
            main_constraint,

        "reserve_potential_percent":
            round(reserve_potential, 2),

"equipment_downtime":
    round(data.equipment_downtime, 2),

"rainfall_impact":
    round(data.rainfall, 2),

"equipment_availability":
    round(data.equipment_availability, 2),

"workforce_availability":
    round(data.workforce_availability, 2),

"recommended_actions":
    recommendations,

        "model":
            "Multivariate Linear Regression",

        "data_mode":
            "Synthetic demonstration data"

    }