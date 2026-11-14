"""Issue mesh certificates. Keys are returned in memory, never logged or saved by this module."""
from datetime import datetime, timedelta, timezone
import ipaddress
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.x509.oid import ExtendedKeyUsageOID, NameOID


def _key_pem(key):
    return key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                             serialization.NoEncryption()).decode()


def create_ca():
    key = ec.generate_private_key(ec.SECP256R1())
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'Remnawave mesh etcd CA')])
    now = datetime.now(timezone.utc)
    cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key())
            .serial_number(x509.random_serial_number()).not_valid_before(now - timedelta(minutes=5))
            .not_valid_after(now + timedelta(days=3650)).add_extension(x509.BasicConstraints(ca=True, path_length=0), True)
            .add_extension(x509.SubjectKeyIdentifier.from_public_key(key.public_key()), False)
            .add_extension(x509.AuthorityKeyIdentifier.from_issuer_public_key(key.public_key()), False)
            .add_extension(x509.KeyUsage(True, False, False, False, False, True, True, False, False), True)
            .sign(key, hashes.SHA256()))
    return cert.public_bytes(serialization.Encoding.PEM).decode(), _key_pem(key)


def issue(ca_pem, ca_key_pem, name, addresses=(), server=False, days=365):
    ca = x509.load_pem_x509_certificate(ca_pem.encode())
    ca_key = serialization.load_pem_private_key(ca_key_pem.encode(), None)
    if ca.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo) != ca_key.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo):
        raise ValueError('CA certificate and key do not match')
    now = datetime.now(timezone.utc)
    key = ec.generate_private_key(ec.SECP256R1())
    san = []
    for address in addresses:
        try:
            san.append(x509.IPAddress(ipaddress.ip_address(address)))
        except ValueError:
            san.append(x509.DNSName(address))
    usages = [ExtendedKeyUsageOID.CLIENT_AUTH]
    if server:
        usages.append(ExtendedKeyUsageOID.SERVER_AUTH)
    cert = (x509.CertificateBuilder().subject_name(x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, name)]))
            .issuer_name(ca.subject).public_key(key.public_key()).serial_number(x509.random_serial_number())
            .not_valid_before(now - timedelta(minutes=5)).not_valid_after(min(now + timedelta(days=days), ca.not_valid_after_utc))
            .add_extension(x509.BasicConstraints(ca=False, path_length=None), True)
            .add_extension(x509.SubjectKeyIdentifier.from_public_key(key.public_key()), False)
            .add_extension(x509.AuthorityKeyIdentifier.from_issuer_public_key(ca.public_key()), False)
            .add_extension(x509.KeyUsage(True, False, False, False, False, False, False, False, False), True)
            .add_extension(x509.ExtendedKeyUsage(usages), False))
    if san:
        cert = cert.add_extension(x509.SubjectAlternativeName(san), False)
    cert = cert.sign(ca_key, hashes.SHA256())
    return cert.public_bytes(serialization.Encoding.PEM).decode(), _key_pem(key)
