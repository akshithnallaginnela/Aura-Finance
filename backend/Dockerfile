FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run via Waitress (production WSGI server)
CMD ["waitress-serve", "--port=5000", "app:app"]
