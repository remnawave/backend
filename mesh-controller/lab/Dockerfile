FROM quay.io/coreos/etcd:v3.5.15 AS etcd
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends wireguard-tools iproute2 iptables curl openssl openssh-server openssh-client && rm -rf /var/lib/apt/lists/*
COPY --from=etcd /usr/local/bin/etcd /usr/local/bin/etcd
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt pytest
COPY meshctl ./meshctl
COPY agent ./agent
COPY tests ./tests
COPY lab/node.py ./lab/node.py
COPY lab/service_adapter.py /usr/local/bin/docker
RUN chmod +x /usr/local/bin/docker && ln -sf /usr/local/bin/docker /usr/local/bin/systemctl
ENV PYTHONPATH=/app
CMD ["sleep", "infinity"]
