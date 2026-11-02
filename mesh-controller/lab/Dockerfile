FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends wireguard-tools iproute2 iptables curl openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt pytest
COPY meshctl ./meshctl
COPY agent ./agent
COPY tests ./tests
COPY lab/node.py ./lab/node.py
ENV PYTHONPATH=/app
CMD ["sleep", "infinity"]
