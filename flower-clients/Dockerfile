FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY client.py .

ENV FLOWER_SERVER_HOST=flower-server
ENV FLOWER_SERVER_PORT=8080
ENV ZONE_ID=Zone_A

CMD ["sh", "-c", "python client.py --zone $ZONE_ID"]
