FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY meshctl ./meshctl
# node-side files pushed over SSH when a node is added / a relay is enabled
COPY agent ./agent

RUN useradd -u 10001 -m mesh
USER 10001

ENV MESHCTL_CONFIG=/config/config.yaml \
    MESHCTL_KEY=/secrets/id_ed25519 \
    PORT=8080

EXPOSE 8080
ENTRYPOINT ["python", "-m", "meshctl.app"]
