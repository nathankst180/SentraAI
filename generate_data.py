"""
Rawbank Sentient Fraud Intelligence Platform - Deterministic Canonical Data Generator
Generates:
1. RAWBANK_SENTIENT_KB.csv (Master 110-column canonical knowledge base)
2. RAWBANK_SENTIENT_GROUND_TRUTH.csv (Hidden evaluation ground truth)
"""

import csv
import math
import os
import random
from datetime import datetime, timedelta

# ---------------------------------------------------------
# CONSTANTS & CONFIGURATION
# ---------------------------------------------------------
SEED = 20260928
TOTAL_TRANSACTIONS = 2500
NUM_CUSTOMERS = 120
NUM_BENEFICIARIES = 180
NUM_DEVICES = 145
NUM_MERCHANTS = 50

# Continuous 90-day history (June 14, 2026 to September 12, 2026)
START_DATE = datetime(2026, 6, 14, 8, 0, 0)
END_DATE = datetime(2026, 9, 12, 20, 0, 0)
TIME_SPAN_SECONDS = int((END_DATE - START_DATE).total_seconds())

DRC_CITIES = {
    'KINSHASA': {'province': 'KINSHASA', 'country': 'CD'},
    'LUBUMBASHI': {'province': 'HAUT_KATANGA', 'country': 'CD'},
    'KOLWEZI': {'province': 'LUALABA', 'country': 'CD'},
    'GOMA': {'province': 'NORTH_KIVU', 'country': 'CD'},
    'MATADI': {'province': 'KONGO_CENTRAL', 'country': 'CD'},
    'BUKAVU': {'province': 'SOUTH_KIVU', 'country': 'CD'},
    'KISANGANI': {'province': 'TSHOPO', 'country': 'CD'},
    'MBUJI_MAYI': {'province': 'KASAI_ORIENTAL', 'country': 'CD'},
}

CITY_DISTANCES = {
    ('KINSHASA', 'KINSHASA'): 5,
    ('KINSHASA', 'MATADI'): 350,
    ('KINSHASA', 'LUBUMBASHI'): 1570,
    ('KINSHASA', 'KOLWEZI'): 1350,
    ('KINSHASA', 'GOMA'): 1580,
    ('KINSHASA', 'BUKAVU'): 1500,
    ('KINSHASA', 'KISANGANI'): 1250,
    ('KINSHASA', 'MBUJI_MAYI'): 950,
    ('LUBUMBASHI', 'LUBUMBASHI'): 5,
    ('LUBUMBASHI', 'KOLWEZI'): 300,
    ('LUBUMBASHI', 'GOMA'): 1300,
    ('LUBUMBASHI', 'MATADI'): 1800,
    ('LUBUMBASHI', 'BUKAVU'): 1200,
    ('LUBUMBASHI', 'KISANGANI'): 1400,
    ('LUBUMBASHI', 'MBUJI_MAYI'): 650,
    ('KOLWEZI', 'KOLWEZI'): 5,
    ('KOLWEZI', 'GOMA'): 1200,
    ('KOLWEZI', 'MATADI'): 1600,
    ('KOLWEZI', 'BUKAVU'): 1100,
    ('KOLWEZI', 'KISANGANI'): 1350,
    ('KOLWEZI', 'MBUJI_MAYI'): 550,
    ('GOMA', 'GOMA'): 5,
    ('GOMA', 'BUKAVU'): 110,
    ('GOMA', 'MATADI'): 1850,
    ('GOMA', 'KISANGANI'): 600,
    ('GOMA', 'MBUJI_MAYI'): 900,
    ('MATADI', 'MATADI'): 5,
}

def get_distance(city1, city2):
    if not city1 or not city2:
        return 0
    if city1 == city2:
        return 5
    pair = (city1, city2)
    rev_pair = (city2, city1)
    if pair in CITY_DISTANCES:
        return CITY_DISTANCES[pair]
    if rev_pair in CITY_DISTANCES:
        return CITY_DISTANCES[rev_pair]
    return 1000

# Standardized FX Rates to USD
FX_RATES = {
    'USD': 1.0,
    'CDF': 0.00036364, # ~2,750 CDF per 1 USD
    'EUR': 1.0850,
}

# Master Schema Columns (110 exact columns)
MASTER_COLUMNS = [
    'transaction_id', 'event_timestamp_local', 'batch_id', 'synthetic_record_version',
    'data_quality_flag', 'customer_id', 'customer_name', 'customer_type', 'customer_segment',
    'age_band', 'occupation_industry', 'resident_status', 'home_country', 'home_province',
    'home_city', 'relationship_tenure_days', 'kyc_risk_band', 'pep_flag',
    'monthly_inflow_usd_equiv', 'account_id', 'account_type', 'account_currency',
    'account_status', 'product_package', 'card_product', 'card_status',
    'illicocash_enabled', 'rawbank_online_enabled', 'alert_banking_enabled',
    'available_balance_before_usd', 'available_balance_after_usd', 'transaction_type',
    'direction', 'amount', 'currency', 'fx_rate_to_usd', 'amount_usd_equiv',
    'channel', 'channel_action', 'payment_rail', 'transaction_status', 'failure_reason',
    'is_cross_border', 'origin_country', 'destination_country', 'destination_city',
    'narration', 'recurring_or_scheduled_flag', 'corporate_payment_flag',
    'beneficiary_id', 'beneficiary_name', 'beneficiary_type', 'beneficiary_relationship',
    'beneficiary_age_days', 'beneficiary_prior_txn_count',
    'beneficiary_distinct_sender_count_30d', 'merchant_id', 'merchant_name',
    'merchant_category', 'card_entry_mode', 'touchpoint_id', 'touchpoint_type',
    'txn_province', 'txn_city', 'session_id', 'device_id', 'device_type', 'device_os',
    'device_trusted_flag', 'device_first_seen_days', 'device_accounts_seen_30d',
    'ip_country', 'ip_city', 'ip_risk_score', 'vpn_proxy_flag', 'login_failures_30m',
    'password_reset_hours_ago', 'sim_swap_days_ago', 'auth_method', 'auth_success_flag',
    'approvals_required', 'approvals_completed', 'customer_median_txn_usd_90d',
    'customer_avg_txn_usd_30d', 'amount_to_median_ratio', 'txn_count_10m',
    'txn_count_1h', 'outbound_amount_1h_usd', 'minutes_since_prev_txn',
    'previous_txn_city', 'geo_distance_from_home_km', 'impossible_travel_flag',
    'unusual_time_flag', 'behavioral_deviation_score', 'new_beneficiary_flag',
    'new_device_flag', 'alert_generated_flag', 'alert_id', 'alert_score',
    'alert_severity', 'alert_primary_pattern', 'alert_reason_codes',
    'potential_exposure_usd', 'case_id', 'case_status', 'analyst_queue',
    'human_disposition', 'disposition_reason', 'escalation_required_flag',
    'escalation_tier'
]

# ---------------------------------------------------------
# ENTITY BUILDERS
# ---------------------------------------------------------
def generate_entities(rng):
    customers = []
    
    # 84 Retail segments (70% total)
    retail_segments = [
        ('ECO', 24, 'CURRENT', 'VISA_CDF', 300, 1500, ['SALARIED', 'STUDENT', 'INFORMAL_COMMERCE']),
        ('ACADEMIA', 10, 'SAVINGS', 'VISA_ACADEMIA', 200, 800, ['STUDENT', 'RESEARCHER']),
        ('EMPLOYEE', 14, 'CURRENT', 'VISA_USD_CLASSIC', 800, 3500, ['SALARIED', 'CIVIL_SERVANT']),
        ('LADYS_FIRST', 10, 'CURRENT', 'VISA_LADYS_FIRST', 800, 4000, ['ENTREPRENEUR', 'SERVICES']),
        ('PREMIUM', 12, 'CURRENT', 'VISA_USD_GOLD', 3000, 10000, ['ENTREPRENEUR', 'HEALTHCARE', 'CONSULTANT']),
        ('PRESTIGE', 6, 'CURRENT', 'VISA_USD_PLATINUM', 10000, 35000, ['BUSINESS_OWNER', 'EXECUTIVE']),
        ('INFINITE', 2, 'CURRENT', 'VISA_USD_INFINITE', 30000, 90000, ['DIRECTOR', 'FINANCIER']),
        ('DIASPORA', 6, 'CURRENT', 'VISA_USD_GOLD', 2500, 12000, ['CONSULTANT', 'ENGINEER']),
    ]
    
    cus_id_counter = 1
    for seg, count, acct_type, card_prod, min_inflow, max_inflow, occupations in retail_segments:
        for _ in range(count):
            cid = f"CUS-{cus_id_counter:05d}"
            name = f"SYN Retail Customer {cus_id_counter:05d}"
            is_diaspora = (seg == 'DIASPORA')
            
            if is_diaspora:
                res_status = 'DIASPORA'
                home_country = rng.choice(['BE', 'FR', 'ZA', 'AE', 'GB', 'US'])
                home_province = None
                home_city = None
            else:
                res_status = 'DRC_RESIDENT'
                home_country = 'CD'
                city_weights = [('KINSHASA', 0.50), ('LUBUMBASHI', 0.20), ('KOLWEZI', 0.10), ('GOMA', 0.10), ('MATADI', 0.10)]
                c_roll = rng.random()
                cum = 0
                chosen_city = 'KINSHASA'
                for c_name, w in city_weights:
                    cum += w
                    if c_roll <= cum:
                        chosen_city = c_name
                        break
                home_city = chosen_city
                home_province = DRC_CITIES[home_city]['province']
                
            if seg == 'ACADEMIA':
                age_band = '18_24'
            elif seg in ['PRESTIGE', 'INFINITE']:
                age_band = rng.choice(['45_54', '55_64', '65_PLUS'])
            else:
                age_band = rng.choice(['25_34', '35_44', '45_54'])
                
            tenure = rng.randint(90, 4500)
            kyc = rng.choices(['LOW', 'MEDIUM', 'HIGH'], weights=[0.80, 0.16, 0.04])[0]
            pep = (rng.random() < 0.015)
            monthly_inflow = round(rng.uniform(min_inflow, max_inflow), 2)
            
            # Calibrate currency to hit target ~45% CDF, ~50% USD, ~5% EUR overall
            if seg in ['ECO', 'ACADEMIA']:
                curr = rng.choices(['CDF', 'USD'], weights=[0.92, 0.08])[0]
            elif seg in ['EMPLOYEE', 'LADYS_FIRST']:
                curr = rng.choices(['CDF', 'USD'], weights=[0.70, 0.30])[0]
            elif seg == 'DIASPORA':
                curr = rng.choices(['USD', 'EUR'], weights=[0.50, 0.50])[0]
            else: # Premium, Prestige, Infinite
                curr = rng.choices(['USD', 'EUR', 'CDF'], weights=[0.75, 0.15, 0.10])[0]
            
            card_stat = 'ACTIVE' if card_prod != 'NONE' else 'NONE'
            illico = True
            rbo = (rng.random() < 0.85)
            alert_b = (rng.random() < 0.90)
            
            initial_balance = round(monthly_inflow * rng.uniform(4.0, 8.0) + 2500.0, 2)
            
            customers.append({
                'customer_id': cid,
                'customer_name': name,
                'customer_type': 'RETAIL',
                'customer_segment': seg,
                'age_band': age_band,
                'occupation_industry': rng.choice(occupations),
                'resident_status': res_status,
                'home_country': home_country,
                'home_province': home_province,
                'home_city': home_city,
                'relationship_tenure_days': tenure,
                'kyc_risk_band': kyc,
                'pep_flag': pep,
                'monthly_inflow_usd_equiv': monthly_inflow,
                'account_id': f"ACC-{cus_id_counter:07d}",
                'account_type': acct_type,
                'account_currency': curr,
                'account_status': 'ACTIVE',
                'product_package': seg,
                'card_product': card_prod,
                'card_status': card_stat,
                'illicocash_enabled': illico,
                'rawbank_online_enabled': rbo,
                'alert_banking_enabled': alert_b,
                'running_balance': initial_balance,
                'expected_median_usd': round(monthly_inflow * 0.04, 2),
            })
            cus_id_counter += 1
            
    # 24 SME (20% total)
    sme_industries = ['RETAIL_TRADE', 'LOGISTICS', 'SERVICES', 'CONSTRUCTION', 'AGRICULTURE', 'HEALTHCARE']
    for _ in range(24):
        cid = f"CUS-{cus_id_counter:05d}"
        name = f"SYN SME Enterprise {cus_id_counter:05d} SARL"
        home_city = rng.choice(['KINSHASA', 'LUBUMBASHI', 'KOLWEZI', 'GOMA', 'MATADI'])
        home_province = DRC_CITIES[home_city]['province']
        monthly_inflow = round(rng.uniform(15000, 150000), 2)
        curr = rng.choices(['CDF', 'USD'], weights=[0.55, 0.45])[0]
        card_prod = rng.choice(['VISA_USD_GOLD', 'MASTERCARD', 'NONE'])
        
        customers.append({
            'customer_id': cid,
            'customer_name': name,
            'customer_type': 'SME',
            'customer_segment': 'SME',
            'age_band': rng.choice(['35_44', '45_54', '55_64']),
            'occupation_industry': rng.choice(sme_industries),
            'resident_status': 'DRC_RESIDENT',
            'home_country': 'CD',
            'home_province': home_province,
            'home_city': home_city,
            'relationship_tenure_days': rng.randint(300, 5000),
            'kyc_risk_band': rng.choices(['LOW', 'MEDIUM', 'HIGH'], weights=[0.70, 0.25, 0.05])[0],
            'pep_flag': False,
            'monthly_inflow_usd_equiv': monthly_inflow,
            'account_id': f"ACC-{cus_id_counter:07d}",
            'account_type': 'CURRENT',
            'account_currency': curr,
            'account_status': 'ACTIVE',
            'product_package': 'SME_STANDARD',
            'card_product': card_prod,
            'card_status': 'ACTIVE' if card_prod != 'NONE' else 'NONE',
            'illicocash_enabled': True,
            'rawbank_online_enabled': True,
            'alert_banking_enabled': True,
            'running_balance': round(monthly_inflow * rng.uniform(4.0, 8.0) + 15000.0, 2),
            'expected_median_usd': round(monthly_inflow * 0.03, 2),
        })
        cus_id_counter += 1
        
    # 12 Corporate (10% total)
    corp_industries = ['MINING', 'TELECOM', 'LOGISTICS', 'ENERGY', 'MANUFACTURING', 'NGO']
    for _ in range(12):
        cid = f"CUS-{cus_id_counter:05d}"
        name = f"SYN Corporate {cus_id_counter:05d} SA"
        home_city = rng.choice(['KINSHASA', 'LUBUMBASHI', 'KOLWEZI'])
        home_province = DRC_CITIES[home_city]['province']
        monthly_inflow = round(rng.uniform(250000, 2000000), 2)
        curr = rng.choices(['USD', 'CDF', 'EUR'], weights=[0.60, 0.30, 0.10])[0]
        
        customers.append({
            'customer_id': cid,
            'customer_name': name,
            'customer_type': 'CORPORATE',
            'customer_segment': 'CORPORATE',
            'age_band': 'N_A_CORPORATE',
            'occupation_industry': rng.choice(corp_industries),
            'resident_status': 'DRC_RESIDENT',
            'home_country': 'CD',
            'home_province': home_province,
            'home_city': home_city,
            'relationship_tenure_days': rng.randint(600, 6000),
            'kyc_risk_band': rng.choices(['LOW', 'MEDIUM'], weights=[0.85, 0.15])[0],
            'pep_flag': False,
            'monthly_inflow_usd_equiv': monthly_inflow,
            'account_id': f"ACC-{cus_id_counter:07d}",
            'account_type': 'CORPORATE_CURRENT',
            'account_currency': curr,
            'account_status': 'ACTIVE',
            'product_package': 'CORPORATE_STANDARD',
            'card_product': 'NONE',
            'card_status': 'NONE',
            'illicocash_enabled': False,
            'rawbank_online_enabled': True,
            'alert_banking_enabled': True,
            'running_balance': round(monthly_inflow * rng.uniform(4.0, 8.0) + 150000.0, 2),
            'expected_median_usd': round(monthly_inflow * 0.025, 2),
        })
        cus_id_counter += 1

    # 2. Merchants & Beneficiaries: 180 beneficiaries total
    merchants = []
    beneficiaries = []
    
    canonical_merchants = [
        ('SYN Vodacom DRC TopUp', 'TELECOM', 'MERCHANT'),
        ('SYN Airtel Congo Airtime', 'TELECOM', 'MERCHANT'),
        ('SYN Orange RDC Airtime', 'TELECOM', 'MERCHANT'),
        ('SYN Africell RDC Telecom', 'TELECOM', 'MERCHANT'),
        ('SYN SNEL Electricite Kinshasa', 'UTILITIES', 'MERCHANT'),
        ('SYN REGIDESO Eau Kinshasa', 'UTILITIES', 'MERCHANT'),
        ('SYN Canal+ Congo Lubumbashi', 'ENTERTAINMENT', 'MERCHANT'),
        ('SYN Startimes RDC', 'ENTERTAINMENT', 'MERCHANT'),
        ('SYN Hyper Psaro Lubumbashi', 'GROCERY', 'MERCHANT'),
        ('SYN Shoprite Gombe Kinshasa', 'GROCERY', 'MERCHANT'),
        ('SYN City Market Kinshasa', 'GROCERY', 'MERCHANT'),
        ('SYN TotalEnergies Gombe', 'FUEL', 'MERCHANT'),
        ('SYN Engen Boulevard Triomphal', 'FUEL', 'MERCHANT'),
        ('SYN Jumia RDC Online', 'ECOMMERCE', 'MERCHANT'),
        ('SYN Amazon EU Sarl', 'ECOMMERCE', 'MERCHANT'),
        ('SYN Fleuve Congo Hotel Kinshasa', 'HOSPITALITY', 'MERCHANT'),
        ('SYN Grand Karavia Hotel Lubumbashi', 'HOSPITALITY', 'MERCHANT'),
        ('SYN Pullman Kinshasa Grand Hotel', 'HOSPITALITY', 'MERCHANT'),
        ('SYN Congo Express Logistics', 'LOGISTICS', 'MERCHANT'),
        ('SYN Kinshasa Pharmacy Central', 'HEALTHCARE', 'MERCHANT'),
    ]
    
    ben_id = 1
    # 1 to 20: Merchant-Beneficiaries
    for m_name, m_cat, b_rel in canonical_merchants:
        mid = f"MER-{ben_id:05d}"
        bid = f"BEN-{ben_id:05d}"
        merch_obj = {
            'merchant_id': mid,
            'merchant_name': m_name,
            'merchant_category': m_cat,
        }
        ben_obj = {
            'beneficiary_id': bid,
            'beneficiary_name': m_name,
            'beneficiary_type': 'MERCHANT',
            'beneficiary_relationship': b_rel,
            'is_shared_utility': (ben_id <= 8),
            'is_mule': False,
            'linked_merchant_id': mid,
            'linked_merchant_category': m_cat,
        }
        merchants.append(merch_obj)
        beneficiaries.append(ben_obj)
        ben_id += 1
        
    for m_idx in range(21, NUM_MERCHANTS + 1):
        mid = f"MER-{m_idx:05d}"
        m_name = f"SYN Merchant Entity {m_idx:04d}"
        m_cat = rng.choice(['RETAIL', 'GROCERY', 'SERVICES', 'EDUCATION', 'MINING_SUPPLY'])
        merchants.append({
            'merchant_id': mid,
            'merchant_name': m_name,
            'merchant_category': m_cat,
        })

    # 21 to 25: Mule candidate beneficiaries (BEN-00021 to BEN-00025)
    mule_names = [
        'SYN Cash Express Mule Recipient 01',
        'SYN Fast Remit Mule Hub 02',
        'SYN Direct Mule Transfer 03',
        'SYN Digital Flow Mule Node 04',
        'SYN Rapid Multi-Agent Mule 05'
    ]
    for m_name in mule_names:
        bid = f"BEN-{ben_id:05d}"
        beneficiaries.append({
            'beneficiary_id': bid,
            'beneficiary_name': m_name,
            'beneficiary_type': 'OTHER_BANK',
            'beneficiary_relationship': 'UNKNOWN',
            'is_shared_utility': False,
            'is_mule': True,
        })
        ben_id += 1
        
    # 26 to 55: Corporate Suppliers (BEN-00026 to BEN-00055)
    for s_idx in range(1, 31):
        bid = f"BEN-{ben_id:05d}"
        beneficiaries.append({
            'beneficiary_id': bid,
            'beneficiary_name': f"SYN Corporate Mining Supplier {s_idx:03d} SARL",
            'beneficiary_type': 'OTHER_BANK',
            'beneficiary_relationship': 'SUPPLIER',
            'is_shared_utility': False,
            'is_mule': False,
        })
        ben_id += 1

    # 56 to 180: Regular counterparties
    while ben_id <= NUM_BENEFICIARIES:
        bid = f"BEN-{ben_id:05d}"
        b_type = rng.choice(['RAWBANK_CUSTOMER', 'OTHER_BANK', 'MOBILE_WALLET'])
        b_rel = rng.choice(['FAMILY', 'KNOWN_PERSON', 'SUPPLIER', 'EMPLOYEE'])
        beneficiaries.append({
            'beneficiary_id': bid,
            'beneficiary_name': f"SYN Beneficiary Counterparty {ben_id:05d}",
            'beneficiary_type': b_type,
            'beneficiary_relationship': b_rel,
            'is_shared_utility': False,
            'is_mule': False,
        })
        ben_id += 1

    # 3. Devices: 145 total
    devices = []
    for dev_i in range(1, 121):
        d_type = rng.choices(['ANDROID', 'IOS', 'WINDOWS', 'MACOS'], weights=[0.45, 0.25, 0.20, 0.10])[0]
        if d_type == 'ANDROID':
            d_os = rng.choice(['Android 15', 'Android 14', 'Android 13'])
        elif d_type == 'IOS':
            d_os = rng.choice(['iOS 18', 'iOS 17', 'iOS 16.5'])
        elif d_type == 'WINDOWS':
            d_os = rng.choice(['Windows 11', 'Windows 10 Pro'])
        else:
            d_os = 'macOS Sequoia'
            
        devices.append({
            'device_id': f"DEV-{dev_i:05d}",
            'device_type': d_type,
            'device_os': d_os,
            'is_shared_mule_device': False,
            'is_terminal': False,
            'first_seen_platform_days': rng.randint(60, 500),
        })
        
    for dev_i in range(121, 126):
        devices.append({
            'device_id': f"DEV-{dev_i:05d}",
            'device_type': 'WINDOWS',
            'device_os': 'Windows 11',
            'is_shared_mule_device': True,
            'is_terminal': False,
            'first_seen_platform_days': 5,
        })
        
    for dev_i in range(126, 136):
        devices.append({
            'device_id': f"DEV-{dev_i:05d}",
            'device_type': 'WEB_BROWSER',
            'device_os': 'Managed Corporate Browser',
            'is_shared_mule_device': False,
            'is_terminal': False,
            'first_seen_platform_days': rng.randint(120, 600),
        })
        
    for dev_i in range(136, 146):
        d_type = 'ATM_TERMINAL' if dev_i <= 140 else 'POS_TERMINAL'
        d_os = 'Diebold Nixdorf ATM OS' if d_type == 'ATM_TERMINAL' else 'Verifone POS OS'
        devices.append({
            'device_id': f"DEV-{dev_i:05d}",
            'device_type': d_type,
            'device_os': d_os,
            'is_shared_mule_device': False,
            'is_terminal': True,
            'first_seen_platform_days': rng.randint(200, 800),
        })

    return customers, beneficiaries, devices, merchants

# ---------------------------------------------------------
# TRANSACTION SKELETON GENERATION
# ---------------------------------------------------------
def generate_raw_transactions(rng, customers, beneficiaries, devices, merchants):
    events = []
    
    bens_utility = [b for b in beneficiaries if b.get('is_shared_utility')]
    bens_mule = [b for b in beneficiaries if b.get('is_mule')]
    bens_corp = [b for b in beneficiaries if b['beneficiary_relationship'] == 'SUPPLIER']
    bens_regular = [b for b in beneficiaries if not b.get('is_shared_utility') and not b.get('is_mule') and b['beneficiary_relationship'] != 'SUPPLIER']
    
    devs_user = devices[:120]
    devs_corp = [d for d in devices if d['device_type'] == 'WEB_BROWSER']
    devs_atm = [d for d in devices if d['device_type'] == 'ATM_TERMINAL']
    devs_pos = [d for d in devices if d['device_type'] == 'POS_TERMINAL']

    for i, c in enumerate(customers):
        c['primary_device'] = devs_corp[i % len(devs_corp)] if c['customer_type'] == 'CORPORATE' else devs_user[i % len(devs_user)]
        c['favorite_beneficiaries'] = [bens_regular[(i * 3 + j) % len(bens_regular)] for j in range(3)]
        if c['customer_type'] == 'CORPORATE':
            c['favorite_beneficiaries'].extend([bens_corp[(i * 2 + j) % len(bens_corp)] for j in range(2)])

    def clamp_dt(dt):
        return min(dt, END_DATE)

    # -----------------------------------------------------
    # A. NORMAL TRANSACTIONS (~2,060 ROWS)
    # -----------------------------------------------------
    for c in customers:
        c_type = c['customer_type']
        c_seg = c['customer_segment']
        
        if c_type == 'CORPORATE':
            n_txns = 14
        elif c_type == 'SME':
            n_txns = 18
        else:
            n_txns = rng.randint(15, 17)
            
        for _ in range(n_txns):
            sec_offset = rng.randint(0, TIME_SPAN_SECONDS)
            hour = rng.randint(7, 20)
            minute = rng.randint(0, 59)
            second = rng.randint(0, 59)
            raw_dt = START_DATE + timedelta(seconds=sec_offset)
            txn_dt = clamp_dt(raw_dt.replace(hour=hour, minute=minute, second=second))
            
            if c_type == 'CORPORATE':
                ch = rng.choices(['SIOP', 'SWIFT_LIGHT', 'RAWBANK_ONLINE'], weights=[0.55, 0.35, 0.10])[0]
            elif c_type == 'SME':
                ch = rng.choices(['RAWBANK_ONLINE', 'ILLICOCASH', 'CARD', 'ATM', 'BRANCH', 'AGENT_BANKING'], weights=[0.34, 0.28, 0.18, 0.12, 0.04, 0.04])[0]
            else: # Retail
                if c_seg in ['PRESTIGE', 'INFINITE']:
                    ch = rng.choices(['RAWBANK_ONLINE', 'CARD', 'ATM', 'VISA_DIRECT', 'ILLICOCASH'], weights=[0.32, 0.32, 0.16, 0.10, 0.10])[0]
                elif c_seg == 'DIASPORA':
                    ch = rng.choices(['RAWBANK_ONLINE', 'VISA_DIRECT', 'CARD', 'ILLICOCASH'], weights=[0.40, 0.30, 0.20, 0.10])[0]
                elif c_seg in ['ACADEMIA', 'ECO']:
                    ch = rng.choices(['ILLICOCASH', 'CARD', 'ATM', 'AGENT_BANKING', 'RAWBANK_ONLINE'], weights=[0.48, 0.22, 0.15, 0.10, 0.05])[0]
                else:
                    ch = rng.choices(['ILLICOCASH', 'RAWBANK_ONLINE', 'CARD', 'ATM', 'BRANCH', 'VISA_DIRECT'], weights=[0.32, 0.26, 0.20, 0.12, 0.05, 0.05])[0]
                    
            currency = c['account_currency']
            fx_rate = FX_RATES[currency]
            
            if c_type == 'CORPORATE':
                amount_usd = rng.uniform(8000, 65000)
            elif c_type == 'SME':
                amount_usd = rng.uniform(200, 4500)
            elif c_seg in ['PRESTIGE', 'INFINITE']:
                amount_usd = rng.uniform(150, 2500)
            elif c_seg in ['PREMIUM', 'DIASPORA']:
                amount_usd = rng.uniform(50, 900)
            elif c_seg in ['ACADEMIA', 'ECO']:
                amount_usd = rng.uniform(5, 80)
            else:
                amount_usd = rng.uniform(15, 250)
                
            amount_usd = round(amount_usd, 2)
            amount_orig = round(amount_usd / fx_rate, 2)
            
            corp_payment = (c_type == 'CORPORATE' or ch in ['SIOP', 'SWIFT_LIGHT'])
            recurring = (rng.random() < 0.20)
            
            card_entry = 'NONE'
            m_id, m_name, m_cat = None, None, 'NONE'
            b_id, b_name, b_type, b_rel = None, None, 'NONE', 'NONE'
            tp_id, tp_type = 'NONE', 'NONE'
            auth_m = 'PIN'
            
            if ch == 'ILLICOCASH':
                sub_action = rng.choices(['AIRTIME', 'ILLICO_TO_ILLICO', 'ILLICO_TO_RAWBANK', 'PAY_TV', 'CARDLESS_ATM_WITHDRAWAL', 'SEND_CASH'], weights=[0.30, 0.25, 0.20, 0.10, 0.10, 0.05])[0]
                direction = 'DEBIT'
                payment_rail = 'ILLICOCASH' if sub_action in ['AIRTIME', 'ILLICO_TO_ILLICO', 'PAY_TV', 'SEND_CASH'] else 'RAWBANK_INTERNAL'
                if sub_action == 'AIRTIME':
                    ttype = 'AIRTIME_PURCHASE'
                    action = 'AIRTIME'
                    ben = rng.choice(bens_utility[:4])
                    b_id, b_name, b_type, b_rel = ben['beneficiary_id'], ben['beneficiary_name'], 'MERCHANT', 'MERCHANT'
                    m_id, m_name, m_cat = ben['linked_merchant_id'], ben['beneficiary_name'], ben['linked_merchant_category']
                    narration = f"SYN Illicocash airtime purchase {m_name}"
                elif sub_action == 'PAY_TV':
                    ttype = 'TV_PAYMENT'
                    action = 'PAY_TV'
                    ben = bens_utility[6]
                    b_id, b_name, b_type, b_rel = ben['beneficiary_id'], ben['beneficiary_name'], 'MERCHANT', 'MERCHANT'
                    m_id, m_name, m_cat = ben['linked_merchant_id'], ben['beneficiary_name'], ben['linked_merchant_category']
                    narration = f"SYN Illicocash TV subscription {m_name}"
                elif sub_action == 'CARDLESS_ATM_WITHDRAWAL':
                    ttype = 'CARDLESS_WITHDRAWAL'
                    action = 'CARDLESS_ATM_WITHDRAWAL'
                    payment_rail = 'CASH'
                    tp_id = f"ATM-SYN-{rng.randint(1, 15):03d}"
                    tp_type = 'RAWBANK_ATM'
                    narration = "SYN Illicocash cardless ATM withdrawal"
                else:
                    ttype = 'WALLET_TRANSFER'
                    action = sub_action
                    ben = rng.choice(c['favorite_beneficiaries']) if rng.random() < 0.60 else rng.choice(bens_regular)
                    b_id, b_name, b_type, b_rel = ben['beneficiary_id'], ben['beneficiary_name'], ben['beneficiary_type'], ben['beneficiary_relationship']
                    narration = f"SYN Illicocash transfer to {b_name}"
                dev = c['primary_device']
                auth_m = 'PIN'
                
            elif ch == 'RAWBANK_ONLINE':
                direction = 'DEBIT'
                sub_action = rng.choices(['RBO_ACCOUNT_TRANSFER', 'RBO_LOCAL_TRANSFER', 'RBO_INTL_TRANSFER', 'RBO_BILL_PAY'], weights=[0.40, 0.35, 0.15, 0.10])[0]
                action = sub_action
                if sub_action == 'RBO_INTL_TRANSFER':
                    ttype = 'INTERNATIONAL_TRANSFER'
                    payment_rail = 'SWIFT'
                    ben = rng.choice(c['favorite_beneficiaries']) if rng.random() < 0.60 else rng.choice(bens_regular)
                    b_id, b_name, b_type, b_rel = ben['beneficiary_id'], ben['beneficiary_name'], 'OTHER_BANK', ben['beneficiary_relationship']
                    narration = f"SYN RBO international transfer {b_name}"
                elif sub_action == 'RBO_LOCAL_TRANSFER':
                    ttype = 'ACCOUNT_TRANSFER'
                    payment_rail = 'LOCAL_INTERBANK'
                    ben = rng.choice(c['favorite_beneficiaries']) if rng.random() < 0.60 else rng.choice(bens_regular)
                    b_id, b_name, b_type, b_rel = ben['beneficiary_id'], ben['beneficiary_name'], 'OTHER_BANK', ben['beneficiary_relationship']
                    narration = f"SYN RBO local transfer {b_name}"
                elif sub_action == 'RBO_BILL_PAY':
                    ttype = 'BILL_PAYMENT'
                    payment_rail = 'RAWBANK_INTERNAL'
                    ben = rng.choice(bens_utility[:8])
                    b_id, b_name, b_type, b_rel = ben['beneficiary_id'], ben['beneficiary_name'], 'MERCHANT', 'MERCHANT'
                    m_id, m_name, m_cat = ben['linked_merchant_id'], ben['beneficiary_name'], ben['linked_merchant_category']
                    narration = f"SYN RBO bill payment {b_name}"
                else:
                    ttype = 'ACCOUNT_TRANSFER'
                    payment_rail = 'RAWBANK_INTERNAL'
                    ben = rng.choice(c['favorite_beneficiaries']) if rng.random() < 0.60 else rng.choice(bens_regular)
                    b_id, b_name, b_type, b_rel = ben['beneficiary_id'], ben['beneficiary_name'], 'RAWBANK_CUSTOMER', ben['beneficiary_relationship']
                    narration = f"SYN RBO internal transfer {b_name}"
                dev = c['primary_device']
                auth_m = 'PASSWORD'
                
            elif ch == 'CARD':
                ttype = 'CARD_PURCHASE'
                direction = 'DEBIT'
                sub_action = rng.choices(['VISA_POS', 'VISA_CONTACTLESS', 'VISA_ECOM'], weights=[0.50, 0.25, 0.25])[0]
                action = sub_action
                payment_rail = 'VISA'
                ben_merch = rng.choice(beneficiaries[:20])
                m_id, m_name, m_cat = ben_merch['linked_merchant_id'], ben_merch['beneficiary_name'], ben_merch['linked_merchant_category']
                b_id, b_name, b_type, b_rel = ben_merch['beneficiary_id'], ben_merch['beneficiary_name'], 'MERCHANT', 'MERCHANT'
                if sub_action == 'VISA_POS':
                    card_entry = 'CHIP'
                    tp_id = f"POS-SYN-{rng.randint(1, 25):03d}"
                    tp_type = 'POS'
                    dev = devs_pos[rng.randint(0, len(devs_pos)-1)]
                    auth_m = 'PIN'
                elif sub_action == 'VISA_CONTACTLESS':
                    card_entry = 'CONTACTLESS'
                    tp_id = f"POS-SYN-{rng.randint(1, 25):03d}"
                    tp_type = 'POS'
                    dev = devs_pos[rng.randint(0, len(devs_pos)-1)]
                    auth_m = 'NONE'
                else: # ECOM
                    card_entry = 'ECOM'
                    dev = c['primary_device']
                    auth_m = 'OTP'
                narration = f"SYN Card purchase at {m_name}"
                
            elif ch == 'ATM':
                direction = 'DEBIT'
                sub_action = rng.choices(['ATM_WITHDRAWAL', 'ATM_DEPOSIT'], weights=[0.80, 0.20])[0]
                action = sub_action
                payment_rail = 'CASH'
                card_entry = 'ATM'
                tp_id = f"ATM-SYN-{rng.randint(1, 20):03d}"
                tp_type = 'RAWBANK_ATM'
                dev = devs_atm[rng.randint(0, len(devs_atm)-1)]
                auth_m = 'PIN'
                if sub_action == 'ATM_WITHDRAWAL':
                    ttype = 'ATM_WITHDRAWAL'
                    narration = "SYN ATM cash withdrawal"
                else:
                    ttype = 'ATM_DEPOSIT'
                    direction = 'CREDIT'
                    narration = "SYN ATM cash deposit"
                    
            elif ch == 'VISA_DIRECT':
                ttype = 'VISA_DIRECT_TRANSFER'
                direction = 'DEBIT'
                action = 'VISA_DIRECT_SEND'
                payment_rail = 'VISA'
                ben = rng.choice(c['favorite_beneficiaries'])
                b_id, b_name, b_type, b_rel = ben['beneficiary_id'], ben['beneficiary_name'], 'CARD_RECIPIENT', ben['beneficiary_relationship']
                dev = c['primary_device']
                auth_m = 'OTP'
                narration = f"SYN Visa Direct remittance to {b_name}"
                
            elif ch in ['SIOP', 'SWIFT_LIGHT']:
                direction = 'DEBIT'
                corp_payment = True
                dev = c['primary_device']
                auth_m = 'MULTI_LEVEL_APPROVAL'
                if ch == 'SIOP':
                    action = rng.choice(['SIOP_SUPPLIER_PAYMENT', 'SIOP_SALARY_PAYMENT'])
                    payment_rail = 'LOCAL_INTERBANK' if action == 'SIOP_SUPPLIER_PAYMENT' else 'RAWBANK_INTERNAL'
                    ttype = 'SUPPLIER_PAYMENT' if action == 'SIOP_SUPPLIER_PAYMENT' else 'SALARY_PAYMENT'
                    ben = rng.choice(bens_corp)
                    b_id, b_name, b_type, b_rel = ben['beneficiary_id'], ben['beneficiary_name'], 'OTHER_BANK', 'SUPPLIER'
                    narration = f"SYN SIOP corporate invoice payment to {b_name}"
                else:
                    action = 'SWIFT_TRANSFER'
                    payment_rail = 'SWIFT'
                    ttype = 'INTERNATIONAL_TRANSFER'
                    ben = rng.choice(bens_corp)
                    b_id, b_name, b_type, b_rel = ben['beneficiary_id'], ben['beneficiary_name'], 'OTHER_BANK', 'SUPPLIER'
                    narration = f"SYN Swift Light international corporate transfer to {b_name}"
            else: # BRANCH / AGENT
                direction = 'DEBIT' if rng.random() < 0.6 else 'CREDIT'
                action = 'BRANCH_WITHDRAWAL' if direction == 'DEBIT' else 'BRANCH_DEPOSIT'
                payment_rail = 'CASH'
                ttype = 'CASH_WITHDRAWAL' if direction == 'DEBIT' else 'CASH_DEPOSIT'
                tp_id = f"BR-SYN-{rng.randint(1, 10):03d}"
                tp_type = 'BRANCH'
                dev = devs_pos[0]
                auth_m = 'NONE'
                narration = f"SYN Branch OTC cash {action.lower()}"
                
            is_cross_border = (action in ['RBO_INTL_TRANSFER', 'SWIFT_TRANSFER', 'ILLICO_INTL_TRANSFER'] or (card_entry == 'ECOM' and rng.random() < 0.35) or c_seg == 'DIASPORA')
            
            if c['home_city']:
                txn_city = c['home_city']
                txn_prov = c['home_province']
                ip_country = 'CD'
                ip_city = txn_city
            else:
                ip_country = c['home_country']
                ip_city = 'BRUSSELS' if ip_country == 'BE' else 'PARIS'
                txn_city = 'KINSHASA' if not is_cross_border else ip_city
                txn_prov = 'KINSHASA' if not is_cross_border else 'FOREIGN'
                
            dest_country = 'CD' if not is_cross_border else ('ZA' if c_type == 'CORPORATE' else ('BE' if c_seg == 'DIASPORA' else 'FR'))
            dest_city = txn_city if not is_cross_border else ('JOHANNESBURG' if dest_country == 'ZA' else 'PARIS')
            
            app_req = 2 if corp_payment else 0
            app_comp = 2 if corp_payment else 0
            
            events.append({
                'timestamp': txn_dt,
                'customer_id': c['customer_id'],
                'direction': direction,
                'amount': amount_orig,
                'currency': currency,
                'fx_rate_to_usd': fx_rate,
                'amount_usd_equiv': amount_usd,
                'channel': ch,
                'channel_action': action,
                'payment_rail': payment_rail,
                'transaction_type': ttype,
                'transaction_status': 'COMPLETED',
                'failure_reason': 'NONE',
                'is_cross_border': is_cross_border,
                'origin_country': c['home_country'] if c['home_country'] else 'CD',
                'destination_country': dest_country,
                'destination_city': dest_city,
                'narration': narration,
                'recurring_or_scheduled_flag': recurring,
                'corporate_payment_flag': corp_payment,
                'beneficiary_id': b_id,
                'beneficiary_name': b_name,
                'beneficiary_type': b_type,
                'beneficiary_relationship': b_rel,
                'merchant_id': m_id,
                'merchant_name': m_name,
                'merchant_category': m_cat,
                'card_entry_mode': card_entry,
                'touchpoint_id': tp_id,
                'touchpoint_type': tp_type,
                'txn_province': txn_prov,
                'txn_city': txn_city,
                'device': dev,
                'device_trusted_override': True,
                'ip_country': ip_country,
                'ip_city': ip_city,
                'ip_risk_score': rng.randint(2, 18),
                'vpn_proxy_flag': False,
                'login_failures_30m': 0,
                'password_reset_hours_ago': None,
                'sim_swap_days_ago': None,
                'auth_method': auth_m,
                'auth_success_flag': True,
                'approvals_required': app_req,
                'approvals_completed': app_comp,
                'scenario_type': 'NORMAL',
                'ground_truth_scenario': 'NONE',
                'ground_truth_class': 'NORMAL',
                'is_fraud_ground_truth': False,
            })

    # -----------------------------------------------------
    # B. INJECTED FRAUD SCENARIOS (~200 ROWS)
    # -----------------------------------------------------
    scenario_counter = 1
    
    # 1. ACCOUNT_TAKEOVER (ATO) - 8 victims = 24 events
    ato_victims = [customers[10], customers[25], customers[38], customers[52], customers[68], customers[80], customers[88], customers[95]]
    for vic in ato_victims:
        case_id = f"CASE-{scenario_counter:06d}"
        scenario_counter += 1
        ato_time = clamp_dt(START_DATE + timedelta(days=rng.randint(35, 75), hours=rng.randint(1, 4), minutes=rng.randint(10, 50)))
        new_ben = rng.choice(bens_regular[50:80])
        untrusted_dev = {
            'device_id': f"DEV-{rng.randint(121, 125):05d}",
            'device_type': 'WINDOWS',
            'device_os': 'Windows 11',
            'is_shared_mule_device': True,
            'is_terminal': False,
            'first_seen_platform_days': 0,
        }
        
        amount_usd = round(vic['expected_median_usd'] * rng.uniform(11.0, 18.0), 2)
        curr = vic['account_currency']
        fx = FX_RATES[curr]
        
        for sub_step in range(3):
            sub_t = clamp_dt(ato_time + timedelta(minutes=sub_step * 5))
            events.append({
                'timestamp': sub_t,
                'customer_id': vic['customer_id'],
                'direction': 'DEBIT',
                'amount': round(amount_usd / fx, 2),
                'currency': curr,
                'fx_rate_to_usd': fx,
                'amount_usd_equiv': amount_usd,
                'channel': 'RAWBANK_ONLINE',
                'channel_action': 'RBO_LOCAL_TRANSFER',
                'payment_rail': 'LOCAL_INTERBANK',
                'transaction_type': 'ACCOUNT_TRANSFER',
                'transaction_status': 'HELD' if sub_step >= 1 else 'COMPLETED',
                'failure_reason': 'MANUAL_HOLD' if sub_step >= 1 else 'NONE',
                'is_cross_border': False,
                'origin_country': 'CD',
                'destination_country': 'CD',
                'destination_city': 'KINSHASA',
                'narration': f"SYN Urgent transfer to {new_ben['beneficiary_name']}",
                'recurring_or_scheduled_flag': False,
                'corporate_payment_flag': False,
                'beneficiary_id': new_ben['beneficiary_id'],
                'beneficiary_name': new_ben['beneficiary_name'],
                'beneficiary_type': 'OTHER_BANK',
                'beneficiary_relationship': 'UNKNOWN',
                'merchant_id': None,
                'merchant_name': None,
                'merchant_category': 'NONE',
                'card_entry_mode': 'NONE',
                'touchpoint_id': 'NONE',
                'touchpoint_type': 'NONE',
                'txn_province': 'KINSHASA',
                'txn_city': 'KINSHASA',
                'device': untrusted_dev,
                'device_trusted_override': False,
                'device_first_seen_override': 0,
                'ip_country': 'CD',
                'ip_city': 'KINSHASA',
                'ip_risk_score': rng.randint(75, 92),
                'vpn_proxy_flag': True,
                'login_failures_30m': rng.randint(3, 5),
                'password_reset_hours_ago': round(rng.uniform(0.5, 3.5), 2),
                'sim_swap_days_ago': rng.randint(1, 3),
                'auth_method': 'PASSWORD',
                'auth_success_flag': True,
                'approvals_required': 0,
                'approvals_completed': 0,
                'scenario_type': 'FRAUD',
                'ground_truth_scenario': 'ACCOUNT_TAKEOVER',
                'ground_truth_class': 'FRAUD',
                'is_fraud_ground_truth': True,
                'synthetic_case_id': case_id,
                'expected_rules': 'FR-01|FR-02|FR-03|FR-04|FR-05|FR-06|FR-07|FR-12|FR-17|FR-18',
            })

    # 2. NEW_BENEFICIARY_HIGH_VALUE - 10 customers, 2 txns each = 20 events
    nb_customers = [customers[14], customers[28], customers[42], customers[56], customers[70], customers[84], customers[92], customers[100], customers[103], customers[107]]
    for vic in nb_customers:
        case_id = f"CASE-{scenario_counter:06d}"
        scenario_counter += 1
        base_time = clamp_dt(START_DATE + timedelta(days=rng.randint(20, 75), hours=rng.randint(9, 17)))
        new_ben = rng.choice(bens_regular[60:90])
        untrusted_dev = devs_user[rng.randint(0, len(devs_user)-1)]
        amount_usd = round(vic['expected_median_usd'] * rng.uniform(8.5, 14.0), 2)
        curr = vic['account_currency']
        fx = FX_RATES[curr]
        
        for step in range(2):
            events.append({
                'timestamp': clamp_dt(base_time + timedelta(minutes=step * 15)),
                'customer_id': vic['customer_id'],
                'direction': 'DEBIT',
                'amount': round(amount_usd / fx, 2),
                'currency': curr,
                'fx_rate_to_usd': fx,
                'amount_usd_equiv': amount_usd,
                'channel': 'RAWBANK_ONLINE',
                'channel_action': 'RBO_LOCAL_TRANSFER',
                'payment_rail': 'LOCAL_INTERBANK',
                'transaction_type': 'ACCOUNT_TRANSFER',
                'transaction_status': 'PENDING' if step == 1 else 'COMPLETED',
                'failure_reason': 'BENEFICIARY_BLOCKED' if step == 1 else 'NONE',
                'is_cross_border': False,
                'origin_country': 'CD',
                'destination_country': 'CD',
                'destination_city': 'LUBUMBASHI',
                'narration': f"SYN Ad-hoc new vendor payment {new_ben['beneficiary_name']}",
                'recurring_or_scheduled_flag': False,
                'corporate_payment_flag': False,
                'beneficiary_id': new_ben['beneficiary_id'],
                'beneficiary_name': new_ben['beneficiary_name'],
                'beneficiary_type': 'OTHER_BANK',
                'beneficiary_relationship': 'UNKNOWN',
                'merchant_id': None,
                'merchant_name': None,
                'merchant_category': 'NONE',
                'card_entry_mode': 'NONE',
                'touchpoint_id': 'NONE',
                'touchpoint_type': 'NONE',
                'txn_province': vic['home_province'] or 'KINSHASA',
                'txn_city': vic['home_city'] or 'KINSHASA',
                'device': untrusted_dev,
                'device_trusted_override': False,
                'device_first_seen_override': 0,
                'ip_country': 'CD',
                'ip_city': vic['home_city'] or 'KINSHASA',
                'ip_risk_score': rng.randint(45, 65),
                'vpn_proxy_flag': False,
                'login_failures_30m': 0,
                'password_reset_hours_ago': None,
                'sim_swap_days_ago': None,
                'auth_method': 'PASSWORD',
                'auth_success_flag': True,
                'approvals_required': 0,
                'approvals_completed': 0,
                'scenario_type': 'FRAUD',
                'ground_truth_scenario': 'NEW_BENEFICIARY_HIGH_VALUE',
                'ground_truth_class': 'FRAUD',
                'is_fraud_ground_truth': True,
                'synthetic_case_id': case_id,
                'expected_rules': 'FR-01|FR-02|FR-03|FR-04|FR-17',
            })

    # 3. VELOCITY_BURST - 6 customers, 5 rapid transactions each = 30 events
    vel_customers = [customers[5], customers[18], customers[33], customers[47], customers[62], customers[77]]
    for vic in vel_customers:
        case_id = f"CASE-{scenario_counter:06d}"
        scenario_counter += 1
        base_time = clamp_dt(START_DATE + timedelta(days=rng.randint(15, 75), hours=rng.randint(10, 18), minutes=rng.randint(0, 40)))
        for step in range(5):
            txn_time = clamp_dt(base_time + timedelta(minutes=step * 2, seconds=rng.randint(10, 45)))
            amount_usd = round(vic['expected_median_usd'] * rng.uniform(3.0, 5.5), 2)
            curr = vic['account_currency']
            fx = FX_RATES[curr]
            
            events.append({
                'timestamp': txn_time,
                'customer_id': vic['customer_id'],
                'direction': 'DEBIT',
                'amount': round(amount_usd / fx, 2),
                'currency': curr,
                'fx_rate_to_usd': fx,
                'amount_usd_equiv': amount_usd,
                'channel': 'ILLICOCASH',
                'channel_action': 'ILLICO_TO_ILLICO',
                'payment_rail': 'ILLICOCASH',
                'transaction_type': 'WALLET_TRANSFER',
                'transaction_status': 'COMPLETED' if step < 4 else 'DECLINED',
                'failure_reason': 'NONE' if step < 4 else 'LIMIT_EXCEEDED',
                'is_cross_border': False,
                'origin_country': 'CD',
                'destination_country': 'CD',
                'destination_city': vic['home_city'] or 'KINSHASA',
                'narration': f"SYN Rapid cash out {step+1}",
                'recurring_or_scheduled_flag': False,
                'corporate_payment_flag': False,
                'beneficiary_id': bens_regular[step % len(bens_regular)]['beneficiary_id'],
                'beneficiary_name': bens_regular[step % len(bens_regular)]['beneficiary_name'],
                'beneficiary_type': 'MOBILE_WALLET',
                'beneficiary_relationship': 'UNKNOWN',
                'merchant_id': None,
                'merchant_name': None,
                'merchant_category': 'NONE',
                'card_entry_mode': 'NONE',
                'touchpoint_id': 'NONE',
                'touchpoint_type': 'NONE',
                'txn_province': vic['home_province'] or 'KINSHASA',
                'txn_city': vic['home_city'] or 'KINSHASA',
                'device': vic['primary_device'],
                'device_trusted_override': True,
                'ip_country': 'CD',
                'ip_city': vic['home_city'] or 'KINSHASA',
                'ip_risk_score': rng.randint(30, 60),
                'vpn_proxy_flag': False,
                'login_failures_30m': 0,
                'password_reset_hours_ago': None,
                'sim_swap_days_ago': None,
                'auth_method': 'PIN',
                'auth_success_flag': True,
                'approvals_required': 0,
                'approvals_completed': 0,
                'scenario_type': 'FRAUD' if step >= 3 else 'NORMAL',
                'ground_truth_scenario': 'VELOCITY_BURST' if step >= 3 else 'NONE',
                'ground_truth_class': 'FRAUD' if step >= 3 else 'NORMAL',
                'is_fraud_ground_truth': (step >= 3),
                'synthetic_case_id': case_id,
                'expected_rules': 'FR-08|FR-09|FR-01',
            })

    # 4. IMPOSSIBLE_TRAVEL - 8 customers, pair of events = 16 events
    imp_customers = [customers[8], customers[22], customers[36], customers[49], customers[64], customers[78], customers[86], customers[94]]
    for vic in imp_customers:
        case_id = f"CASE-{scenario_counter:06d}"
        scenario_counter += 1
        t1 = clamp_dt(START_DATE + timedelta(days=rng.randint(25, 75), hours=rng.randint(11, 16), minutes=10))
        t2 = clamp_dt(t1 + timedelta(minutes=rng.randint(20, 35)))
        
        events.append({
            'timestamp': t1,
            'customer_id': vic['customer_id'],
            'direction': 'DEBIT',
            'amount': 50.0,
            'currency': 'USD',
            'fx_rate_to_usd': 1.0,
            'amount_usd_equiv': 50.0,
            'channel': 'ATM',
            'channel_action': 'ATM_WITHDRAWAL',
            'payment_rail': 'CASH',
            'transaction_type': 'ATM_WITHDRAWAL',
            'transaction_status': 'COMPLETED',
            'failure_reason': 'NONE',
            'is_cross_border': False,
            'origin_country': 'CD',
            'destination_country': 'CD',
            'destination_city': 'KINSHASA',
            'narration': "SYN Normal ATM withdrawal Kinshasa",
            'recurring_or_scheduled_flag': False,
            'corporate_payment_flag': False,
            'beneficiary_id': None,
            'beneficiary_name': None,
            'beneficiary_type': 'NONE',
            'beneficiary_relationship': 'NONE',
            'merchant_id': None,
            'merchant_name': None,
            'merchant_category': 'NONE',
            'card_entry_mode': 'ATM',
            'touchpoint_id': 'ATM-SYN-002',
            'touchpoint_type': 'RAWBANK_ATM',
            'txn_province': 'KINSHASA',
            'txn_city': 'KINSHASA',
            'device': devs_atm[0],
            'device_trusted_override': True,
            'ip_country': 'CD',
            'ip_city': 'KINSHASA',
            'ip_risk_score': 10,
            'vpn_proxy_flag': False,
            'login_failures_30m': 0,
            'password_reset_hours_ago': None,
            'sim_swap_days_ago': None,
            'auth_method': 'PIN',
            'auth_success_flag': True,
            'approvals_required': 0,
            'approvals_completed': 0,
            'scenario_type': 'NORMAL',
            'ground_truth_scenario': 'NONE',
            'ground_truth_class': 'NORMAL',
            'is_fraud_ground_truth': False,
        })
        
        ben_merch = beneficiaries[8] # Hyper Psaro Lubumbashi
        events.append({
            'timestamp': t2,
            'customer_id': vic['customer_id'],
            'direction': 'DEBIT',
            'amount': 2200.0,
            'currency': 'USD',
            'fx_rate_to_usd': 1.0,
            'amount_usd_equiv': 2200.0,
            'channel': 'CARD',
            'channel_action': 'VISA_POS',
            'payment_rail': 'VISA',
            'transaction_type': 'CARD_PURCHASE',
            'transaction_status': 'HELD',
            'failure_reason': 'DEVICE_CHALLENGE',
            'is_cross_border': False,
            'origin_country': 'CD',
            'destination_country': 'CD',
            'destination_city': 'LUBUMBASHI',
            'narration': f"SYN POS Purchase Lubumbashi High Value at {ben_merch['beneficiary_name']}",
            'recurring_or_scheduled_flag': False,
            'corporate_payment_flag': False,
            'beneficiary_id': ben_merch['beneficiary_id'],
            'beneficiary_name': ben_merch['beneficiary_name'],
            'beneficiary_type': 'MERCHANT',
            'beneficiary_relationship': 'MERCHANT',
            'merchant_id': ben_merch['linked_merchant_id'],
            'merchant_name': ben_merch['beneficiary_name'],
            'merchant_category': ben_merch['linked_merchant_category'],
            'card_entry_mode': 'CHIP',
            'touchpoint_id': 'POS-SYN-019',
            'touchpoint_type': 'POS',
            'txn_province': 'HAUT_KATANGA',
            'txn_city': 'LUBUMBASHI',
            'device': devs_pos[1],
            'device_trusted_override': False,
            'ip_country': 'CD',
            'ip_city': 'LUBUMBASHI',
            'ip_risk_score': 72,
            'vpn_proxy_flag': False,
            'login_failures_30m': 1,
            'password_reset_hours_ago': None,
            'sim_swap_days_ago': None,
            'auth_method': 'PIN',
            'auth_success_flag': True,
            'approvals_required': 0,
            'approvals_completed': 0,
            'scenario_type': 'FRAUD',
            'ground_truth_scenario': 'IMPOSSIBLE_TRAVEL',
            'ground_truth_class': 'FRAUD',
            'is_fraud_ground_truth': True,
            'synthetic_case_id': case_id,
            'expected_rules': 'FR-10|FR-11|FR-01',
        })

    # 5. SHARED_DEVICE - 6 unrelated customers using DEV-00121 = 18 events
    shared_dev = devices[120]
    shared_victims = [customers[12], customers[31], customers[48], customers[65], customers[79], customers[91]]
    shared_base_time = clamp_dt(START_DATE + timedelta(days=60, hours=10))
    case_id = f"CASE-{scenario_counter:06d}"
    scenario_counter += 1
    for s_idx, vic in enumerate(shared_victims):
        for rep in range(3):
            txn_time = clamp_dt(shared_base_time + timedelta(hours=s_idx * 4 + rep, minutes=15))
            amount_usd = round(vic['expected_median_usd'] * rng.uniform(4.5, 7.5), 2)
            curr = vic['account_currency']
            fx = FX_RATES[curr]
            
            events.append({
                'timestamp': txn_time,
                'customer_id': vic['customer_id'],
                'direction': 'DEBIT',
                'amount': round(amount_usd / fx, 2),
                'currency': curr,
                'fx_rate_to_usd': fx,
                'amount_usd_equiv': amount_usd,
                'channel': 'RAWBANK_ONLINE',
                'channel_action': 'RBO_LOCAL_TRANSFER',
                'payment_rail': 'LOCAL_INTERBANK',
                'transaction_type': 'ACCOUNT_TRANSFER',
                'transaction_status': 'PENDING' if s_idx >= 2 else 'COMPLETED',
                'failure_reason': 'MANUAL_HOLD' if s_idx >= 2 else 'NONE',
                'is_cross_border': False,
                'origin_country': 'CD',
                'destination_country': 'CD',
                'destination_city': 'KINSHASA',
                'narration': f"SYN Shared device transfer customer {vic['customer_id']}",
                'recurring_or_scheduled_flag': False,
                'corporate_payment_flag': False,
                'beneficiary_id': bens_mule[0]['beneficiary_id'],
                'beneficiary_name': bens_mule[0]['beneficiary_name'],
                'beneficiary_type': 'OTHER_BANK',
                'beneficiary_relationship': 'UNKNOWN',
                'merchant_id': None,
                'merchant_name': None,
                'merchant_category': 'NONE',
                'card_entry_mode': 'NONE',
                'touchpoint_id': 'NONE',
                'touchpoint_type': 'NONE',
                'txn_province': 'KINSHASA',
                'txn_city': 'KINSHASA',
                'device': shared_dev,
                'device_trusted_override': False,
                'ip_country': 'CD',
                'ip_city': 'KINSHASA',
                'ip_risk_score': 65,
                'vpn_proxy_flag': True,
                'login_failures_30m': 0,
                'password_reset_hours_ago': None,
                'sim_swap_days_ago': None,
                'auth_method': 'PASSWORD',
                'auth_success_flag': True,
                'approvals_required': 0,
                'approvals_completed': 0,
                'scenario_type': 'FRAUD' if s_idx >= 2 else 'NORMAL',
                'ground_truth_scenario': 'SHARED_DEVICE' if s_idx >= 2 else 'NONE',
                'ground_truth_class': 'FRAUD' if s_idx >= 2 else 'NORMAL',
                'is_fraud_ground_truth': (s_idx >= 2),
                'synthetic_case_id': case_id,
                'expected_rules': 'FR-13|FR-04|FR-12|FR-01',
            })

    # 6. MULE_BENEFICIARY - 8 unrelated customers sending to BEN-00021 within 20 days = 24 events
    mule_ben = bens_mule[0]
    mule_senders = [customers[3], customers[17], customers[30], customers[44], customers[58], customers[72], customers[81], customers[99]]
    mule_base_time = clamp_dt(START_DATE + timedelta(days=50, hours=9))
    case_id = f"CASE-{scenario_counter:06d}"
    scenario_counter += 1
    for m_idx, vic in enumerate(mule_senders):
        for rep in range(3):
            txn_time = clamp_dt(mule_base_time + timedelta(days=m_idx * 2, hours=rep * 2))
            amount_usd = round(vic['expected_median_usd'] * rng.uniform(3.5, 6.5), 2)
            curr = vic['account_currency']
            fx = FX_RATES[curr]
            
            events.append({
                'timestamp': txn_time,
                'customer_id': vic['customer_id'],
                'direction': 'DEBIT',
                'amount': round(amount_usd / fx, 2),
                'currency': curr,
                'fx_rate_to_usd': fx,
                'amount_usd_equiv': amount_usd,
                'channel': 'ILLICOCASH',
                'channel_action': 'ILLICO_TO_ILLICO',
                'payment_rail': 'ILLICOCASH',
                'transaction_type': 'WALLET_TRANSFER',
                'transaction_status': 'COMPLETED',
                'failure_reason': 'NONE',
                'is_cross_border': False,
                'origin_country': 'CD',
                'destination_country': 'CD',
                'destination_city': 'KINSHASA',
                'narration': f"SYN Funnel payment to mule {mule_ben['beneficiary_name']}",
                'recurring_or_scheduled_flag': False,
                'corporate_payment_flag': False,
                'beneficiary_id': mule_ben['beneficiary_id'],
                'beneficiary_name': mule_ben['beneficiary_name'],
                'beneficiary_type': 'OTHER_BANK',
                'beneficiary_relationship': 'UNKNOWN',
                'merchant_id': None,
                'merchant_name': None,
                'merchant_category': 'NONE',
                'card_entry_mode': 'NONE',
                'touchpoint_id': 'NONE',
                'touchpoint_type': 'NONE',
                'txn_province': vic['home_province'] or 'KINSHASA',
                'txn_city': vic['home_city'] or 'KINSHASA',
                'device': vic['primary_device'],
                'device_trusted_override': True,
                'ip_country': 'CD',
                'ip_city': vic['home_city'] or 'KINSHASA',
                'ip_risk_score': 45,
                'vpn_proxy_flag': False,
                'login_failures_30m': 0,
                'password_reset_hours_ago': None,
                'sim_swap_days_ago': None,
                'auth_method': 'PIN',
                'auth_success_flag': True,
                'approvals_required': 0,
                'approvals_completed': 0,
                'scenario_type': 'FRAUD' if m_idx >= 4 else 'NORMAL',
                'ground_truth_scenario': 'MULE_BENEFICIARY' if m_idx >= 4 else 'NONE',
                'ground_truth_class': 'FRAUD' if m_idx >= 4 else 'NORMAL',
                'is_fraud_ground_truth': (m_idx >= 4),
                'synthetic_case_id': case_id,
                'expected_rules': 'FR-14|FR-03|FR-01',
            })

    # 7. CARD_NOT_PRESENT (CNP) - 8 customers, 2 anomalous transactions = 16 events
    cnp_victims = [customers[7], customers[21], customers[35], customers[46], customers[60], customers[74], customers[87], customers[96]]
    ben_amazon = beneficiaries[14]
    for vic in cnp_victims:
        case_id = f"CASE-{scenario_counter:06d}"
        scenario_counter += 1
        base_t = clamp_dt(START_DATE + timedelta(days=rng.randint(30, 75), hours=2, minutes=rng.randint(15, 45)))
        for step in range(2):
            txn_time = clamp_dt(base_t + timedelta(minutes=step * 10))
            amount_usd = round(vic['expected_median_usd'] * rng.uniform(4.5, 8.0), 2)
            
            events.append({
                'timestamp': txn_time,
                'customer_id': vic['customer_id'],
                'direction': 'DEBIT',
                'amount': amount_usd,
                'currency': 'USD',
                'fx_rate_to_usd': 1.0,
                'amount_usd_equiv': amount_usd,
                'channel': 'CARD',
                'channel_action': 'VISA_ECOM',
                'payment_rail': 'VISA',
                'transaction_type': 'CARD_PURCHASE',
                'transaction_status': 'DECLINED' if step == 1 else 'COMPLETED',
                'failure_reason': 'AUTH_FAILED' if step == 1 else 'NONE',
                'is_cross_border': True,
                'origin_country': 'FR',
                'destination_country': 'LU',
                'destination_city': 'LUXEMBOURG',
                'narration': f"SYN ECOM high value card unauthorized {ben_amazon['beneficiary_name']}",
                'recurring_or_scheduled_flag': False,
                'corporate_payment_flag': False,
                'beneficiary_id': ben_amazon['beneficiary_id'],
                'beneficiary_name': ben_amazon['beneficiary_name'],
                'beneficiary_type': 'MERCHANT',
                'beneficiary_relationship': 'MERCHANT',
                'merchant_id': ben_amazon['linked_merchant_id'],
                'merchant_name': ben_amazon['beneficiary_name'],
                'merchant_category': ben_amazon['linked_merchant_category'],
                'card_entry_mode': 'ECOM',
                'touchpoint_id': 'NONE',
                'touchpoint_type': 'NONE',
                'txn_province': 'FOREIGN',
                'txn_city': 'FOREIGN_CITY',
                'device': vic['primary_device'],
                'device_trusted_override': False,
                'ip_country': 'NL',
                'ip_city': 'AMSTERDAM',
                'ip_risk_score': 84,
                'vpn_proxy_flag': True,
                'login_failures_30m': 2,
                'password_reset_hours_ago': None,
                'sim_swap_days_ago': None,
                'auth_method': 'OTP',
                'auth_success_flag': (step == 0),
                'approvals_required': 0,
                'approvals_completed': 0,
                'scenario_type': 'FRAUD',
                'ground_truth_scenario': 'CARD_NOT_PRESENT',
                'ground_truth_class': 'FRAUD',
                'is_fraud_ground_truth': True,
                'synthetic_case_id': case_id,
                'expected_rules': 'FR-15|FR-11|FR-12|FR-16|FR-01',
            })

    # 8. CREDENTIAL_RESET_ABUSE - 8 customers, 2 txns = 16 events
    cred_victims = [customers[11], customers[26], customers[40], customers[54], customers[69], customers[83], customers[93], customers[97]]
    for vic in cred_victims:
        case_id = f"CASE-{scenario_counter:06d}"
        scenario_counter += 1
        base_t = clamp_dt(START_DATE + timedelta(days=rng.randint(35, 75), hours=rng.randint(8, 14), minutes=20))
        amount_usd = round(vic['expected_median_usd'] * rng.uniform(6.0, 9.5), 2)
        curr = vic['account_currency']
        fx = FX_RATES[curr]
        
        for step in range(2):
            events.append({
                'timestamp': clamp_dt(base_t + timedelta(minutes=step * 20)),
                'customer_id': vic['customer_id'],
                'direction': 'DEBIT',
                'amount': round(amount_usd / fx, 2),
                'currency': curr,
                'fx_rate_to_usd': fx,
                'amount_usd_equiv': amount_usd,
                'channel': 'RAWBANK_ONLINE',
                'channel_action': 'RBO_LOCAL_TRANSFER',
                'payment_rail': 'LOCAL_INTERBANK',
                'transaction_type': 'ACCOUNT_TRANSFER',
                'transaction_status': 'HELD',
                'failure_reason': 'MANUAL_HOLD',
                'is_cross_border': False,
                'origin_country': 'CD',
                'destination_country': 'CD',
                'destination_city': 'KINSHASA',
                'narration': "SYN Immediate outbound post credential reset",
                'recurring_or_scheduled_flag': False,
                'corporate_payment_flag': False,
                'beneficiary_id': bens_regular[75]['beneficiary_id'],
                'beneficiary_name': bens_regular[75]['beneficiary_name'],
                'beneficiary_type': 'OTHER_BANK',
                'beneficiary_relationship': 'UNKNOWN',
                'merchant_id': None,
                'merchant_name': None,
                'merchant_category': 'NONE',
                'card_entry_mode': 'NONE',
                'touchpoint_id': 'NONE',
                'touchpoint_type': 'NONE',
                'txn_province': vic['home_province'] or 'KINSHASA',
                'txn_city': vic['home_city'] or 'KINSHASA',
                'device': vic['primary_device'],
                'device_trusted_override': False,
                'device_first_seen_override': 0,
                'ip_country': 'CD',
                'ip_city': vic['home_city'] or 'KINSHASA',
                'ip_risk_score': 68,
                'vpn_proxy_flag': True,
                'login_failures_30m': 1,
                'password_reset_hours_ago': 2.1,
                'sim_swap_days_ago': None,
                'auth_method': 'PASSWORD',
                'auth_success_flag': True,
                'approvals_required': 0,
                'approvals_completed': 0,
                'scenario_type': 'FRAUD',
                'ground_truth_scenario': 'CREDENTIAL_RESET_ABUSE',
                'ground_truth_class': 'FRAUD',
                'is_fraud_ground_truth': True,
                'synthetic_case_id': case_id,
                'expected_rules': 'FR-06|FR-04|FR-18|FR-01',
            })

    # 9. CORPORATE_APPROVAL_ANOMALY - 6 corporate customers, 2 txns = 12 events
    corp_victims = customers[108:114]
    for vic in corp_victims:
        case_id = f"CASE-{scenario_counter:06d}"
        scenario_counter += 1
        base_t = clamp_dt(START_DATE + timedelta(days=rng.randint(20, 75), hours=rng.randint(9, 16)))
        amount_usd = round(rng.uniform(45000, 180000), 2)
        ben = bens_corp[rng.randint(0, len(bens_corp)-1)]
        
        for step in range(2):
            events.append({
                'timestamp': clamp_dt(base_t + timedelta(days=step * 3)),
                'customer_id': vic['customer_id'],
                'direction': 'DEBIT',
                'amount': amount_usd,
                'currency': 'USD',
                'fx_rate_to_usd': 1.0,
                'amount_usd_equiv': amount_usd,
                'channel': 'SIOP',
                'channel_action': 'SIOP_SUPPLIER_PAYMENT',
                'payment_rail': 'LOCAL_INTERBANK',
                'transaction_type': 'SUPPLIER_PAYMENT',
                'transaction_status': 'HELD',
                'failure_reason': 'MANUAL_HOLD',
                'is_cross_border': False,
                'origin_country': 'CD',
                'destination_country': 'CD',
                'destination_city': 'KOLWEZI',
                'narration': f"SYN Incomplete approval flow for supplier {ben['beneficiary_name']}",
                'recurring_or_scheduled_flag': False,
                'corporate_payment_flag': True,
                'beneficiary_id': ben['beneficiary_id'],
                'beneficiary_name': ben['beneficiary_name'],
                'beneficiary_type': 'OTHER_BANK',
                'beneficiary_relationship': 'SUPPLIER',
                'merchant_id': None,
                'merchant_name': None,
                'merchant_category': 'MINING_SUPPLY',
                'card_entry_mode': 'NONE',
                'touchpoint_id': 'NONE',
                'touchpoint_type': 'NONE',
                'txn_province': vic['home_province'] or 'LUALABA',
                'txn_city': vic['home_city'] or 'KOLWEZI',
                'device': vic['primary_device'],
                'device_trusted_override': True,
                'ip_country': 'CD',
                'ip_city': vic['home_city'] or 'KOLWEZI',
                'ip_risk_score': 35,
                'vpn_proxy_flag': False,
                'login_failures_30m': 0,
                'password_reset_hours_ago': None,
                'sim_swap_days_ago': None,
                'auth_method': 'MULTI_LEVEL_APPROVAL',
                'auth_success_flag': True,
                'approvals_required': 2,
                'approvals_completed': 1,
                'scenario_type': 'FRAUD',
                'ground_truth_scenario': 'CORPORATE_APPROVAL_ANOMALY',
                'ground_truth_class': 'FRAUD',
                'is_fraud_ground_truth': True,
                'synthetic_case_id': case_id,
                'expected_rules': 'FR-20',
            })

    # 10. CROSS_BORDER_ANOMALY - 8 customers, 2 txns = 16 events
    cb_victims = [customers[15], customers[29], customers[43], customers[57], customers[71], customers[85], customers[98], customers[101]]
    for vic in cb_victims:
        case_id = f"CASE-{scenario_counter:06d}"
        scenario_counter += 1
        base_t = clamp_dt(START_DATE + timedelta(days=rng.randint(25, 75), hours=rng.randint(10, 17)))
        amount_usd = round(vic['expected_median_usd'] * rng.uniform(4.0, 7.5), 2)
        curr = 'USD'
        new_ben = rng.choice(bens_regular[60:])
        
        for step in range(2):
            events.append({
                'timestamp': clamp_dt(base_t + timedelta(days=step * 2)),
                'customer_id': vic['customer_id'],
                'direction': 'DEBIT',
                'amount': amount_usd,
                'currency': curr,
                'fx_rate_to_usd': 1.0,
                'amount_usd_equiv': amount_usd,
                'channel': 'RAWBANK_ONLINE',
                'channel_action': 'RBO_INTL_TRANSFER',
                'payment_rail': 'SWIFT',
                'transaction_type': 'INTERNATIONAL_TRANSFER',
                'transaction_status': 'PENDING',
                'failure_reason': 'BENEFICIARY_BLOCKED',
                'is_cross_border': True,
                'origin_country': 'CD',
                'destination_country': 'AE',
                'destination_city': 'DUBAI',
                'narration': f"SYN High value novel cross-border transfer to {new_ben['beneficiary_name']}",
                'recurring_or_scheduled_flag': False,
                'corporate_payment_flag': False,
                'beneficiary_id': new_ben['beneficiary_id'],
                'beneficiary_name': new_ben['beneficiary_name'],
                'beneficiary_type': 'OTHER_BANK',
                'beneficiary_relationship': 'UNKNOWN',
                'merchant_id': None,
                'merchant_name': None,
                'merchant_category': 'NONE',
                'card_entry_mode': 'NONE',
                'touchpoint_id': 'NONE',
                'touchpoint_type': 'NONE',
                'txn_province': vic['home_province'] or 'KINSHASA',
                'txn_city': vic['home_city'] or 'KINSHASA',
                'device': vic['primary_device'],
                'device_trusted_override': False,
                'device_first_seen_override': 0,
                'ip_country': 'CD',
                'ip_city': vic['home_city'] or 'KINSHASA',
                'ip_risk_score': 62,
                'vpn_proxy_flag': True,
                'login_failures_30m': 1,
                'password_reset_hours_ago': None,
                'sim_swap_days_ago': None,
                'auth_method': 'PASSWORD',
                'auth_success_flag': True,
                'approvals_required': 0,
                'approvals_completed': 0,
                'scenario_type': 'FRAUD',
                'ground_truth_scenario': 'CROSS_BORDER_ANOMALY',
                'ground_truth_class': 'FRAUD',
                'is_fraud_ground_truth': True,
                'synthetic_case_id': case_id,
                'expected_rules': 'FR-19|FR-03|FR-11|FR-12|FR-01',
            })

    # -----------------------------------------------------
    # C. BENIGN ANOMALIES & FALSE POSITIVE CHALLENGES (~220 ROWS)
    # -----------------------------------------------------
    # Benign 1: New Medical / Tuition / Vendor Payment = 64 events
    for i in range(32):
        c = customers[(i * 3 + 1) % len(customers)]
        t = clamp_dt(START_DATE + timedelta(days=rng.randint(20, 75), hours=rng.randint(10, 16)))
        new_ben = rng.choice(bens_regular[40:70])
        amount_usd = round(c['expected_median_usd'] * rng.uniform(5.5, 7.5), 2)
        curr = c['account_currency']
        fx = FX_RATES[curr]
        
        for sub_i in range(2):
            events.append({
                'timestamp': clamp_dt(t + timedelta(days=sub_i * 10)),
                'customer_id': c['customer_id'],
                'direction': 'DEBIT',
                'amount': round(amount_usd / fx, 2),
                'currency': curr,
                'fx_rate_to_usd': fx,
                'amount_usd_equiv': amount_usd,
                'channel': 'RAWBANK_ONLINE',
                'channel_action': 'RBO_LOCAL_TRANSFER',
                'payment_rail': 'LOCAL_INTERBANK',
                'transaction_type': 'ACCOUNT_TRANSFER',
                'transaction_status': 'COMPLETED',
                'failure_reason': 'NONE',
                'is_cross_border': False,
                'origin_country': 'CD',
                'destination_country': 'CD',
                'destination_city': c['home_city'] or 'KINSHASA',
                'narration': f"SYN Legitimate hospital clinic tuition fee {new_ben['beneficiary_name']}",
                'recurring_or_scheduled_flag': False,
                'corporate_payment_flag': False,
                'beneficiary_id': new_ben['beneficiary_id'],
                'beneficiary_name': new_ben['beneficiary_name'],
                'beneficiary_type': 'OTHER_BANK',
                'beneficiary_relationship': 'KNOWN_PERSON',
                'merchant_id': None,
                'merchant_name': None,
                'merchant_category': 'NONE',
                'card_entry_mode': 'NONE',
                'touchpoint_id': 'NONE',
                'touchpoint_type': 'NONE',
                'txn_province': c['home_province'] or 'KINSHASA',
                'txn_city': c['home_city'] or 'KINSHASA',
                'device': c['primary_device'],
                'device_trusted_override': True,
                'ip_country': 'CD',
                'ip_city': c['home_city'] or 'KINSHASA',
                'ip_risk_score': 15,
                'vpn_proxy_flag': False,
                'login_failures_30m': 0,
                'password_reset_hours_ago': None,
                'sim_swap_days_ago': None,
                'auth_method': 'PASSWORD',
                'auth_success_flag': True,
                'approvals_required': 0,
                'approvals_completed': 0,
                'scenario_type': 'BENIGN_ANOMALY',
                'ground_truth_scenario': 'NONE',
                'ground_truth_class': 'BENIGN_ANOMALY',
                'is_fraud_ground_truth': False,
                'force_alert': True,
                'alert_score_override': rng.randint(36, 44),
                'alert_pattern_override': 'NEW_BENEFICIARY_HIGH_VALUE',
            })

    # Benign 2: Domestic Travel / Relocation Transfer = 52 events
    for i in range(26):
        c = customers[(i * 4 + 3) % len(customers)]
        t = clamp_dt(START_DATE + timedelta(days=rng.randint(15, 75), hours=rng.randint(9, 17)))
        amount_usd = round(c['expected_median_usd'] * rng.uniform(5.2, 7.0), 2)
        curr = c['account_currency']
        fx = FX_RATES[curr]
        remote_city = 'LUBUMBASHI' if c['home_city'] == 'KINSHASA' else 'KINSHASA'
        remote_prov = DRC_CITIES[remote_city]['province']
        
        for sub_i in range(2):
            events.append({
                'timestamp': clamp_dt(t + timedelta(days=sub_i * 4)),
                'customer_id': c['customer_id'],
                'direction': 'DEBIT',
                'amount': round(amount_usd / fx, 2),
                'currency': curr,
                'fx_rate_to_usd': fx,
                'amount_usd_equiv': amount_usd,
                'channel': 'CARD',
                'channel_action': 'VISA_POS',
                'payment_rail': 'VISA',
                'transaction_type': 'CARD_PURCHASE',
                'transaction_status': 'COMPLETED',
                'failure_reason': 'NONE',
                'is_cross_border': False,
                'origin_country': 'CD',
                'destination_country': 'CD',
                'destination_city': remote_city,
                'narration': "SYN Domestic business travel hotel expense",
                'recurring_or_scheduled_flag': False,
                'corporate_payment_flag': False,
                'beneficiary_id': beneficiaries[15]['beneficiary_id'],
                'beneficiary_name': beneficiaries[15]['beneficiary_name'],
                'beneficiary_type': 'MERCHANT',
                'beneficiary_relationship': 'MERCHANT',
                'merchant_id': beneficiaries[15]['linked_merchant_id'],
                'merchant_name': beneficiaries[15]['beneficiary_name'],
                'merchant_category': beneficiaries[15]['linked_merchant_category'],
                'card_entry_mode': 'CHIP',
                'touchpoint_id': 'POS-SYN-008',
                'touchpoint_type': 'POS',
                'txn_province': remote_prov,
                'txn_city': remote_city,
                'device': devs_pos[0],
                'device_trusted_override': True,
                'ip_country': 'CD',
                'ip_city': remote_city,
                'ip_risk_score': 25,
                'vpn_proxy_flag': False,
                'login_failures_30m': 0,
                'password_reset_hours_ago': None,
                'sim_swap_days_ago': None,
                'auth_method': 'PIN',
                'auth_success_flag': True,
                'approvals_required': 0,
                'approvals_completed': 0,
                'scenario_type': 'BENIGN_ANOMALY',
                'ground_truth_scenario': 'NONE',
                'ground_truth_class': 'BENIGN_ANOMALY',
                'is_fraud_ground_truth': False,
                'force_alert': True,
                'alert_score_override': rng.randint(35, 42),
                'alert_pattern_override': 'OTHER',
            })

    # Benign 3: High-Value Diaspora Wedding / Real Estate Remittance = 54 events
    diaspora_customers = [c for c in customers if c['customer_segment'] == 'DIASPORA']
    for d_cus in diaspora_customers:
        for _ in range(9):
            t = clamp_dt(START_DATE + timedelta(days=rng.randint(10, 80), hours=rng.randint(9, 20)))
            amount_usd = round(d_cus['expected_median_usd'] * rng.uniform(5.5, 9.0), 2)
            ben = d_cus['favorite_beneficiaries'][0]
            
            events.append({
                'timestamp': t,
                'customer_id': d_cus['customer_id'],
                'direction': 'DEBIT',
                'amount': amount_usd,
                'currency': 'USD',
                'fx_rate_to_usd': 1.0,
                'amount_usd_equiv': amount_usd,
                'channel': 'RAWBANK_ONLINE',
                'channel_action': 'RBO_INTL_TRANSFER',
                'payment_rail': 'SWIFT',
                'transaction_type': 'INTERNATIONAL_TRANSFER',
                'transaction_status': 'COMPLETED',
                'failure_reason': 'NONE',
                'is_cross_border': True,
                'origin_country': d_cus['home_country'],
                'destination_country': 'CD',
                'destination_city': 'KINSHASA',
                'narration': f"SYN Diaspora home construction family remittance {ben['beneficiary_name']}",
                'recurring_or_scheduled_flag': True,
                'corporate_payment_flag': False,
                'beneficiary_id': ben['beneficiary_id'],
                'beneficiary_name': ben['beneficiary_name'],
                'beneficiary_type': 'RAWBANK_CUSTOMER',
                'beneficiary_relationship': 'FAMILY',
                'merchant_id': None,
                'merchant_name': None,
                'merchant_category': 'NONE',
                'card_entry_mode': 'NONE',
                'touchpoint_id': 'NONE',
                'touchpoint_type': 'NONE',
                'txn_province': 'FOREIGN',
                'txn_city': 'FOREIGN_CITY',
                'device': d_cus['primary_device'],
                'device_trusted_override': True,
                'ip_country': d_cus['home_country'],
                'ip_city': 'BRUSSELS' if d_cus['home_country'] == 'BE' else 'PARIS',
                'ip_risk_score': 18,
                'vpn_proxy_flag': False,
                'login_failures_30m': 0,
                'password_reset_hours_ago': None,
                'sim_swap_days_ago': None,
                'auth_method': 'PASSWORD',
                'auth_success_flag': True,
                'approvals_required': 0,
                'approvals_completed': 0,
                'scenario_type': 'BENIGN_ANOMALY',
                'ground_truth_scenario': 'NONE',
                'ground_truth_class': 'BENIGN_ANOMALY',
                'is_fraud_ground_truth': False,
                'force_alert': True,
                'alert_score_override': rng.randint(36, 45),
                'alert_pattern_override': 'CROSS_BORDER_ANOMALY',
            })

    # Benign 4: Control Limit Breaches (Visa Direct > 1000, ATM Deposit > 4000) = 50 events
    for i in range(28):
        c = customers[(i * 4 + 2) % len(customers)]
        t = clamp_dt(START_DATE + timedelta(days=rng.randint(10, 80), hours=rng.randint(9, 16)))
        events.append({
            'timestamp': t,
            'customer_id': c['customer_id'],
            'direction': 'DEBIT',
            'amount': 1250.0,
            'currency': 'USD',
            'fx_rate_to_usd': 1.0,
            'amount_usd_equiv': 1250.0,
            'channel': 'VISA_DIRECT',
            'channel_action': 'VISA_DIRECT_SEND',
            'payment_rail': 'VISA',
            'transaction_type': 'VISA_DIRECT_TRANSFER',
            'transaction_status': 'DECLINED',
            'failure_reason': 'LIMIT_EXCEEDED',
            'is_cross_border': True,
            'origin_country': 'CD',
            'destination_country': 'BE',
            'destination_city': 'BRUSSELS',
            'narration': "SYN Visa direct transfer exceeding product limit USD 1000",
            'recurring_or_scheduled_flag': False,
            'corporate_payment_flag': False,
            'beneficiary_id': c['favorite_beneficiaries'][0]['beneficiary_id'],
            'beneficiary_name': c['favorite_beneficiaries'][0]['beneficiary_name'],
            'beneficiary_type': 'CARD_RECIPIENT',
            'beneficiary_relationship': 'FAMILY',
            'merchant_id': None,
            'merchant_name': None,
            'merchant_category': 'NONE',
            'card_entry_mode': 'NONE',
            'touchpoint_id': 'NONE',
            'touchpoint_type': 'NONE',
            'txn_province': c['home_province'] or 'KINSHASA',
            'txn_city': c['home_city'] or 'KINSHASA',
            'device': c['primary_device'],
            'device_trusted_override': True,
            'ip_country': 'CD',
            'ip_city': c['home_city'] or 'KINSHASA',
            'ip_risk_score': 20,
            'vpn_proxy_flag': False,
            'login_failures_30m': 0,
            'password_reset_hours_ago': None,
            'sim_swap_days_ago': None,
            'auth_method': 'OTP',
            'auth_success_flag': True,
            'approvals_required': 0,
            'approvals_completed': 0,
            'scenario_type': 'BENIGN_ANOMALY',
            'ground_truth_scenario': 'NONE',
            'ground_truth_class': 'BENIGN_ANOMALY',
            'is_fraud_ground_truth': False,
            'is_control_breach': True,
            'force_alert': True,
            'alert_score_override': rng.randint(28, 38),
            'alert_pattern_override': 'OTHER',
        })
        
    for i in range(22):
        c = customers[(i * 5 + 1) % len(customers)]
        t = clamp_dt(START_DATE + timedelta(days=rng.randint(15, 80), hours=rng.randint(10, 16)))
        events.append({
            'timestamp': t,
            'customer_id': c['customer_id'],
            'direction': 'CREDIT',
            'amount': 5500.0,
            'currency': 'USD',
            'fx_rate_to_usd': 1.0,
            'amount_usd_equiv': 5500.0,
            'channel': 'ATM',
            'channel_action': 'ATM_DEPOSIT',
            'payment_rail': 'CASH',
            'transaction_type': 'ATM_DEPOSIT',
            'transaction_status': 'DECLINED',
            'failure_reason': 'LIMIT_EXCEEDED',
            'is_cross_border': False,
            'origin_country': 'CD',
            'destination_country': 'CD',
            'destination_city': c['home_city'] or 'KINSHASA',
            'narration': "SYN ATM cash deposit exceeding individual terminal limit USD 4000",
            'recurring_or_scheduled_flag': False,
            'corporate_payment_flag': False,
            'beneficiary_id': None,
            'beneficiary_name': None,
            'beneficiary_type': 'NONE',
            'beneficiary_relationship': 'NONE',
            'merchant_id': None,
            'merchant_name': None,
            'merchant_category': 'NONE',
            'card_entry_mode': 'ATM',
            'touchpoint_id': 'ATM-SYN-005',
            'touchpoint_type': 'RAWBANK_ATM',
            'txn_province': c['home_province'] or 'KINSHASA',
            'txn_city': c['home_city'] or 'KINSHASA',
            'device': devs_atm[0],
            'device_trusted_override': True,
            'ip_country': 'CD',
            'ip_city': c['home_city'] or 'KINSHASA',
            'ip_risk_score': 15,
            'vpn_proxy_flag': False,
            'login_failures_30m': 0,
            'password_reset_hours_ago': None,
            'sim_swap_days_ago': None,
            'auth_method': 'PIN',
            'auth_success_flag': True,
            'approvals_required': 0,
            'approvals_completed': 0,
            'scenario_type': 'BENIGN_ANOMALY',
            'ground_truth_scenario': 'NONE',
            'ground_truth_class': 'BENIGN_ANOMALY',
            'is_fraud_ground_truth': False,
            'is_control_breach': True,
            'force_alert': True,
            'alert_score_override': rng.randint(28, 38),
            'alert_pattern_override': 'OTHER',
        })

    # Adjust exact count to TOTAL_TRANSACTIONS (2,500)
    current_count = len(events)
    if current_count > TOTAL_TRANSACTIONS:
        normal_events = [e for e in events if e['scenario_type'] == 'NORMAL']
        special_events = [e for e in events if e['scenario_type'] != 'NORMAL']
        needed_normal = TOTAL_TRANSACTIONS - len(special_events)
        rng.shuffle(normal_events)
        events = special_events + normal_events[:needed_normal]
    elif current_count < TOTAL_TRANSACTIONS:
        diff = TOTAL_TRANSACTIONS - current_count
        for _ in range(diff):
            dup = dict(rng.choice([e for e in events if e['scenario_type'] == 'NORMAL']))
            dup['timestamp'] = clamp_dt(dup['timestamp'] + timedelta(seconds=rng.randint(30, 3600)))
            events.append(dup)

    events.sort(key=lambda x: x['timestamp'])
    return events

# ---------------------------------------------------------
# DETERMINISTIC ROLLING METRICS & RULE EVALUATION ENGINE
# ---------------------------------------------------------
def process_and_score_transactions(events, customers, beneficiaries, devices, merchants):
    cus_map = {c['customer_id']: c for c in customers}
    ben_map = {b['beneficiary_id']: b for b in beneficiaries}
    merch_map = {m['merchant_id']: m for m in merchants}
    
    cus_history = {c['customer_id']: [] for c in customers}
    cus_balance = {c['customer_id']: c['running_balance'] for c in customers}
    cus_ben_history = {}
    ben_senders = {}
    dev_first_seen = {}
    dev_accounts = {}
    
    for d in devices:
        dev_first_seen[d['device_id']] = START_DATE - timedelta(days=d.get('first_seen_platform_days', 100))
        dev_accounts[d['device_id']] = []

    processed_rows = []
    ground_truth_rows = []
    
    alert_counter = 1
    case_counter = 1
    
    for idx, ev in enumerate(events):
        txn_id = f"TXN-SYN{idx+1:07d}"
        t = ev['timestamp']
        cid = ev['customer_id']
        cus = cus_map[cid]
        
        batch_num = min(13, (idx // 193) + 1)
        batch_id = f"BATCH-{batch_num:03d}"
        
        # Enforce canonical entity attributes
        bid = ev.get('beneficiary_id')
        if bid and bid in ben_map:
            ev['beneficiary_name'] = ben_map[bid]['beneficiary_name']
            ev['beneficiary_type'] = ben_map[bid]['beneficiary_type']
            ev['beneficiary_relationship'] = ben_map[bid]['beneficiary_relationship']

        mid = ev.get('merchant_id')
        if mid and mid in merch_map:
            ev['merchant_name'] = merch_map[mid]['merchant_name']
            ev['merchant_category'] = merch_map[mid]['merchant_category']

        # 1. Rolling Customer Metrics
        hist = cus_history[cid]
        t_90d = t - timedelta(days=90)
        priors_90d = [h['amount_usd'] for h in hist if t_90d <= h['timestamp'] < t]
        
        if len(priors_90d) > 0:
            priors_sorted = sorted(priors_90d)
            mid = len(priors_sorted) // 2
            if len(priors_sorted) % 2 == 1:
                median_90d = priors_sorted[mid]
            else:
                median_90d = (priors_sorted[mid - 1] + priors_sorted[mid]) / 2.0
            median_90d = round(median_90d, 2)
        else:
            median_90d = cus['expected_median_usd']
            
        t_30d = t - timedelta(days=30)
        priors_30d = [h['amount_usd'] for h in hist if t_30d <= h['timestamp'] < t]
        if len(priors_30d) > 0:
            avg_30d = round(sum(priors_30d) / len(priors_30d), 2)
        else:
            avg_30d = median_90d
            
        amount_usd = ev['amount_usd_equiv']
        amount_ratio = round(amount_usd / max(median_90d, 1.0), 4)
        
        t_10m = t - timedelta(minutes=10)
        t_1h = t - timedelta(hours=1)
        txns_10m = [h for h in hist if t_10m <= h['timestamp'] < t]
        txn_count_10m = len(txns_10m) + 1
        
        txns_1h = [h for h in hist if t_1h <= h['timestamp'] < t]
        txn_count_1h = len(txns_1h) + 1
        
        outbound_1h = sum([h['amount_usd'] for h in txns_1h if h['direction'] == 'DEBIT'])
        if ev['direction'] == 'DEBIT':
            outbound_1h += amount_usd
        outbound_amount_1h_usd = round(outbound_1h, 2)
        
        if len(hist) > 0:
            prev_txn = hist[-1]
            minutes_since_prev = round((t - prev_txn['timestamp']).total_seconds() / 60.0, 2)
            prev_city = prev_txn['txn_city']
        else:
            minutes_since_prev = None
            prev_city = None
            
        home_c = cus['home_city']
        txn_c = ev['txn_city']
        geo_dist = get_distance(home_c, txn_c) if home_c else None
            
        if prev_city and prev_city != txn_c and minutes_since_prev is not None:
            dist_prev = get_distance(prev_city, txn_c)
            imp_travel = (dist_prev > 400 and minutes_since_prev < 90)
        else:
            imp_travel = False
            
        hour = t.hour
        unusual_time = (hour < 5 and cus['customer_type'] != 'CORPORATE')
        
        # 2. Beneficiary Metrics
        bid = ev['beneficiary_id']
        if bid and bid not in ['NONE', '']:
            pair_key = (cid, bid)
            if pair_key in cus_ben_history:
                first_seen_b, prior_cnt = cus_ben_history[pair_key]
                ben_age_days = int((t - first_seen_b).total_seconds() / 86400)
                ben_prior_cnt = prior_cnt
                cus_ben_history[pair_key] = (first_seen_b, prior_cnt + 1)
            else:
                ben_age_days = 0
                ben_prior_cnt = 0
                cus_ben_history[pair_key] = (t, 1)
                
            new_ben_flag = (ben_prior_cnt == 0 or ben_age_days <= 1)
            
            if bid not in ben_senders:
                ben_senders[bid] = []
            ben_senders[bid] = [(ts, sender) for (ts, sender) in ben_senders[bid] if t_30d <= ts <= t]
            ben_senders[bid].append((t, cid))
            ben_distinct_senders = len(set(sender for (_, sender) in ben_senders[bid]))
        else:
            ben_age_days = None
            ben_prior_cnt = None
            ben_distinct_senders = None
            new_ben_flag = False
            
        # 3. Device Metrics
        dev = ev['device']
        if dev and dev['device_id'] not in ['NONE', '']:
            did = dev['device_id']
            if did not in dev_first_seen:
                dev_first_seen[did] = t
                
            dev_first_seen_days = int((t - dev_first_seen[did]).total_seconds() / 86400)
            if ev.get('device_first_seen_override') is not None:
                dev_first_seen_days = ev['device_first_seen_override']
                
            new_dev_flag = (dev_first_seen_days == 0)
            dev_trusted = ev.get('device_trusted_override', not new_dev_flag)
            
            dev_accounts[did] = [(ts, acc) for (ts, acc) in dev_accounts[did] if t_30d <= ts <= t]
            dev_accounts[did].append((t, cid))
            dev_accounts_seen = len(set(acc for (_, acc) in dev_accounts[did]))
        else:
            dev_first_seen_days = None
            new_dev_flag = False
            dev_trusted = None
            dev_accounts_seen = None

        # 4. Running Balance Tracking
        bal_before = round(cus_balance[cid], 2)
        if ev['direction'] == 'DEBIT':
            bal_after = round(bal_before - amount_usd, 2)
        else:
            bal_after = round(bal_before + amount_usd, 2)
        cus_balance[cid] = bal_after

        # 5. Evaluate Rules FR-01 through FR-20
        triggered_fr = []
        rule_weights = 0
        
        # FR-01: Amount >= 5x customer median (+12)
        if amount_ratio >= 5.0:
            triggered_fr.append('FR-01')
            rule_weights += 12
            
        # FR-02: Amount >= 10x customer median (+20)
        if amount_ratio >= 10.0:
            triggered_fr.append('FR-02')
            rule_weights += 20
            
        # FR-03: New beneficiary (+12)
        if new_ben_flag and bid not in [None, '', 'NONE']:
            triggered_fr.append('FR-03')
            rule_weights += 12
            
        # FR-04: New / untrusted device (+12)
        if (dev_trusted is False or new_dev_flag is True) and dev and dev['device_id'] != 'NONE' and not dev.get('is_terminal'):
            triggered_fr.append('FR-04')
            rule_weights += 12
            
        # FR-05: 3+ failed logins in 30 min (+14)
        if ev['login_failures_30m'] >= 3:
            triggered_fr.append('FR-05')
            rule_weights += 14
            
        # FR-06: Password reset within 24h (+10)
        if ev['password_reset_hours_ago'] is not None and ev['password_reset_hours_ago'] <= 24.0:
            triggered_fr.append('FR-06')
            rule_weights += 10
            
        # FR-07: Recent SIM change (+8)
        if ev['sim_swap_days_ago'] is not None and ev['sim_swap_days_ago'] <= 7:
            triggered_fr.append('FR-07')
            rule_weights += 8
            
        # FR-08: 4+ transactions in 10 min (+14)
        if txn_count_10m >= 4:
            triggered_fr.append('FR-08')
            rule_weights += 14
            
        # FR-09: Abnormal 1-hour outbound value (+12)
        if outbound_amount_1h_usd >= 4.0 * max(median_90d, 100.0) or (txn_count_1h >= 4 and outbound_amount_1h_usd >= 2500.0):
            triggered_fr.append('FR-09')
            rule_weights += 12
            
        # FR-10: Impossible travel (+20 / hard trigger)
        if imp_travel:
            triggered_fr.append('FR-10')
            rule_weights += 20
            
        # FR-11: Unusual country/location (+7)
        if (geo_dist is not None and geo_dist > 500) and cus['resident_status'] != 'DIASPORA':
            triggered_fr.append('FR-11')
            rule_weights += 7
            
        # FR-12: VPN / proxy signal (+5)
        if ev['vpn_proxy_flag']:
            triggered_fr.append('FR-12')
            rule_weights += 5
            
        # FR-13: Device used across 3+ accounts (+13)
        if dev_accounts_seen is not None and dev_accounts_seen >= 3 and dev and not dev.get('is_terminal'):
            triggered_fr.append('FR-13')
            rule_weights += 13
            
        # FR-14: Beneficiary receives from 5+ customers (+15)
        if ben_distinct_senders is not None and ben_distinct_senders >= 5 and ev['beneficiary_type'] != 'MERCHANT' and ev['beneficiary_relationship'] != 'MERCHANT':
            triggered_fr.append('FR-14')
            rule_weights += 15
            
        # FR-15: Card-not-present + unusual behaviour (+12)
        if ev['card_entry_mode'] == 'ECOM' and (amount_ratio >= 3.0 or ev['vpn_proxy_flag'] or unusual_time):
            triggered_fr.append('FR-15')
            rule_weights += 12
            
        # FR-16: Unusual transaction time (+4)
        if unusual_time:
            triggered_fr.append('FR-16')
            rule_weights += 4
            
        # FR-17: New device + new beneficiary (+12)
        if new_dev_flag and new_ben_flag and bid not in [None, '', 'NONE']:
            triggered_fr.append('FR-17')
            rule_weights += 12
            
        # FR-18: Failed logins + reset + new device (+18 / hard trigger)
        if (ev['login_failures_30m'] >= 3 or (ev['password_reset_hours_ago'] is not None and ev['password_reset_hours_ago'] <= 24.0)) and new_dev_flag:
            triggered_fr.append('FR-18')
            rule_weights += 18
            
        # FR-19: New cross-border beneficiary + abnormal value (+14)
        if ev['is_cross_border'] and new_ben_flag and amount_ratio >= 3.0:
            triggered_fr.append('FR-19')
            rule_weights += 14
            
        # FR-20: Incomplete Corporate approval (+25 / hard trigger)
        if ev['corporate_payment_flag'] and ev['approvals_completed'] < ev['approvals_required']:
            triggered_fr.append('FR-20')
            rule_weights += 25

        # 6. Counter-Evidence Rules
        ce_reductions = 0
        if dev_trusted is True and (not new_ben_flag) and (ben_prior_cnt is not None and ben_prior_cnt >= 3):
            ce_reductions += 12
        if ev['recurring_or_scheduled_flag']:
            ce_reductions += 10
        if cus['customer_segment'] == 'DIASPORA' and ev['is_cross_border']:
            ce_reductions += 10
        if cus['customer_type'] == 'CORPORATE' and ev['beneficiary_relationship'] == 'SUPPLIER' and ev['approvals_completed'] == ev['approvals_required'] and ev['approvals_required'] > 0:
            ce_reductions += 15
        if cus['customer_segment'] in ['PREMIUM', 'PRESTIGE', 'INFINITE', 'CORPORATE'] and amount_ratio <= 1.5:
            ce_reductions += 8

        # 7. Alert Scoring & Clamping
        raw_score = rule_weights - ce_reductions
        alert_score = max(0, min(100, int(round(raw_score))))
        
        is_hard_trigger = any(r in triggered_fr for r in ['FR-10', 'FR-18', 'FR-20'])
        is_control_breach = ev.get('is_control_breach', False) or (ev['corporate_payment_flag'] and ev['approvals_completed'] < ev['approvals_required'])
        force_alert = ev.get('force_alert', False)
        
        alert_generated = (alert_score >= 35) or is_hard_trigger or is_control_breach or force_alert
        if force_alert and ev.get('alert_score_override'):
            alert_score = ev['alert_score_override']
        elif alert_generated and alert_score < 35:
            alert_score = 45 if is_hard_trigger else 32
            
        # Alert Severity
        if not alert_generated:
            alert_sev = 'NONE'
        else:
            if alert_score >= 75:
                alert_sev = 'CRITICAL'
            elif alert_score >= 55:
                alert_sev = 'HIGH'
            elif alert_score >= 35:
                alert_sev = 'MEDIUM'
            else:
                alert_sev = 'LOW'

        # Composite behavioral deviation score
        dev_score = 0
        dev_score += min(35, int(amount_ratio * 4.5))
        dev_score += min(20, (txn_count_10m - 1) * 7 + (txn_count_1h - 1) * 3)
        if ev['login_failures_30m'] >= 3:
            dev_score += 15
        if ev['password_reset_hours_ago'] is not None and ev['password_reset_hours_ago'] <= 24:
            dev_score += 10
        if ev['sim_swap_days_ago'] is not None and ev['sim_swap_days_ago'] <= 7:
            dev_score += 8
        if new_dev_flag and not dev.get('is_terminal', False):
            dev_score += 12
        if imp_travel:
            dev_score += 20
        if new_ben_flag and bid not in [None, '', 'NONE']:
            dev_score += 10
        if ev['vpn_proxy_flag']:
            dev_score += 8
        behavioral_dev_score = max(0, min(100, dev_score))

        # Alert Details & Case Management
        if alert_generated:
            alt_id = f"ALT-{alert_counter:07d}"
            alert_counter += 1
            reason_codes = '|'.join(triggered_fr) if triggered_fr else 'CONTROL_LIMIT_BREACH'
            
            if ev.get('alert_pattern_override'):
                primary_pattern = ev['alert_pattern_override']
            elif ev.get('ground_truth_scenario') and ev['ground_truth_scenario'] != 'NONE':
                primary_pattern = ev['ground_truth_scenario']
            elif 'FR-18' in triggered_fr or ('FR-05' in triggered_fr and 'FR-04' in triggered_fr):
                primary_pattern = 'ACCOUNT_TAKEOVER'
            elif 'FR-20' in triggered_fr:
                primary_pattern = 'CORPORATE_APPROVAL_ANOMALY'
            elif 'FR-10' in triggered_fr:
                primary_pattern = 'IMPOSSIBLE_TRAVEL'
            elif 'FR-15' in triggered_fr:
                primary_pattern = 'CARD_NOT_PRESENT'
            elif 'FR-13' in triggered_fr:
                primary_pattern = 'SHARED_DEVICE'
            elif 'FR-14' in triggered_fr:
                primary_pattern = 'MULE_BENEFICIARY'
            elif 'FR-08' in triggered_fr:
                primary_pattern = 'VELOCITY_BURST'
            elif 'FR-06' in triggered_fr:
                primary_pattern = 'CREDENTIAL_RESET_ABUSE'
            elif 'FR-19' in triggered_fr:
                primary_pattern = 'CROSS_BORDER_ANOMALY'
            elif 'FR-03' in triggered_fr and ('FR-01' in triggered_fr or 'FR-02' in triggered_fr):
                primary_pattern = 'NEW_BENEFICIARY_HIGH_VALUE'
            else:
                primary_pattern = 'OTHER'
                
            pot_exposure = amount_usd if ev['direction'] == 'DEBIT' and ev['transaction_status'] in ['COMPLETED', 'HELD'] else 0.0
            
            escalation_flag = (alert_sev in ['CRITICAL', 'HIGH'] or is_hard_trigger)
            if escalation_flag:
                escalation_tier = 'TIER_2' if alert_sev == 'CRITICAL' else 'TIER_1'
                if primary_pattern == 'CORPORATE_APPROVAL_ANOMALY':
                    escalation_tier = 'MANAGER'
                elif primary_pattern == 'ACCOUNT_TAKEOVER':
                    escalation_tier = 'SECURITY'
                elif primary_pattern == 'MULE_BENEFICIARY':
                    escalation_tier = 'COMPLIANCE'
            else:
                escalation_tier = 'NONE'

            if primary_pattern in ['ACCOUNT_TAKEOVER', 'CREDENTIAL_RESET_ABUSE']:
                analyst_q = 'DIGITAL_FRAUD'
            elif primary_pattern == 'CARD_NOT_PRESENT':
                analyst_q = 'CARD_FRAUD'
            elif primary_pattern == 'CORPORATE_APPROVAL_ANOMALY':
                analyst_q = 'CORPORATE_FRAUD'
            elif primary_pattern in ['SHARED_DEVICE', 'MULE_BENEFICIARY']:
                analyst_q = 'TIER_2_FRAUD'
            else:
                analyst_q = 'TIER_1_FRAUD'

            if alert_sev in ['CRITICAL', 'HIGH'] or (alert_sev == 'MEDIUM' and idx % 2 == 0):
                c_id = f"CASE-{case_counter:06d}"
                case_counter += 1
                
                if idx % 7 == 0:
                    case_stat = 'CLOSED'
                    if ev['scenario_type'] == 'BENIGN_ANOMALY':
                        human_disp = 'LEGITIMATE'
                        disp_reason = "Analyst verified genuine customer payment; confirmed via branch callback"
                    elif ev['is_fraud_ground_truth']:
                        human_disp = 'CONFIRMED_FRAUD'
                        disp_reason = "Confirmed unauthorized syndicate activity; beneficiary account frozen"
                    else:
                        human_disp = 'INSUFFICIENT_EVIDENCE'
                        disp_reason = "Customer unreachable; initial transaction monitored"
                else:
                    case_stat = 'NEW' if idx % 3 == 0 else ('IN_REVIEW' if idx % 3 == 1 else 'ESCALATED')
                    human_disp = 'UNREVIEWED'
                    disp_reason = ""
            else:
                c_id = ""
                case_stat = 'NONE'
                human_disp = 'UNREVIEWED'
                disp_reason = ""
        else:
            alt_id = ""
            alert_sev = 'NONE'
            primary_pattern = 'NONE'
            reason_codes = ""
            pot_exposure = 0.0
            c_id = ""
            case_stat = 'NONE'
            analyst_q = 'NONE'
            human_disp = 'UNREVIEWED'
            disp_reason = ""
            escalation_flag = False
            escalation_tier = 'NONE'

        # Build output row
        row = {
            'transaction_id': txn_id,
            'event_timestamp_local': t.strftime('%Y-%m-%dT%H:%M:%S+02:00'),
            'batch_id': batch_id,
            'synthetic_record_version': 'v1',
            'data_quality_flag': 'OK',
            'customer_id': cid,
            'customer_name': cus['customer_name'],
            'customer_type': cus['customer_type'],
            'customer_segment': cus['customer_segment'],
            'age_band': cus['age_band'],
            'occupation_industry': cus['occupation_industry'],
            'resident_status': cus['resident_status'],
            'home_country': cus['home_country'],
            'home_province': cus['home_province'] if cus['home_province'] else "",
            'home_city': cus['home_city'] if cus['home_city'] else "",
            'relationship_tenure_days': cus['relationship_tenure_days'],
            'kyc_risk_band': cus['kyc_risk_band'],
            'pep_flag': 'TRUE' if cus['pep_flag'] else 'FALSE',
            'monthly_inflow_usd_equiv': cus['monthly_inflow_usd_equiv'],
            'account_id': cus['account_id'],
            'account_type': cus['account_type'],
            'account_currency': cus['account_currency'],
            'account_status': cus['account_status'],
            'product_package': cus['product_package'],
            'card_product': cus['card_product'] if cus['card_product'] else "NONE",
            'card_status': cus['card_status'] if cus['card_status'] else "NONE",
            'illicocash_enabled': 'TRUE' if cus['illicocash_enabled'] else 'FALSE',
            'rawbank_online_enabled': 'TRUE' if cus['rawbank_online_enabled'] else 'FALSE',
            'alert_banking_enabled': 'TRUE' if cus['alert_banking_enabled'] else 'FALSE',
            'available_balance_before_usd': bal_before,
            'available_balance_after_usd': bal_after,
            'transaction_type': ev['transaction_type'],
            'direction': ev['direction'],
            'amount': ev['amount'],
            'currency': ev['currency'],
            'fx_rate_to_usd': ev['fx_rate_to_usd'],
            'amount_usd_equiv': amount_usd,
            'channel': ev['channel'],
            'channel_action': ev['channel_action'],
            'payment_rail': ev['payment_rail'],
            'transaction_status': ev['transaction_status'],
            'failure_reason': ev['failure_reason'],
            'is_cross_border': 'TRUE' if ev['is_cross_border'] else 'FALSE',
            'origin_country': ev['origin_country'],
            'destination_country': ev['destination_country'] if ev['destination_country'] else "",
            'destination_city': ev['destination_city'] if ev['destination_city'] else "",
            'narration': ev['narration'],
            'recurring_or_scheduled_flag': 'TRUE' if ev['recurring_or_scheduled_flag'] else 'FALSE',
            'corporate_payment_flag': 'TRUE' if ev['corporate_payment_flag'] else 'FALSE',
            'beneficiary_id': bid if bid else "",
            'beneficiary_name': ev['beneficiary_name'] if ev['beneficiary_name'] else "",
            'beneficiary_type': ev['beneficiary_type'] if ev['beneficiary_type'] else "NONE",
            'beneficiary_relationship': ev['beneficiary_relationship'] if ev['beneficiary_relationship'] else "NONE",
            'beneficiary_age_days': ben_age_days if ben_age_days is not None else "",
            'beneficiary_prior_txn_count': ben_prior_cnt if ben_prior_cnt is not None else "",
            'beneficiary_distinct_sender_count_30d': ben_distinct_senders if ben_distinct_senders is not None else "",
            'merchant_id': ev['merchant_id'] if ev['merchant_id'] else "",
            'merchant_name': ev['merchant_name'] if ev['merchant_name'] else "",
            'merchant_category': ev['merchant_category'] if ev['merchant_category'] else "NONE",
            'card_entry_mode': ev['card_entry_mode'] if ev['card_entry_mode'] else "NONE",
            'touchpoint_id': ev['touchpoint_id'] if ev['touchpoint_id'] else "NONE",
            'touchpoint_type': ev['touchpoint_type'] if ev['touchpoint_type'] else "NONE",
            'txn_province': ev['txn_province'] if ev['txn_province'] else "",
            'txn_city': ev['txn_city'] if ev['txn_city'] else "",
            'session_id': f"SES-SYN{idx+1:05d}" if ev['channel'] in ['ILLICOCASH', 'RAWBANK_ONLINE', 'CARD'] else "NONE",
            'device_id': dev['device_id'] if dev else "NONE",
            'device_type': dev['device_type'] if dev else "NONE",
            'device_os': dev['device_os'] if dev else "",
            'device_trusted_flag': ('TRUE' if dev_trusted else 'FALSE') if dev_trusted is not None else "",
            'device_first_seen_days': dev_first_seen_days if dev_first_seen_days is not None else "",
            'device_accounts_seen_30d': dev_accounts_seen if dev_accounts_seen is not None else "",
            'ip_country': ev['ip_country'] if ev['ip_country'] else "",
            'ip_city': ev['ip_city'] if ev['ip_city'] else "",
            'ip_risk_score': ev['ip_risk_score'] if ev['ip_risk_score'] is not None else "",
            'vpn_proxy_flag': 'TRUE' if ev['vpn_proxy_flag'] else 'FALSE',
            'login_failures_30m': ev['login_failures_30m'] if ev['login_failures_30m'] is not None else "",
            'password_reset_hours_ago': ev['password_reset_hours_ago'] if ev['password_reset_hours_ago'] is not None else "",
            'sim_swap_days_ago': ev['sim_swap_days_ago'] if ev['sim_swap_days_ago'] is not None else "",
            'auth_method': ev['auth_method'] if ev['auth_method'] else "NONE",
            'auth_success_flag': 'TRUE' if ev['auth_success_flag'] else 'FALSE',
            'approvals_required': ev['approvals_required'] if ev['approvals_required'] is not None else 0,
            'approvals_completed': ev['approvals_completed'] if ev['approvals_completed'] is not None else 0,
            'customer_median_txn_usd_90d': median_90d,
            'customer_avg_txn_usd_30d': avg_30d,
            'amount_to_median_ratio': amount_ratio,
            'txn_count_10m': txn_count_10m,
            'txn_count_1h': txn_count_1h,
            'outbound_amount_1h_usd': outbound_amount_1h_usd,
            'minutes_since_prev_txn': minutes_since_prev if minutes_since_prev is not None else "",
            'previous_txn_city': prev_city if prev_city else "",
            'geo_distance_from_home_km': geo_dist if geo_dist is not None else "",
            'impossible_travel_flag': 'TRUE' if imp_travel else 'FALSE',
            'unusual_time_flag': 'TRUE' if unusual_time else 'FALSE',
            'behavioral_deviation_score': behavioral_dev_score,
            'new_beneficiary_flag': 'TRUE' if new_ben_flag else 'FALSE',
            'new_device_flag': 'TRUE' if new_dev_flag else 'FALSE',
            'alert_generated_flag': 'TRUE' if alert_generated else 'FALSE',
            'alert_id': alt_id,
            'alert_score': alert_score if alert_score is not None else "",
            'alert_severity': alert_sev,
            'alert_primary_pattern': primary_pattern,
            'alert_reason_codes': reason_codes,
            'potential_exposure_usd': pot_exposure,
            'case_id': c_id,
            'case_status': case_stat,
            'analyst_queue': analyst_q,
            'human_disposition': human_disp,
            'disposition_reason': disp_reason,
            'escalation_required_flag': 'TRUE' if escalation_flag else 'FALSE',
            'escalation_tier': escalation_tier,
        }
        processed_rows.append(row)
        
        gt_row = {
            'transaction_id': txn_id,
            'synthetic_case_id': ev.get('synthetic_case_id', f"CASE-{cid}"),
            'is_fraud_ground_truth': 'TRUE' if ev['is_fraud_ground_truth'] else 'FALSE',
            'ground_truth_class': ev['ground_truth_class'],
            'ground_truth_scenario': ev['ground_truth_scenario'],
            'difficulty': 'MEDIUM' if ev['scenario_type'] == 'FRAUD' else 'EASY',
            'injected_anomaly_fields': 'amount|device_id|login_failures_30m' if ev['scenario_type'] == 'FRAUD' else 'NONE',
            'expected_rule_ids': ev.get('expected_rules', ''),
            'expected_key_evidence': f"Ground truth injected {ev['ground_truth_scenario']}" if ev['ground_truth_scenario'] != 'NONE' else 'Normal pattern',
            'expected_counter_evidence': 'Counter evidence reduced score' if ce_reductions > 0 else 'None',
            'expected_analyst_action': 'ESCALATE' if ev['is_fraud_ground_truth'] else ('MONITOR' if alert_generated else 'ALLOW'),
            'generator_seed': SEED,
            'generator_version': 'v1',
        }
        ground_truth_rows.append(gt_row)

        cus_history[cid].append({
            'timestamp': t,
            'amount_usd': amount_usd,
            'direction': ev['direction'],
            'txn_city': ev['txn_city'],
        })

    return processed_rows, ground_truth_rows

# ---------------------------------------------------------
# MAIN EXECUTION ENTRY POINT
# ---------------------------------------------------------
def main():
    print(f"[*] Initializing deterministic generator with SEED={SEED}...")
    rng = random.Random(SEED)
    
    print("[*] Step 1-4: Generating entity pools (Customers, Beneficiaries, Devices, Merchants)...")
    customers, beneficiaries, devices, merchants = generate_entities(rng)
    print(f"    - Customers: {len(customers)} (Retail: 84, SME: 24, Corporate: 12)")
    print(f"    - Beneficiaries: {len(beneficiaries)}")
    print(f"    - Devices: {len(devices)}")
    print(f"    - Merchants: {len(merchants)}")
    
    print("[*] Step 5-6: Generating normal transactions and injecting fraud scenarios...")
    raw_events = generate_raw_transactions(rng, customers, beneficiaries, devices, merchants)
    print(f"    - Total generated raw events: {len(raw_events)}")
    
    print("[*] Step 7-10: Computing deterministic rolling metrics, evaluating rules, and assigning alerts...")
    master_rows, gt_rows = process_and_score_transactions(raw_events, customers, beneficiaries, devices, merchants)
    print(f"    - Master rows processed: {len(master_rows)}")
    
    kb_path = "RAWBANK_SENTIENT_KB.csv"
    print(f"[*] Exporting canonical master knowledge base to '{kb_path}'...")
    with open(kb_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=MASTER_COLUMNS)
        writer.writeheader()
        writer.writerows(master_rows)
    print(f"    [+] Successfully wrote {len(master_rows)} rows to {kb_path}")
    
    gt_path = "RAWBANK_SENTIENT_GROUND_TRUTH.csv"
    gt_cols = [
        'transaction_id', 'synthetic_case_id', 'is_fraud_ground_truth', 'ground_truth_class',
        'ground_truth_scenario', 'difficulty', 'injected_anomaly_fields', 'expected_rule_ids',
        'expected_key_evidence', 'expected_counter_evidence', 'expected_analyst_action',
        'generator_seed', 'generator_version'
    ]
    print(f"[*] Exporting hidden evaluation ground truth to '{gt_path}'...")
    with open(gt_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=gt_cols)
        writer.writeheader()
        writer.writerows(gt_rows)
    print(f"    [+] Successfully wrote {len(gt_rows)} rows to {gt_path}")
    
    alert_count = sum(1 for r in master_rows if r['alert_generated_flag'] == 'TRUE')
    alert_rate = (alert_count / len(master_rows)) * 100.0
    print(f"\n[SUMMARY METRICS]")
    print(f"    - Total Rows: {len(master_rows)}")
    print(f"    - Total Alerts: {alert_count} ({alert_rate:.2f}%)")
    print(f"    - Date Span: {master_rows[0]['event_timestamp_local']} to {master_rows[-1]['event_timestamp_local']}")
    print(f"    - Generation Complete.")

if __name__ == '__main__':
    main()
