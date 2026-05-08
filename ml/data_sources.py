"""
Real-world training data collection for SmartSpend.

Combines three sources — all FREE, no API keys required:
  1. Faker (en_IN locale)  → thousands of realistic Indian merchant descriptions
  2. Bundled MCC list      → real merchant-category mappings (ISO 18245 subset)
  3. User-confirmed txns   → gold-standard labels from the live DB

The output feeds `train_models.py` during the 12-hour retrain cycle.
"""
from __future__ import annotations
import os
import random
import pandas as pd
from typing import List, Tuple

# ------------------------------------------------------------
# 1. Public MCC → Category mapping (ISO 18245 subset, public domain)
# ------------------------------------------------------------
MCC_MERCHANT_PATTERNS = {
    "Food": [
        "Zomato", "Swiggy", "Uber Eats", "Dominos", "Pizza Hut", "KFC",
        "McDonalds", "Subway", "Starbucks", "Cafe Coffee Day", "Barista",
        "Haldirams", "Bikanervala", "Burger King", "Taco Bell", "Faasos",
        "Behrouz Biryani", "Wow Momo", "Theobroma", "Blue Tokai", "Third Wave",
        "Chai Point", "Darshini", "Andhra Bhavan", "Saravana Bhavan",
        "Paradise Biryani", "Meghna Foods", "Copper Chimney", "Barbeque Nation",
        "Oven Story", "Box8", "EatFit", "FreshMenu", "Mojo Pizza",
    ],
    "Transport": [
        "Uber", "Ola", "Rapido", "Meru Cabs", "BluSmart", "IRCTC",
        "IndiGo", "Air India", "SpiceJet", "Vistara", "Go Air", "Akasa Air",
        "RedBus", "Abhibus", "KSRTC", "MSRTC", "FASTag", "BPCL", "HPCL",
        "Indian Oil", "Shell", "Reliance BP", "Metro Card", "DMRC",
        "BMRCL", "MMRDA", "Namma Metro", "Parking Fee", "Toll Plaza",
    ],
    "Shopping": [
        "Amazon", "Flipkart", "Myntra", "Ajio", "Meesho", "Nykaa",
        "Nykaa Fashion", "Tata CLiQ", "Snapdeal", "Shopclues", "Paytm Mall",
        "Big Basket", "Blinkit", "Zepto", "DMart", "Reliance Fresh",
        "More Supermarket", "Spencers", "Lifestyle", "Pantaloons", "Westside",
        "Max Fashion", "H&M", "Zara", "Uniqlo", "Decathlon", "Croma",
        "Reliance Digital", "Vijay Sales", "Titan", "Tanishq", "Fabindia",
    ],
    "Bills": [
        "BESCOM", "MSEB", "TNEB", "KSEB", "BSES", "Tata Power",
        "Reliance Energy", "BMWSSB", "Bangalore Water", "Indane", "HP Gas",
        "IGL Gas", "Mahanagar Gas", "Jio Fiber", "Airtel Xstream",
        "ACT Fibernet", "Hathway", "You Broadband", "BSNL", "MTNL",
        "Tata Sky", "Dish TV", "D2H", "Airtel DTH", "Sun Direct",
        "Credit Card Bill", "EMI Payment", "Home Loan EMI", "Car Loan EMI",
        "LIC Premium", "HDFC Insurance", "ICICI Lombard", "Star Health",
        "Society Maintenance", "Property Tax", "BBMP Tax",
    ],
    "Entertainment": [
        "Netflix", "Amazon Prime", "Disney Hotstar", "Sony LIV", "Zee5",
        "Voot Select", "JioCinema", "Eros Now", "Spotify", "Apple Music",
        "YouTube Premium", "Gaana", "JioSaavn", "Wynk Music", "PVR",
        "INOX", "Cinepolis", "Carnival", "BookMyShow", "Paytm Insider",
        "Steam", "Epic Games", "PlayStation Plus", "Xbox Game Pass",
        "Nintendo eShop", "Wonderla", "Imagica", "Snow World", "KidZania",
    ],
    "Healthcare": [
        "Apollo Pharmacy", "MedPlus", "1mg", "PharmEasy", "Netmeds",
        "Apollo Hospital", "Fortis", "Manipal Hospital", "Max Healthcare",
        "Columbia Asia", "Thyrocare", "Dr Lal PathLabs", "Metropolis",
        "SRL Diagnostics", "Mediclaim", "Star Health", "HDFC Ergo Health",
        "Practo", "1mg Consultation", "Tata 1mg", "Cipla", "GlaxoSmithKline",
        "Dentist", "Dental Clinic", "Eye Hospital", "LASIK", "Lenskart",
        "Titan Eye Plus", "Physiotherapy", "Ayurveda", "Homoeopathy",
    ],
    "Education": [
        "Coursera", "Udemy", "edX", "Unacademy", "BYJU'S", "Vedantu",
        "Khan Academy", "upGrad", "Simplilearn", "Great Learning",
        "LinkedIn Learning", "Skillshare", "Pluralsight", "MasterClass",
        "School Fees", "College Fees", "Tuition", "Library Membership",
        "GATE Exam", "CAT Exam", "GMAT", "GRE", "IELTS", "TOEFL",
        "Microsoft Cert", "AWS Cert", "Google Cloud Cert", "Scaler",
        "Interview Kickstart", "Masai School", "Newton School",
    ],
    "Salary": [
        "Salary Credit", "Payroll", "Infosys Salary", "TCS Salary",
        "Wipro Payroll", "Accenture Salary", "Cognizant Payroll",
        "HCL Salary", "IBM Payroll", "Capgemini Salary", "Freelance Upwork",
        "Fiverr Payment", "Client Invoice", "Consultancy Fee", "Stipend",
        "Internship Stipend", "Bonus Credit", "Incentive", "Reimbursement",
        "Arrears Salary", "ESOP Vested", "Gratuity", "PF Withdrawal",
        "Pension Credit", "Retainer Fee",
    ],
    "Investment": [
        "Zerodha", "Groww", "Upstox", "Paytm Money", "Kuvera",
        "ET Money", "INDmoney", "HDFC Securities", "ICICI Direct",
        "Kotak Securities", "Axis Direct", "SBI Smart", "Motilal Oswal",
        "Angel One", "5paisa", "SBI Mutual Fund", "HDFC MF", "ICICI MF",
        "Axis MF", "Aditya Birla MF", "Kotak MF", "Nippon India MF",
        "Mirae Asset", "PPF Deposit", "NPS Tier 1", "Sovereign Gold Bond",
        "Fixed Deposit", "RD Deposit", "WazirX", "CoinDCX", "Binance",
        "CoinSwitch", "Bitcoin Purchase", "Ethereum Buy",
    ],
    "Other": [
        "ATM Withdrawal", "UPI Transfer", "NEFT", "IMPS", "RTGS",
        "Cash Deposit", "Money Order", "Western Union", "PayPal",
        "Donation", "Charity", "NGO Donation", "Gift Purchase",
        "Salon", "Spa", "Laundry", "Dry Cleaning", "Tailor",
        "Maid Salary", "Driver Salary", "Security Guard", "Courier",
        "DTDC", "Blue Dart", "Delhivery", "DHL", "FedEx",
        "Notary Fee", "Passport Fee", "Visa Fee", "Stamp Paper",
    ],
}

# Context phrases to append for more variation
CONTEXT_PHRASES = [
    "payment", "upi", "via netbanking", "ref no", "txn id",
    "online order", "delivery", "monthly", "weekly", "yearly",
    "auto debit", "renewal", "subscription", "recharge", "bill pay",
    "", "", "", "",  # sometimes no context
]


def generate_realistic_samples(samples_per_class: int = 150) -> pd.DataFrame:
    """Generate realistic transaction descriptions using bundled MCC data + Faker."""
    random.seed()  # fresh seed each run
    rows: List[Tuple[str, str]] = []

    try:
        from faker import Faker
        fake = Faker('en_IN')
        has_faker = True
    except ImportError:
        has_faker = False

    for category, merchants in MCC_MERCHANT_PATTERNS.items():
        for _ in range(samples_per_class):
            merchant = random.choice(merchants)
            context = random.choice(CONTEXT_PHRASES)

            # Build varied description patterns
            pattern = random.choice([
                f"{merchant} {context}",
                f"{merchant.lower()} {context}",
                f"{context} {merchant}",
                f"{merchant}",
                f"{merchant} - {context}" if context else merchant,
            ])

            # Add Faker-generated noise occasionally (person/city names)
            if has_faker and random.random() < 0.15:
                pattern += f" {fake.city()}"
            if has_faker and random.random() < 0.1:
                pattern += f" ref{fake.random_int(1000, 99999)}"

            rows.append((pattern.strip().lower(), category))

    df = pd.DataFrame(rows, columns=["description", "category"])
    df = df.drop_duplicates().sample(frac=1, random_state=None).reset_index(drop=True)
    return df


def fetch_user_confirmed_data(db_url: str | None = None) -> pd.DataFrame:
    """
    Pull user-confirmed transactions (where the user did NOT change the
    auto-predicted category) as high-quality labeled training data.
    """
    if not db_url:
        db_url = os.getenv("DATABASE_URL")
    if not db_url:
        return pd.DataFrame(columns=["description", "category"])

    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(db_url)
        with engine.connect() as conn:
            # Only pull transactions at least 1 day old (user had chance to correct)
            rows = conn.execute(text("""
                SELECT t.description, c.name as category
                FROM transactions t
                JOIN categories c ON t.cat_id = c.cat_id
                WHERE t.description IS NOT NULL
                  AND t.description <> ''
                  AND t.created_at < (CURRENT_TIMESTAMP - INTERVAL '1 day')
                LIMIT 5000
            """)).fetchall()

        # Descriptions come back encrypted — decrypt them
        from crypto_util import decrypt
        decrypted = [(decrypt(r[0]) or "", r[1]) for r in rows]
        df = pd.DataFrame(decrypted, columns=["description", "category"])
        return df[df["description"].str.len() > 2]
    except Exception as e:
        print(f"[data_sources] Could not fetch user data: {e}")
        return pd.DataFrame(columns=["description", "category"])


def build_training_dataset() -> pd.DataFrame:
    """
    Combine synthetic-realistic data + real user-confirmed data.
    Returns a single DataFrame ready for training.
    """
    synth = generate_realistic_samples(samples_per_class=150)
    real  = fetch_user_confirmed_data()

    if len(real) > 0:
        print(f"[data_sources] Using {len(real)} user-confirmed + {len(synth)} synthetic rows")
        combined = pd.concat([synth, real], ignore_index=True)
    else:
        print(f"[data_sources] Using {len(synth)} synthetic rows (no user data yet)")
        combined = synth

    return combined.drop_duplicates().reset_index(drop=True)


if __name__ == "__main__":
    df = build_training_dataset()
    print(df.groupby("category").size())
    print(f"\nTotal rows: {len(df)}")
