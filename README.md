# Smart City Zimbabwe

Welcome to the Smart City Zimbabwe project repository. This project consists of a FastAPI Python backend and a Next.js frontend web application.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **Python** (v3.8 or higher)
- **PostgreSQL** (if a local database is used)
- **Git**

## Project Structure
- `/backend`: The Python FastAPI backend.
- `/frontend`: The Next.js React frontend.

---

## Setting up the Backend

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - **Windows:**
     ```bash
     .\venv\Scripts\activate
     ```
   - **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```

4. **Install backend dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure Environment Variables:**
   Create a `.env` file in the `backend` directory based on the requirements of your application (e.g., Database URLs, Secret Keys, API keys for services like Google Generative AI).

6. **Run the backend server:**
   ```bash
   uvicorn main:app --reload
   ```
   The backend should now be running on [http://localhost:8000](http://localhost:8000).

---

## Setting up the Frontend

1. **Open a new terminal and navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```
   *(Or use `yarn install` / `pnpm install` if you prefer).*

3. **Run the frontend development server:**
   ```bash
   npm run dev
   ```
   The frontend should now be running on [http://localhost:3000](http://localhost:3000).

---

## Running the Application

To run the full application locally, you will need two terminal windows open:
1. One terminal running the FastAPI backend (`uvicorn main:app --reload`).
2. Another terminal running the Next.js frontend (`npm run dev`).

Visit [http://localhost:3000](http://localhost:3000) in your web browser to interact with the frontend, which will communicate with the backend API running at `http://localhost:8000`.
