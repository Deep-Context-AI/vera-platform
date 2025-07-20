"""
Deterministic pseudonymization helpers used to mask PII while preserving semantic meaning.

The central idea is to create *deterministic* pseudonyms by hashing the sensitive
value together with a secret *seed* using HMAC-SHA256.  The resulting digest is
then mapped to a human-readable replacement that keeps some semantic traits
(e.g. gender for first names) so that downstream LLM reasoning can remain
meaningful while still protecting user data.

Only the seed – *not* the original value – needs to be kept secret.  Anyone who
knows the seed can regenerate the same pseudonym for an input, which means that
pseudonyms stay stable across database rows, log lines and multiple service
calls.
"""

from __future__ import annotations

import hashlib
import hmac
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

__all__ = [
    "pseudonymize_generic",
    "pseudonymize_name",
    "pseudonymize_phone_number",
    "pseudonymize_email",
    "pseudonymize_ip",
    "pseudonymize_url",
    "pseudonymize_date",
    "pseudonymize_ssn",
    "pseudonymize_address",
    "pseudonymize_zip_code",
    "pseudonymize_license_plate",
    "pseudonymize_medical_record_number",
    "pseudonymize_health_plan_beneficiary_number",
    "pseudonymize_account_number",
    "pseudonymize_certificate_license_number",
    "pseudonymize_text_with_pii_detection",
]

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

# A small curated list of first names by (binary) gender.  These lists are *not*
# exhaustive – they only need to be large enough to avoid obvious collisions in
# typical test / log sizes.  They can easily be swapped for larger datasets if
# required later.

_MALE_FIRST_NAMES: List[str] = [
    "Liam", "Noah", "Oliver", "Elijah", "James", "William", "Benjamin", "Lucas",
    "Henry", "Alexander", "Mason", "Michael", "Ethan", "Daniel", "Jacob",
    "Logan", "Jackson", "Sebastian", "Jack", "Aiden", "Owen", "Samuel",
]

_FEMALE_FIRST_NAMES: List[str] = [
    "Olivia", "Emma", "Charlotte", "Amelia", "Sophia", "Isabella", "Ava",
    "Mia", "Evelyn", "Harper", "Luna", "Camila", "Gianna", "Elizabeth", "Eleanor",
    "Ella", "Abigail", "Sofia", "Avery", "Scarlett", "Emily", "Aria",
]

# A (gender-agnostic) list of surnames taken from US 1990 census top 100.
_LAST_NAMES: List[str] = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
    "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
    "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
    "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green",
]

# Map from high-level gender string to the appropriate list.  We keep keys
# lowercase for simplicity.
_FIRST_NAME_MAP = {
    "male": _MALE_FIRST_NAMES,
    "m": _MALE_FIRST_NAMES,
    "man": _MALE_FIRST_NAMES,
    "female": _FEMALE_FIRST_NAMES,
    "f": _FEMALE_FIRST_NAMES,
    "woman": _FEMALE_FIRST_NAMES,
}


def _hmac_sha256(secret_seed: str, value: str) -> bytes:
    """Return raw 32-byte HMAC-SHA256 digest for *value* using *secret_seed*."""

    return hmac.new(secret_seed.encode("utf-8"), value.encode("utf-8"), hashlib.sha256).digest()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def pseudonymize_generic(value: str, secret_seed: str, length: int = 12) -> str:
    """Return a deterministic alphanumeric pseudonym of *value*.

    This helper is intended for identifiers such as NPI numbers, license
    numbers, phone numbers, emails, etc.  It simply truncates the hex
    digest of the HMAC to *length* characters.
    """

    digest_hex = _hmac_sha256(secret_seed, value).hex()
    return digest_hex[:length]


def pseudonymize_name(full_name: str, secret_seed: str, *, gender: Optional[str] = None) -> str:
    """Return a deterministic fake *full_name* while (optionally) preserving *gender*.

    The function will produce a *FirstName LastName* pseudonym by using the
    HMAC digest as an index into pre-defined name lists.

    Parameters
    ----------
    full_name:
        The original sensitive name.  Only used for hashing – no processing is
        done on the actual contents.
    secret_seed:
        Secret key used for HMAC.  The same (seed, full_name) pair will always
        yield the same pseudonym.
    gender:
        Optional hint ("male", "female", "m", "f", etc.) to pick a first-name
        list.  If *None* or unrecognised, the function deterministically falls
        back to picking a gender based on the hash.
    """

    digest = _hmac_sha256(secret_seed, full_name)

    # Derive repeatable integers from digest: use first two 64-bit chunks.
    first_int = int.from_bytes(digest[:8], "big")
    second_int = int.from_bytes(digest[8:16], "big")

    # Decide which gender list to use.
    first_name_pool: List[str]
    if gender is not None and (pool := _FIRST_NAME_MAP.get(gender.lower())):
        first_name_pool = pool
    else:
        # Pick gender by parity of first_int to stay deterministic but hidden.
        first_name_pool = _MALE_FIRST_NAMES if (first_int % 2 == 0) else _FEMALE_FIRST_NAMES

    first_name = first_name_pool[first_int % len(first_name_pool)]
    last_name = _LAST_NAMES[second_int % len(_LAST_NAMES)]

    return f"{first_name} {last_name}" 


# ---------------------------------------------------------------------------
# Additional Safe Harbor helpers
# ---------------------------------------------------------------------------

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from v1.services.pii_detection_service import PIIDetectionService
from faker import Faker
import datetime


def _faker_for(secret_seed: str, value: str, salt: str) -> Faker:
    """Return a Faker instance deterministically seeded from *value* and *salt*."""

    seed_source = f"{salt}|{value}"
    seed_int = int.from_bytes(_hmac_sha256(secret_seed, seed_source)[:8], "big") % (2**32)
    faker = Faker()
    faker.seed_instance(seed_int)
    return faker


# Telephone & Fax numbers -----------------------------------------------------

def pseudonymize_phone_number(phone_number: str, secret_seed: str) -> str:
    """Return a fake phone number in US style (deterministic)."""

    faker = _faker_for(secret_seed, phone_number, "phone")
    return faker.numerify("###-###-####")

# Alias for fax numbers (same treatment)
pseudonymize_fax_number = pseudonymize_phone_number  # type: ignore


# Email addresses -------------------------------------------------------------

def pseudonymize_email(email: str, secret_seed: str) -> str:
    """Return a fake email while preserving the original domain if present."""

    faker = _faker_for(secret_seed, email, "email")
    try:
        _local, domain = email.split("@", 1)
    except ValueError:
        domain = "example.com"

    username = faker.user_name()
    return f"{username}@{domain}"


# IP addresses ----------------------------------------------------------------

def pseudonymize_ip(ip: str, secret_seed: str) -> str:
    faker = _faker_for(secret_seed, ip, "ip")
    return faker.ipv4()


# URLs ------------------------------------------------------------------------

def pseudonymize_url(url: str, secret_seed: str) -> str:
    faker = _faker_for(secret_seed, url, "url")
    return faker.url()


# Social Security Numbers -----------------------------------------------------

def pseudonymize_ssn(ssn: str, secret_seed: str) -> str:
    faker = _faker_for(secret_seed, ssn, "ssn")
    return faker.ssn()


# Dates (retain only year) ----------------------------------------------------

def pseudonymize_date(date_value: datetime.date | datetime.datetime | str, secret_seed: str) -> str:
    """Return Safe Harbor compliant date representation.

    Only the year is retained, unless the derived age is >= 90, in which case
    the string "90+" is returned.  For unparseable inputs, "UNKNOWN" is
    returned instead of raising.
    """

    if isinstance(date_value, (datetime.date, datetime.datetime)):
        dt = date_value
    else:
        try:
            dt = datetime.date.fromisoformat(str(date_value))  # type: ignore[arg-type]
        except Exception:
            # Last-ditch attempt: grab last 4 consecutive digits as year
            digits = "".join(ch for ch in str(date_value) if ch.isdigit())
            if len(digits) >= 4:
                dt = datetime.date(int(digits[-4:]), 1, 1)
            else:
                return "UNKNOWN"

    today = datetime.date.today()
    age = today.year - dt.year
    if age >= 90:
        return "90+"
    return str(dt.year) 


# Geographic subdivisions (smaller than a state) -----------------------------

def pseudonymize_address(address: str, secret_seed: str) -> str:
    """Return a fake address (street, city, state, zip) deterministically."""
    faker = _faker_for(secret_seed, address, "address")
    # Generate a full address to cover street, city, and state
    return faker.address()


def pseudonymize_zip_code(zip_code: str, secret_seed: str) -> str:
    """Return a Safe Harbor compliant ZIP code (deterministic).

    This function simplifies the HIPAA Safe Harbor rule for ZIP codes:
    it generates a deterministic 5-digit ZIP. The rule about changing
    small geographic units to '000' is not implemented here due to
    the need for external Census data.
    """
    faker = _faker_for(secret_seed, zip_code, "zip_code")
    # Faker's postcodes can sometimes include +4, so we ensure it's just the 5-digit part
    return faker.postcode()[:5]


# Vehicle identifiers and serial numbers, including license plate numbers ------

def pseudonymize_license_plate(license_plate: str, secret_seed: str) -> str:
    """Return a fake license plate number (deterministic)."""
    faker = _faker_for(secret_seed, license_plate, "license_plate")
    # Generates a common US-style license plate format (e.g., ABC-1234)
    return faker.license_plate()


# Other identifying numbers ---------------------------------------------------

def pseudonymize_medical_record_number(mrn: str, secret_seed: str) -> str:
    """Return a fake medical record number (deterministic)."""
    faker = _faker_for(secret_seed, mrn, "medical_record_number")
    return faker.uuid4()[:10].upper() # Using UUID for uniqueness, truncated


def pseudonymize_health_plan_beneficiary_number(hpbn: str, secret_seed: str) -> str:
    """Return a fake health plan beneficiary number (deterministic)."""
    faker = _faker_for(secret_seed, hpbn, "health_plan_beneficiary_number")
    return faker.bothify(text='?#########', letters='ABCDEF') # Example: A123456789


def pseudonymize_account_number(account_number: str, secret_seed: str) -> str:
    """Return a fake account number (deterministic)."""
    faker = _faker_for(secret_seed, account_number, "account_number")
    return faker.bban() # Basic Bank Account Number


def pseudonymize_certificate_license_number(cert_lic_num: str, secret_seed: str) -> str:
    """Return a fake certificate/license number (deterministic)."""
    faker = _faker_for(secret_seed, cert_lic_num, "certificate_license_number")
    # Generates a common format for licenses or certificates
    return faker.bothify(text='????#####', letters='ABCDEFGHJKLMNPQRSTUVWXYZ') # Example: ABCA12345


async def pseudonymize_text_with_pii_detection(
    text: str,
    secret_seed: str,
    pii_detection_service: "PIIDetectionService",
) -> str:
    """
    Detect PII in text and replace with pseudonymized values.
    
    Args:
        text: The text to pseudonymize
        secret_seed: Secret seed for deterministic pseudonymization
        pii_detection_service: PII detection service instance
        
    Returns:
        Text with detected PII replaced by pseudonymized values
    """
    try:
        # Detect PII in the text
        detected_pii = await pii_detection_service.detect_pii_in_text(text)
        
        # If no PII detected, return original text
        if not detected_pii:
            logger.info(f"PII detection service invoked but no PII detected")
            return text
        
        pseudonymized_text = text
        
        # Replace detected PII with pseudonymized values
        pii_replacements = {}
        for pii_type, pii_values in detected_pii.items():
            for pii_value in pii_values:
                if not pii_value or not isinstance(pii_value, str) or len(pii_value.strip()) == 0:
                    continue
                    
                # Skip empty lists or very short values that might be noise
                if len(pii_value.strip()) < 2:
                    continue
                    
                # Choose appropriate pseudonymization function based on PII type
                if pii_type in ['firstname', 'lastname', 'ln', 'fn']:
                    pseudo_value = pseudonymize_name(pii_value, secret_seed)
                elif pii_type in ['phonenumber', 'telephone_number', 'fax_number']:
                    pseudo_value = pseudonymize_phone_number(pii_value, secret_seed)
                elif pii_type in ['email', 'email_address']:
                    pseudo_value = pseudonymize_email(pii_value, secret_seed)
                elif pii_type in ['ip', 'ipv4', 'ipv6', 'internet_protocol_address']:
                    pseudo_value = pseudonymize_ip(pii_value, secret_seed)
                elif pii_type in ['url', 'urls']:
                    pseudo_value = pseudonymize_url(pii_value, secret_seed)
                elif pii_type in ['date', 'dob', 'dobss', 'birthdate', 'admission_date', 'discharge_date', 'death_date']:
                    pseudo_value = pseudonymize_date(pii_value, secret_seed)
                elif pii_type in ['ssn', 'social_security_number']:
                    pseudo_value = pseudonymize_ssn(pii_value, secret_seed)
                elif pii_type in ['street', 'city', 'state', 'county', 'precinct']:
                    pseudo_value = pseudonymize_address(pii_value, secret_seed)
                elif pii_type in ['zipcode', 'zip', 'postal_code']:
                    pseudo_value = pseudonymize_zip_code(pii_value, secret_seed)
                elif pii_type in ['accountnumber', 'account_number', 'medical_record_number', 'health_plan_number']:
                    pseudo_value = pseudonymize_account_number(pii_value, secret_seed)
                elif pii_type in ['creditcardnumber', 'certificate_number', 'license_number']:
                    pseudo_value = pseudonymize_certificate_license_number(pii_value, secret_seed)
                elif pii_type in ['vehiclevrm', 'vehicle_identifiers']:
                    pseudo_value = pseudonymize_license_plate(pii_value, secret_seed)
                elif pii_type in ['mac', 'mac_address', 'device_identifiers']:
                    pseudo_value = pseudonymize_generic(pii_value, secret_seed)
                elif pii_type in ['age']:
                    # For age, just use generic pseudonymization
                    pseudo_value = pseudonymize_generic(pii_value, secret_seed)
                elif pii_type in ['jobtitle', 'jobarea']:
                    # For job titles, use generic pseudonymization
                    pseudo_value = pseudonymize_generic(pii_value, secret_seed)
                else:
                    # Use generic pseudonymization for other types
                    pseudo_value = pseudonymize_generic(pii_value, secret_seed)
                
                # Store the replacement for logging
                pii_replacements[pii_value] = pseudo_value
                
                # Replace all occurrences of the PII value with the pseudonymized value
                pseudonymized_text = pseudonymized_text.replace(pii_value, pseudo_value)
        
        # Log the pseudonymization details
        if pii_replacements:
            logger.info(f"Pseudonymized {len(pii_replacements)} PII values: {list(pii_replacements.keys())}")
        else:
            logger.info("No PII values were pseudonymized (all detected values were filtered out)")
        
        return pseudonymized_text
        
    except Exception as e:
        # If pseudonymization fails, return original text
        # Don't expose PII in error logs
        return text 