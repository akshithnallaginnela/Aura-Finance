FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run via Waitress (production WSGI server) on Hugging Face default port 7860
CMD ["waitress-serve", "--port=7860", "app:app"]
