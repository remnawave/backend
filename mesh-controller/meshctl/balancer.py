"""The same effective path drives both HAProxy addresses and pool membership."""
import ipaddress


def backend_route(exit_cfg, direct, overlay, registry):
    public = exit_cfg.get("public_ip")
    if direct is True:
        return {"address": public, "public_address": public, "path": "direct", "healthy": True}
    address = exit_cfg.get("wg_ip")
    try:
        valid = (ipaddress.ip_address(address) in ipaddress.ip_network("10.88.0.0/24")
                 and registry.get("overlay") == address)
    except (ValueError, TypeError):
        valid = False
    if overlay is True and valid:
        return {"address": address, "public_address": public, "path": "mesh", "healthy": True}
    healthy = False if direct is False else None
    return {"address": public, "public_address": public, "path": "unavailable", "healthy": healthy}
