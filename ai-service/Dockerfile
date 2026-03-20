FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Generate data and train model on startup
RUN python generate_data.py && python train_model.py

EXPOSE 5000

CMD ["python", "app.py"]

