# BookMyLens-Final-Project
BookMyLens is a full-stack web application designed to streamline the process of discovering, customizing, and booking photography services. 

# BookMyLens

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Express](https://img.shields.io/badge/Express.js-Backend-black?logo=express)
![MySQL](https://img.shields.io/badge/MySQL-Database-blue?logo=mysql)
![License](https://img.shields.io/badge/License-ISC-lightgrey)
![Status](https://img.shields.io/badge/Status-Active-success)

---

## Overview

BookMyLens is a full-stack photography booking platform that connects customers and photographers through customizable packages, messaging, and negotiation features.

This project demonstrates full-stack development, database design, and API integration.

---

## Features

### Authentication

* Customer and Photographer account creation
* Secure login with password hashing (bcrypt)
* Session handling via browser storage

### Package Builder

* Create customizable photography packages
* Dynamic pricing based on:

  * Add-ons
  * Location
  * Number of people 
* Live preview before submission

### Browse Packages

* Filter by category and location
* View community-created packages
* Pre-built event templates 

### Messaging System

* Chat between users
* Conversation history
* Linked packages inside chats
* Negotiation via proposals 

### Proposal System

* Send and receive offers
* Status tracking:

  * Pending
  * Accepted
  * Rejected
  * Cancelled

---

## Tech Stack

### Frontend

* HTML, CSS, JavaScript 

### Backend

* Node.js with Express 

### Database

* MySQL (Relational)

### Dependencies

* express
* mysql2
* bcrypt
* cors
* dotenv
* body-parser 

---

## Database Design

### Core Tables

* customer
* photographer
* packages
* addons
* saved_packages
* messages
* proposals

### Lookup Tables

* categories
* locations

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/bookmylens.git
cd bookmylens
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup MySQL Database

```sql
CREATE DATABASE software_engineering;
```

Run your schema file to create tables.

---

### 4. Configure Environment Variables

Create a `.env` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=software_engineering
```

---

### 5. Start Server

```bash
node server.js
```

Server runs on:

```plaintext
http://localhost:3000
```

---

### 6. Run Frontend

Open in browser:

```plaintext
home_page.html
```

---

## API Endpoints

### Authentication

```plaintext
POST /customer/register
POST /customer/login
POST /photographer/register
POST /photographer/login
```

### Messaging

```plaintext
POST /send-message
GET /get-messages
GET /conversations
```

### Packages

```plaintext
POST /package/create
GET /packages/browse
```

---

## Project Structure

```plaintext
bookmylens/
│
├── frontend/
│   ├── home_page.html
│   ├── browse_packages.html
│   ├── create_package.html
│   ├── chat.html
│   ├── login.html
│   ├── customer_register.html
│   ├── photographer_register.html
│   ├── style.css
│   └── script.js
│
├── backend/
│   └── server.js
│
├── database/
│   └── schema.sql
│
├── package.json
└── README.md
```

---

## Security

* Password hashing with bcrypt
* Basic validation on API endpoints

Recommended improvements:

* JWT authentication
* Input sanitization
* HTTPS deployment

---

## Future Enhancements

* Image uploads for packages
* Payment integration
* Real-time messaging
* Reviews and rating system
* Advanced search filters

---

## Author

Natalie (Giselle Camacho)
Computer Science Student

---

## License

ISC License

---

## Support

If you find this project useful, consider starring or contributing.
