"""Never infer a production balancer from its position in an API response."""
def select_balancer(balancers, uuid=None, name=None):
    if not uuid and not name:
        raise ValueError('configure balancer_uuid or balancer_name explicitly')
    found = [b for b in balancers if (not uuid or b.get('uuid') == uuid) and (not name or b.get('name') == name)]
    if len(found) != 1:
        raise ValueError('configured balancer is missing or ambiguous')
    return found[0]
