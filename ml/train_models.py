"""
Train ML models for SmartSpend.
Run: python ml/train_models.py

Outputs:
  ml/models/categorizer.pkl
  ml/models/anomaly.pkl

If Kaggle datasets are not present, uses bundled synthetic data.
"""
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

HERE = os.path.dirname(__file__)
MODELS_DIR = os.path.join(HERE, "models")
os.makedirs(MODELS_DIR, exist_ok=True)


# -------------------------------------------------------------
# 1. CATEGORY CLASSIFIER
# -------------------------------------------------------------
def synthetic_categorization_data():
    """~40 samples per class × 10 classes = 400 rows for stable training."""
    samples = {
        "Food": [
            "zomato order biryani", "swiggy pizza night", "restaurant dinner",
            "starbucks coffee", "mcdonalds burger meal", "dominos pizza",
            "cafe coffee day", "food delivery", "kfc chicken bucket",
            "subway sandwich", "haldirams sweets", "paan shop",
            "zomato lunch office", "swiggy instamart grocery", "burger king whopper",
            "pizza hut family", "barbeque nation buffet", "biryani house hyderabad",
            "chai point tea", "third wave coffee", "blue tokai beans",
            "bakery bread cake", "sweet shop mithai", "street food vada",
            "food court meal", "dinner date restaurant", "breakfast cafe",
            "zomato chinese order", "swiggy south indian", "dominos garlic bread",
            "mcdonalds happy meal kids", "kfc wings bucket night", "faasos wraps",
            "behrouz biryani combo", "wow momo dumplings", "theobroma brownie",
            "dunkin donuts coffee", "costa coffee mocha", "starbucks frappuccino",
            "tea stall roadside",
        ],
        "Transport": [
            "uber ride airport", "ola cab home", "metro card recharge",
            "petrol pump fuel", "diesel refill", "auto rickshaw",
            "irctc train ticket", "flight booking indigo", "taxi fare",
            "bus ticket ksrtc", "parking fee", "toll plaza",
            "uber office commute", "ola outstation trip", "rapido bike",
            "metro smart card topup", "petrol hp pump", "indian oil diesel",
            "auto short ride", "irctc tatkal booking", "spicejet flight",
            "air india ticket", "vistara booking", "indigo flight mumbai",
            "ksrtc volvo", "redbus overnight", "fastag recharge",
            "petrol shell premium", "diesel bharat", "uber moto scooter",
            "ola auto share", "meru cab airport", "prepaid taxi stand",
            "parking mall basement", "fastag toll", "railway platform ticket",
            "flixbus europe", "cab fare evening", "airport cab pickup",
            "fuel vehicle bike",
        ],
        "Shopping": [
            "amazon order electronics", "flipkart sale shoes", "myntra clothing",
            "mall shopping", "big bazaar groceries", "dmart grocery",
            "ajio fashion", "meesho home decor", "nykaa cosmetics",
            "reliance digital tv", "croma headphones", "ikea furniture",
            "amazon prime day deal", "flipkart big billion", "myntra end of reason",
            "mall weekend purchase", "big basket groceries", "dmart monthly shop",
            "ajio dress women", "meesho ethnic wear", "nykaa lipstick",
            "reliance fresh vegetables", "croma laptop accessories", "ikea chair table",
            "amazon kindle book", "flipkart mobile phone", "myntra sneakers nike",
            "lifestyle store clothing", "pantaloons jeans", "westside fashion",
            "max fashion apparel", "h&m zara t-shirt", "decathlon sports",
            "titan watch", "tanishq jewellery", "fabindia kurta",
            "snapdeal bedsheet", "paytm mall gift", "amazon echo dot",
            "online shopping order",
        ],
        "Bills": [
            "electricity bill payment", "water bill corp", "gas cylinder",
            "internet wifi airtel", "postpaid mobile bill", "rent transfer landlord",
            "dth tata sky", "broadband jio fiber", "society maintenance",
            "property tax", "credit card bill", "emi payment",
            "bescom electricity", "bmwssb water", "indane gas booking",
            "jio fiber monthly", "airtel xstream broadband", "vi postpaid recharge",
            "monthly rent house", "dish tv recharge", "act fibernet bill",
            "society flat maintenance", "bbmp property tax", "hdfc credit card bill",
            "sbi card payment", "car loan emi", "home loan emi",
            "lic premium policy", "insurance renewal health", "landline bill bsnl",
            "gas pipeline igl", "apartment rent payment", "water tanker purchase",
            "electricity board reliance", "tata power bill", "mobile bill reliance",
            "utility bills monthly", "internet monthly recharge", "cable tv bill",
            "maintenance fee flat",
        ],
        "Entertainment": [
            "netflix subscription", "spotify premium", "pvr movie ticket",
            "bookmyshow concert", "amazon prime renewal", "hotstar yearly",
            "gaming steam purchase", "youtube premium", "zee5 subscription",
            "cinema popcorn combo", "theme park entry", "bowling alley",
            "netflix family plan", "spotify individual plan", "pvr gold class",
            "bookmyshow event pass", "prime video rental", "disney hotstar vip",
            "steam summer sale", "epic games purchase", "xbox game pass",
            "playstation plus", "youtube music premium", "apple music subscription",
            "sony liv yearly", "voot select", "inox multiplex ticket",
            "cinepolis imax", "wonderla entry", "snow world ticket",
            "escape room gaming", "arcade zone tokens", "kbowling lanes",
            "laser tag games", "karaoke night bar", "stand up comedy show",
            "concert ticket band", "amusement park ride", "water park",
            "trekking tour package",
        ],
        "Healthcare": [
            "apollo pharmacy medicine", "hospital consultation", "doctor visit fee",
            "medplus tablets", "diagnostic lab test", "dental clinic",
            "eye check optical", "physiotherapy session", "ambulance service",
            "medical insurance premium", "vaccination", "surgery advance",
            "apollo pharmacy prescription", "1mg online medicine", "pharmeasy delivery",
            "hospital admission charges", "doctor appointment book", "clinic consultation fee",
            "medplus vitamins", "netmeds order", "diagnostic blood test",
            "thyrocare full body", "dental braces fitting", "eye contact lens",
            "physiotherapy back pain", "ambulance emergency ride", "mediclaim premium star",
            "polio vaccination child", "icu bed charge", "x-ray scan",
            "mri scan test", "ct scan diagnostic", "ayurveda treatment",
            "homoeopathy consultation", "psychiatrist session therapy", "dermatology skin",
            "cardiology heart check", "gynaecologist visit", "pediatric child",
            "orthopaedic bone doctor",
        ],
        "Education": [
            "coursera course fee", "udemy online class", "school tuition fee",
            "books stationery", "college semester fee", "coaching byju",
            "exam registration", "library membership", "workshop ticket",
            "byjus subscription", "upgrad program", "certification exam",
            "coursera plus annual", "udemy bundle discount", "school fee term",
            "book purchase stationery", "college mca fees", "coaching aakash iit",
            "gate exam registration", "library card membership", "workshop machine learning",
            "byjus learning app", "upgrad pg diploma", "microsoft certification",
            "aws certified exam", "google cloud cert", "linkedin learning",
            "unacademy subscription", "vedantu class", "topper classes",
            "simplilearn course", "edx micromasters", "harvard online",
            "mit opencourseware", "udacity nanodegree", "coding bootcamp",
            "python course online", "data science workshop", "project thesis fee",
            "academic research paper",
        ],
        "Salary": [
            "salary credit monthly", "payroll deposit", "freelance payment received",
            "bonus credit", "incentive transfer", "stipend received",
            "client invoice paid", "consultancy fee received", "arrears credited",
            "salary infosys company", "payroll tcs monthly", "freelance upwork payment",
            "annual bonus credit", "quarterly incentive transfer", "intern stipend received",
            "client payment received invoice", "consultancy project fee paid", "arrears salary credited",
            "reimbursement travel expense", "ltc payment received", "bonus diwali festival",
            "salary wipro inr", "accenture payroll", "deloitte monthly salary",
            "performance bonus q1", "employee gift voucher", "referral bonus amount",
            "esops vested amount", "gratuity final settlement", "provident fund withdrawal",
            "pension monthly credit", "retainer fee received", "part time income",
            "tutoring income received", "rental income property", "commission sale credit",
            "dividend received stock", "interest fd credited", "cashback received card",
            "reward points redeemed",
        ],
        "Investment": [
            "mutual fund sip", "stock zerodha buy", "fixed deposit renewal",
            "ppf deposit", "nps contribution", "gold etf purchase",
            "crypto binance buy", "recurring deposit", "sbi sip",
            "axis mutual fund sip", "zerodha equity trade", "fixed deposit icici",
            "ppf annual contribution", "nps tier 1 deposit", "gold bond sgb",
            "crypto bitcoin purchase", "recurring deposit bank", "sbi nifty index",
            "hdfc small cap fund", "icici prudential fund", "kotak mutual fund",
            "groww app investment", "upstox stock buy", "paytm money sip",
            "etf nifty bees", "silver etf buy", "corporate bond purchase",
            "government bond gilts", "ulip plan sip", "real estate plot",
            "reit investment fund", "chit fund monthly", "coin dcx crypto",
            "wazirx bitcoin", "ethereum purchase", "nft marketplace buy",
            "solana staking", "dividend reinvestment plan", "commodity futures gold",
            "sovereign gold bond",
        ],
        "Other": [
            "gift purchase", "donation ngo", "miscellaneous expense",
            "atm withdrawal", "cash transfer", "tip restaurant",
            "gift birthday friend", "donation akshaya patra", "miscellaneous fee",
            "atm cash withdraw", "cash upi transfer", "tip waiter hotel",
            "gift hamper send", "charity old age home", "random purchase other",
            "cash deposit bank", "neft transfer family", "imps instant money",
            "rtgs large transfer", "upi friend payment", "small cash expense",
            "pet food petshop", "salon haircut men", "spa massage relax",
            "laundry service weekly", "dry cleaning suit", "tailor stitching",
            "shoe polish repair", "locksmith key duplicate", "carpenter furniture work",
            "electrician repair home", "plumber leak fix", "maid salary monthly",
            "driver monthly payment", "security guard tip", "courier fedex send",
            "passport application fee", "visa processing charge", "stamp paper notary",
            "car wash service",
        ],
    }
    rows = [(txt, cat) for cat, lst in samples.items() for txt in lst]
    return pd.DataFrame(rows, columns=["description", "category"])


def train_categorizer():
    print("[1/2] Training category classifier...")
    # Try rich real-world-style dataset first; fall back to bundled synthetic
    try:
        from data_sources import build_training_dataset
        df = build_training_dataset()
        print(f"  Using realistic dataset: {len(df)} rows across {df['category'].nunique()} classes")
    except Exception as e:
        print(f"  (falling back to bundled synthetic: {e})")
        df = synthetic_categorization_data()
    # Augment dataset — generate variations by shuffling bigram order and
    # adding common noise words, boosting samples per class.
    import random
    random.seed(42)
    noise_words = ["paid", "via", "upi", "ref", "txn", "bank", "online",
                   "delivery", "order", "transfer", "amount", "charge"]
    augmented = []
    for txt, cat in df.values:
        augmented.append((txt, cat))
        # 2 augmentations per sample
        tokens = txt.split()
        if len(tokens) >= 2:
            shuffled = tokens.copy()
            random.shuffle(shuffled)
            augmented.append((" ".join(shuffled), cat))
            augmented.append((txt + " " + random.choice(noise_words), cat))
    df = pd.DataFrame(augmented, columns=["description", "category"])

    X_train, X_test, y_train, y_test = train_test_split(
        df["description"], df["category"],
        test_size=0.2, random_state=42, stratify=df["category"],
    )

    # FeatureUnion: combine word n-grams + character n-grams for robust
    # matching even on OCR'd / typo'd descriptions.
    features = FeatureUnion([
        ("word", TfidfVectorizer(
            analyzer="word", ngram_range=(1, 2),
            min_df=1, sublinear_tf=True, lowercase=True,
        )),
        ("char", TfidfVectorizer(
            analyzer="char_wb", ngram_range=(3, 5),
            min_df=1, sublinear_tf=True, lowercase=True,
        )),
    ])
    pipe = Pipeline([
        ("features", features),
        ("clf", CalibratedClassifierCV(
            LinearSVC(C=1.0, class_weight="balanced", max_iter=3000),
            cv=3,
        )),
    ])
    pipe.fit(X_train, y_train)

    y_pred = pipe.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"  Accuracy: {acc:.2%}")
    print(classification_report(y_test, y_pred, zero_division=0))

    joblib.dump(pipe, os.path.join(MODELS_DIR, "categorizer.pkl"))
    print(f"  Saved → {MODELS_DIR}/categorizer.pkl")


# -------------------------------------------------------------
# 2. ANOMALY DETECTOR
# -------------------------------------------------------------
def synthetic_anomaly_data(n=2000):
    rng = np.random.default_rng(42)
    normal = pd.DataFrame({
        "amount": rng.lognormal(mean=6.5, sigma=0.6, size=n),
        "hour": rng.integers(8, 23, size=n),
        "day_of_week": rng.integers(0, 7, size=n),
    })
    # Inject 2% outliers
    anomalies = pd.DataFrame({
        "amount": rng.uniform(50000, 200000, size=int(n * 0.02)),
        "hour": rng.integers(0, 5, size=int(n * 0.02)),
        "day_of_week": rng.integers(0, 7, size=int(n * 0.02)),
    })
    return pd.concat([normal, anomalies], ignore_index=True)


def train_anomaly():
    print("[2/2] Training anomaly detector...")
    X = synthetic_anomaly_data()
    model = IsolationForest(
        contamination=0.02, random_state=42, n_estimators=150,
    )
    model.fit(X)
    preds = model.predict(X)
    print(f"  Flagged {(preds == -1).sum()} / {len(X)} as anomalies")

    joblib.dump(model, os.path.join(MODELS_DIR, "anomaly.pkl"))
    print(f"  Saved → {MODELS_DIR}/anomaly.pkl")


if __name__ == "__main__":
    train_categorizer()
    train_anomaly()
    print("\n✓ All models trained.")
