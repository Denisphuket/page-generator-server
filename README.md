
# Page Generator Server

This is the backend server for the Page Generator project. It provides authentication and authorization for the administrator, and manages the storage of pages with associated HTML content and images.

## Features

- Administrator registration with a secret code.
- JWT-based authentication.
- CRUD operations for pages with HTML content and images.
- Pagination support for fetching pages.

## Prerequisites

- Node.js
- MongoDB
- Docker (optional, for running in containers)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/page-generator-server.git
   cd page-generator-server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add the following variables:

   ```plaintext
   PORT=33000
   JWT_SECRET=your_jwt_secret_key
   REGISTRATION_SECRET_CODE=your_registration_secret_code
   ```

4. Start the server:

   ```bash
   npm start
   ```

## API Endpoints

### Authentication

- **POST** `/api/auth/register`
  - Registers a new administrator.
  - Requires a `username`, `password`, and `secretCode`.
  
- **POST** `/api/auth/login`
  - Logs in an existing administrator.
  - Requires `username` and `password`.
  
- **POST** `/api/auth/verify-token`
  - Verifies the provided JWT token.

### Pages

- **GET** `/api/pages`
  - Fetches a paginated list of pages.
  - Requires a valid JWT token in the `Authorization` header.
  
- **GET** `/api/pages/:path`
  - Fetches a single page by its path.
  - Requires a valid JWT token in the `Authorization` header.
  
- **POST** `/api/pages`
  - Creates or updates a page.
  - Requires a valid JWT token in the `Authorization` header.
  
- **DELETE** `/api/pages/:id`
  - Deletes a page by its ID.
  - Requires a valid JWT token in the `Authorization` header.

## Running with Docker

1. Create a `docker-compose.yml` file:

   ```yaml
   version: '3.8'

   services:
     mongo:
       image: mongo:latest
       container_name: mongo_container
       restart: always
       ports:
         - "27017:27017"
       volumes:
         - mongo-data:/data/db
       networks:
         - app-network

     server:
       build: .
       container_name: local_server
       restart: always
       ports:
         - "33000:33000"
       depends_on:
         - mongo
       networks:
         - app-network

   volumes:
     mongo-data:

   networks:
     app-network:
       driver: bridge
   ```

2. Start the services:

   ```bash
   docker-compose up --build
   ```

## Client Application

The client application can be found at [page-generator-client](https://github.com/Denisphuket/page-generator-client).

## License

This project is licensed under the MIT License.
