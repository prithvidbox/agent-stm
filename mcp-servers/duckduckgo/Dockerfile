FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for faster Python package management
RUN pip install uv

# Copy requirements and install dependencies
COPY requirements.txt /app/requirements.txt
RUN uv pip install --system -r requirements.txt

# Copy the HTTP wrapper script
COPY server.py /app/server.py

# Expose port
EXPOSE 3004

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV MCP_SERVER_PORT=3004

# Run the server
CMD ["python", "server.py"]
