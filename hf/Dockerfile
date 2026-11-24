FROM python:3.12-slim
RUN useradd -m -u 1000 user
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
ENV ACCTIQ_AUDIT_FILE=/tmp/audit_log.jsonl \
    ACCTIQ_CORS_ORIGINS=https://localhost,http://localhost,http://localhost:5173
USER user
EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
