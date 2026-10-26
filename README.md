# Library Management System

A full-stack Library Management System built with **React, TypeScript, Django REST Framework, and PostgreSQL**. The application provides a centralized platform for browsing books, managing borrowing requests, processing returns, and maintaining library resources through role-based access control.

## Live Demo

- **Frontend:** https://library-management-system-iota-sage.vercel.app/
- **Backend API:** https://library-management-system-jffv.onrender.com/
- **Swagger API Documentation:** https://library-management-system-jffv.onrender.com/api/docs/
- **OpenAPI Schema:** https://library-management-system-jffv.onrender.com/api/schema/

> Note: The backend may take a short time to respond after a period of inactivity, depending on the hosting service.

## Features

### Member Features
- Browse and search the book catalogue.
- Filter books by title, author, and genre.
- View book details and availability.
- Register and log in using token-based authentication.
- Submit and manage borrowing requests.
- Request book returns and view borrowing history.
- Manage profile information and profile images.

### Staff and Administrative Features
- Create, update, and manage books and authors.
- Manage library catalogue information.
- Review and process borrowing requests.
- Handle return requests and borrowing records.
- Manage member accounts according to assigned permissions.

### Additional Features
- Cloudinary integration for book covers and profile images.
- RESTful API architecture.
- Interactive API documentation using Swagger UI and ReDoc.
- Role-based permissions for protected operations.
- PostgreSQL database integration.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| State Management | Redux Toolkit |
| Styling | Tailwind CSS |
| Routing and HTTP | React Router, Axios |
| Backend | Python, Django, Django REST Framework |
| Database | PostgreSQL |
| Authentication | Token-based authentication |
| API Documentation | drf-spectacular, OpenAPI, Swagger UI, ReDoc |
| Image Storage | Cloudinary |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Version Control | Git, GitHub |

## Project Architecture

The application follows a client-server architecture.

1. **Frontend:** The React application provides the user interface and communicates with the backend through HTTP requests.
2. **Backend API:** Django REST Framework handles authentication, business logic, validation, permissions, and data processing.
3. **Database:** PostgreSQL stores application data, including users, books, authors, and borrowing records.
4. **Image Storage:** Cloudinary stores and serves uploaded book covers and profile images.
5. **Deployment:** Vercel hosts the frontend, while Render hosts the backend API.

## Project Structure

```text
library-management-system/
├── backend/
│   ├── backend/       # Settings and root URL configuration
│   ├── books/         # Books, authors and catalogue APIs
│   ├── borrowing/     # Borrowing and return workflows
│   ├── users/         # User management and authentication
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── store/
    └── package.json
```

## Getting Started

Follow these steps to run the project locally.

### Prerequisites

- Python compatible with the backend dependencies
- Node.js and npm
- PostgreSQL
- Cloudinary account for image uploads

### 1. Clone the Repository

```bash
git clone https://github.com/GyanendraAryal/library-management-system.git
cd library-management-system
```

### 2. Configure the Backend

Create a `.env` file inside the `backend/` directory. Use your own local development values.

```dotenv
SECRET_KEY=replace-with-a-local-secret-key
DEBUG=True
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/library_management
ALLOWED_HOSTS=localhost,127.0.0.1

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Create the PostgreSQL database before proceeding. Alternatively, configure the database using the `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` settings supported by the project.

Install dependencies and prepare the database:

```bash
python -m venv .venv
source .venv/bin/activate
```

On Windows, activate the virtual environment with:

```powershell
.venv\Scripts\activate
```

Install the backend dependencies and run migrations:

```bash
pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py createsuperuser
python backend/manage.py runserver
```

The backend will normally be available at:

`http://localhost:8000/`

### 3. Configure the Frontend

Create a `.env` file inside `frontend/`:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

Install dependencies and start the development server:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

`http://localhost:5173/`

Ensure the backend CORS configuration permits the local frontend origin.

## API Documentation

The backend exposes REST API endpoints for authentication, catalogue management, and borrowing workflows.

| Resource | Base Path |
|---|---|
| Authentication | `/auth/` |
| Books and Authors | `/api/v1/books/` |
| Borrowing | `/api/v1/borrowing/` |
| Swagger UI | `/api/docs/` |
| OpenAPI Schema | `/api/schema/` |
| ReDoc | `/api/redoc/` |

Most authenticated endpoints require a token in the request header:

```http
Authorization: Token <your-token>
```

Access to write operations and administrative workflows depends on the permissions configured for each endpoint.

For complete request parameters, schemas, and available operations, visit the live Swagger documentation linked above.

## Deployment

### Frontend — Vercel

Configure the following environment variable in the Vercel project settings:

```dotenv
VITE_API_BASE_URL=https://library-management-system-jffv.onrender.com
```

This variable is incorporated into the frontend during the build process. Redeploy the frontend after changing it.

### Backend — Render

Configure the backend service with:

- The `backend/` directory as the service root.
- Python dependencies from `requirements.txt`.
- A production PostgreSQL database.
- A secure Django `SECRET_KEY`.
- `DEBUG=False`.
- Correct `ALLOWED_HOSTS` and frontend CORS settings.
- Cloudinary credentials for image uploads.

Typical deployment commands from the backend service root:

```bash
pip install -r requirements.txt
python manage.py migrate
gunicorn backend.wsgi:application
```

Configure environment variables through the hosting provider's settings rather than committing secrets to the repository.

## Useful Development Commands

Run these commands from the repository root:

```bash
# Check Django configuration
python backend/manage.py check

# Build and type-check the frontend
npm --prefix frontend run build

# Run the frontend linter
npm --prefix frontend run lint
```

## Security Considerations

- Never commit `.env` files, secret keys, database passwords, or Cloudinary secrets.
- Use `DEBUG=False` and a strong, unique secret key in production.
- Keep administrative credentials private.
- Use demo credentials only for accounts created specifically for evaluation.
- Restrict administrative operations through backend permissions, not merely frontend UI controls.

## Future Improvements

Potential enhancements include:

- Automated backend and frontend testing.
- Email notifications for borrowing and return updates.
- Fine-grained audit logs for administrative actions.
- Improved reporting and analytics for library staff.
- Automated deployment checks and continuous integration.

## Author

**Gyanendra Aryal**

GitHub: https://github.com/GyanendraAryal

---

*Developed as a full-stack Library Management System project demonstrating frontend development, REST API design, authentication, database integration, and deployment.*
