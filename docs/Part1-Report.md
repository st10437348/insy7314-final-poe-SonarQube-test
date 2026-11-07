# HustleHub+ — Part 1 Report (Architecture & HTTPS/Authentication)

> This is the original Part 1 README, kept for reference. See the main [README](../README.md) for Part 2.

- ST10258513 Clifford Naude Group 1 
- ST10453370 Ruan Helgaard Hartman Group 1
- ST10438433 Caleb Forbes Group 1
- ST10437348 Alexandro Ornelas Group 1

POE PART 2
# Startup Information
1. Install Dependencies
Run the install command from the main root directory to download all required packages:

cd Project
npm install

2. Environment Configuration (.env Files)
Create two separate .env files with the configuration values below.

Backend Environment File
Create a .env file inside the server/ directory (server/.env):
Code snippet:
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/hustlehub
JWT_SECRET=your_jwt_secret_here


Frontend Environment File
Create a .env file inside the client/src/ directory (client/src/.env):

Code snippet:
VITE_API_URL=http://localhost:5000



3. Running the Application
From the root project directory, run a single command to start both the frontend and backend simultaneously:

cd Project
npm run dev
Frontend App: http://localhost:5173

## ARCHITECTURE

## Report

## Architecture Diagram

<img width="646" height="2423" alt="INSY7314_POE_PART1_Architecture_ST10258513_CliffordNaude_Gr1PIC" src="https://github.com/user-attachments/assets/dda9988c-eaaf-4dcb-be2c-771a7bdaecf5" />

*Figure 1: HustleHub MERN architecture showing the intended system components, security features, system boundaries, and communication between layers.*

## Report

### Introduction

This project is a web-based application for HustleHub to have a freelance marketplace 
platform. The website will allow for services to be booked and other features. We use 
three tier architecture of presentation, application and data layer. Incorporates multiple 
security methods. We use node.js, React.js, MongoDB and Express.js for this project. 
Including an online database and multiple security features. 

The architecture diagram and report describe the intended overall HustleHub system. The implemented Part 1 backend currently focuses on HTTPS, registration, login, password hashing, JWT route protection, input validation, controlled error handling, and testing.

### System Overview

App is built using 

MongoDB: This is a document-oriented database that is an alternative to relational 
databases, (MongoDB, 2026). It allows for JSON documents that maps objects in the 
classes. We use this database for storing information about the clients, bookings made 
and any other information meant to be used for the application. It has a cloud version 
that can also be used as this is the local database 

Express.js: This is a minimal and flexible node.js framework for web applications, 
(express, 2026). It provides thin layer of features to web applications without conflicting 
with node.js. It is a lightweight routing framework with minimal features using express 
middleware modules. This framework is used for developing the API for our application. 

React.js: This is a component-based JavaScript library used for creating user interfaces, 
(geeksforgeeks, 2026). It is used for creating reusable UI components. Fast 
development, scalable. We will use this for our application to have a user-friendly UI 
while keeping the code reusable and organized. 

Node.js: This is an open source and cross platform JavaScript runtime environment that 
is used as our primary tool for our project, (Node.js, 2026). It runs in a single process 
and provides asynchronous I/O primitives in its library. This allows for background 
running while the application runs and improves performance since the application can 
continue while it waits for a request to be processed. 

System follows the MERN architecture, (geeksforgeeks, 2026), is a full stack JavaScript 
framework used for modern and scalable web applications using one programming 
language for both frontend and backend. It connects the frontend, backend and 
database together. This includes NodeJS (Frontend), ExpressJS (backend), MongoDB 
(Database) and React (Frontend Library). Its highly scalable, high performance, 
developer friendly and large ecosystem with npm and other packages. 

### System Architecture

#### Client Layer (Frontend)

The frontend is a visual representation of the application (User Interface (UI)) for users 
using React.js 

Following Responsibilities for Frontend includes: 

- Showing the web pages 
- Handling user inputs 
- Input validation on the client side 
- Protects authentication routes 
- Manages user authentication 
- Sends HTTP requests to the API 

#### Application Layer (Backend)

Backend is a central processing unit for the application where the core logic runs. Built 
using Node.js and Express.js 

The backend Handles the following:  

- Incoming API requests 
- Authenticates users usings information from database 
- Validates uses input data as while as frontend 
- Includes business logic 
- Communicates with local and online databases like MongoDB and firebase 
- Returns JSON responses to the API requests 
- Does CRUD operations 

#### Data Layer (Database)

MongoDB uses documents and collections for storing structured and semi-structured 
data. 

This layer stores the application data and is responsible for: 

- Application settings 
- User accounts 
- Products 
- Orders 
- Reviews 

### System Boundaries

System boundaries separate the internal components of applications into more 
manageable and user-friendly format for easier readability and useability. 

#### Outside System

- Web Browser 
- Internet 
- External Users 

#### Inside System

- React frontend 
- MongoDB database 
- Note.js 
- Express API server 

#### External Services

- Email services 
- Cloud storage 
- Payment Gateway 

### Security Features

We will be using the Open Web Application Security Project Guide for ensuring security 
for our application, (Dhananjaya, 2025) used for this section. 

#### HTTPS (Hypertext Transfer Protocol Secure)

HTTPS ensures that data exchanged between client and server is secure but enforcing 
HTTPS in Express, (Patel, 2024). 

Express does not secure HTTP headers by default and that is why we will be using 
Helmet middleware to mitigate the risk with security headers. Helmet sets headers to 
prevent clickjacking and cross-site scripting. 

For Part 1, `config/https.js` loads a locally generated SSL key and certificate and creates the server with Node.js `https.createServer`. HTTPS encrypts credentials, JWTs, and API responses while they travel between Postman and the backend. The self-signed certificate is intended for local development.

#### JSON Web Token (JWT)

This is a way to authenticate user’s identity while ensuring that only certain users can 
access certain sensitive data, (Patel, 2024). This is a stateless authentication. 

After a successful login, the implemented backend signs a time-limited JWT containing only the user ID and role. Protected routes expect `Authorization: Bearer <token>` and reject missing, invalid, or expired tokens with a controlled `401 Unauthorized` response.

#### SQL Injection and NoSQL Injection

Using (Tanner, 2025), SQL injection is where code is exploited for its vulnerabilities 
through injecting SQL code into input fields allowing them access to databases. We can 
use Query builders to have type safety and automatic parameterization. Prisma reduces 
the SQL injection risk in APIs. Drizzle ORM is also used for SQL-like syntax development. 
Input validation and sanitization is the best defence since it catches the data before it 
gets to the database. 

#### Password Hashing

Hashing is converting given key into another value. Password hashing is converting 
password input into strings of characters, (Dennis Temoye Charity, 2024). This process 
is a one-way function using Bcrypt. This is a cryptographic algorithm for securely storing 
passwords. Bycrypt includes Salting, it adds random number called salt that is unique 
to each password and is attached before hashing. 

The registration controller uses bcrypt with ten salt rounds before saving a user. Login uses `bcrypt.compare` to verify the submitted password against the stored hash. Passwords and password hashes are excluded from successful API responses.

#### Input Validation

We validate what the user put in using an express validator, (Patel, 2024). This prevents 
Cross-Site Scripting (XSS) and a Content Security Policy (CSP) 

The implemented registration validation checks the name, email, password, and role. Passwords must contain 8–128 characters, including an uppercase letter, lowercase letter, number, and special character. Validation errors return safe field names and messages without echoing the submitted password.

#### Cross-Origin Resource Sharing (CORS)

This is an HTTP-header mechanism that allows a server to indicate origins that are not 
its own, (mozilla, 2026). Its uses preflight request to the server hosting the resource to 
check if the server will permit the request. Works by adding HTTP headers that let 
servers describe which origins can be read. Default, browsers block cross-origin 
requests to prevent unauthorized access to data. This allows for third party domains to 
share resources. 

#### Rate Limiting

To prevent DDoS and brute-force attacks, we limit the number of requests made by a 
client by using express-rate-limit, (Patel, 2024). We can use express-rate-limit to prevent 
brute-force attacks. We can also use Cross-Site Request Forgery (CSRF) to prevent 
CSRF attacks. Express session is also used for secure Session Storage. 

#### Environment Variables

This protects sensitive information in Node.js applications, (Crudu & Team, 2026), By 
separating configuration details from the code and reduces risk of exposing sensitive 
data in version control systems like GitHub. It does centralize config data as while 
making development easier. This avoids hardcoded sensitive data and exposing 
variables in logs. Dotenv is a simplified local environment setup, but online cloud 
services have their own solutions. 

#### Error Handling

The implemented error middleware returns controlled JSON responses for invalid input (`400`), authentication failures (`401`), unknown routes (`404`), duplicate records (`409`), oversized JSON (`413`), and unexpected server failures (`500`). Stack traces, internal file paths, database details, and configuration values are not returned to API users.

### Software Requirements

- Node.js 
- Command Prompt 
- GitHub 
- Visual Studio Code 
- MongoDB 

### Required Packages

The following packages cover both the current implementation and security features planned in the overall architecture.

#### Backend

- Express.js 
- JSON Web Token 
- Helmet 
- BCrypt 
- Mongoose 
- Dotenv 
- CORS 
- Express Rate Limit 
- Nodemon 

#### Frontend

- React 
- React Router DOM 
- Axios 

### Installation Procedure

#### Backend

1. Open the `Project/server` directory 
2. Install the dependencies using `npm.cmd install` 
3. Configure the `.env` File with `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `PORT` 
4. Generate the local certificate using `npm.cmd run generate-cert` 
5. Run the automated tests using `npm.cmd test` 
6. Start using `npm.cmd run dev`

#### Frontend

1. Create React Application 
2. Install Axios and React Router DOM 
3. Configure API endpoints 
4. Start using npm start

### System Workflow

1. User accesses the website using the web browser 
2. React frontend loads UI 
3. User submits request to login in using login credentials and is validated by 
frontend before sent for input validation 
4. Request is sent securely to Express API 
5. Backend validates the request 
6. JWT is verified 
7. Backend retrieves and stores information to the database (MongoDB) 
8. A response is returned to frontend from the API 
9. React updates the UI and the requested information gets displayed.

### Part 1 Testing

The backend test suite is run from `Project/server` using `npm.cmd test`. It contains 16 automated tests covering HTTPS, registration validation, password hashing, duplicate registration, login, JWT generation, protected routes, malformed JSON, unknown routes, oversized JSON, and controlled server errors. The current result is 16 passed and 0 failed.

The exported Postman collection is stored in the `PostmanCollection` folder. Its 14 requests demonstrate successful registration and login, JWT-protected access, validation, and controlled error responses. The full run contains 35 passing tests, while the separate five-iteration password-policy run contains 15 passing tests.

### Video Demonstration

**Unlisted video link:** https://youtu.be/_TZ8-mItvcw.

### Conclusion

The project setup is best for performance, security and industry standard approaches to 
developing an application. The web-based application uses node.js, MongoDB, React 
and express. We created a backend, frontend and linked the API to a database using 
MongoDB. We will integrate security measures to ensure that the application is safe 
from unauthorized access. The use of MERN architecture and OWASP guidelines to 
make an robust industry standard web-based application for freelancers to create 
bookings online with clients.  

## ScreenShots.

### RejectUnknownRoute

<img width="1002" height="495" alt="image" src="https://github.com/user-attachments/assets/1008394b-2ff7-42a7-a35b-78c53732314f" />

*Figure 2: An unknown API route returns a controlled `404 Not Found` response.*

### RejectProtectedRouteWithoutJWT

<img width="1360" height="620" alt="RejectProtectedRouteWithoutJWT" src="https://github.com/user-attachments/assets/cf3835d9-f029-4946-ba4f-251d0aa0a5de" />

*Figure 3: A protected route rejects a request without a JWT using `401 Unauthorized`.*

### RejectProtectedRouteWithInvalidJWT

<img width="1364" height="683" alt="RejectProtectedRouteWithInvalidJWT" src="https://github.com/user-attachments/assets/7af0d5db-77fe-46f0-a0ca-d888f039993f" />

*Figure 4: A protected route rejects an invalid or expired JWT without exposing verification details.*

### RejectMissingRegistrationFields

<img width="1371" height="909" alt="RejectMissingRegistrationFields" src="https://github.com/user-attachments/assets/33beea7b-f11f-4834-9342-ee2a218cddc6" />

*Figure 5: Missing registration fields return a controlled `400 Bad Request` validation response.*

### RejectMissingLoginFields

<img width="1371" height="884" alt="RejectMissingLoginFields" src="https://github.com/user-attachments/assets/6b6d44a7-75b1-4480-a66a-936e9bd51263" />

*Figure 6: Missing login fields are rejected without echoing submitted credentials.*

### RejectMalformedJSON

<img width="1001" height="506" alt="image" src="https://github.com/user-attachments/assets/64e7cb63-decd-4279-8603-9f55818f8841" />

*Figure 7: Malformed JSON receives a controlled `400 Bad Request` response without parser details.*

### RejectInvalidRegistrationValues

<img width="1367" height="824" alt="RejectInvalidRegistrationValues" src="https://github.com/user-attachments/assets/121c62c0-f05d-4da4-bc18-50383ea77d86" />

*Figure 8: Invalid registration values produce consistent field-level validation messages.*

### RejectInvalidLoginCredentials

<img width="1361" height="733" alt="RejectInvalidLoginCredentials" src="https://github.com/user-attachments/assets/3aa6f336-6f7f-494a-be50-7f673b8ec267" />

*Figure 9: Invalid credentials return a generic `401 Unauthorized` response.*

### RejectDuplicateRegistration

<img width="1568" height="746" alt="RejectDuplicateRegistration" src="https://github.com/user-attachments/assets/f75ee6a4-033a-468d-b084-bf962a51b923" />

*Figure 10: Duplicate registration returns `409 Conflict` with a controlled message.*

### RegisterValidUser

<img width="999" height="534" alt="image" src="https://github.com/user-attachments/assets/23f638ea-9c1a-4c54-baf6-8f1fe264d926" />

*Figure 11: Valid user registration returns `201 Created` without exposing the password.*

### PowerShellTestPassingProof

<img width="1303" height="854" alt="PowerShellTestPassingProof" src="https://github.com/user-attachments/assets/242a5cec-5157-440e-b497-a426e12f0fba" />

*Figure 12: All 16 automated backend tests pass and the HTTPS server starts successfully.*

### PostmanCollectionTestPassed

<img width="669" height="652" alt="PostmanCollectionTestsPassed" src="https://github.com/user-attachments/assets/867c6f57-f842-433c-85be-b822b3fad779" />

*Figure 13: The complete Postman collection finishes with 35 passing tests and no errors.*

### PasswordPolicyValidationIterationsPassedProof

<img width="822" height="284" alt="PasswordPolicyValidationIterationsPassedProof" src="https://github.com/user-attachments/assets/7f9b9893-0f39-4fc8-81c0-8e4575728a4d" />

*Figure 14: Five password-policy iterations complete with 15 passing tests and no errors.*

### PasswordPolicyValidation

<img width="1033" height="737" alt="PasswordPolicyValidation" src="https://github.com/user-attachments/assets/2ce7df32-a114-44ba-b17b-1f6f44220139" />

*Figure 15: A password that does not meet the complexity policy is rejected safely.*

### LoginValidUserAndSaveJWT

<img width="1310" height="787" alt="LoginValidUserAndSaveJWT" src="https://github.com/user-attachments/assets/5ee886b3-e765-4d17-be0d-bfc1216ae80b" />

*Figure 16: Valid login credentials return `200 OK` and generate a JWT.*

### HTTPSHealthCheck

<img width="1573" height="641" alt="HTTPSHealthCheck" src="https://github.com/user-attachments/assets/49e4d7a3-4241-4a58-9a28-975af48dec96" />

*Figure 17: The HTTPS health check returns `200 OK` and confirms that the API is running.*

### BearerToken

<img width="1560" height="915" alt="BearerToken" src="https://github.com/user-attachments/assets/e5f05c1c-b247-4270-925d-9b462287b45f" />

*Figure 18: Postman supplies the saved `{{token}}` variable using Bearer authentication.*

### AccessProtectedRouteWithJWT

<img width="1543" height="904" alt="AccessProtectedRouteWithJWT" src="https://github.com/user-attachments/assets/951eecf5-9716-4ffc-8d88-aa027bbe8a90" />

*Figure 19: A valid JWT grants access to the protected user route without exposing password hashes.*

## References

- Crudu, V., & Team, M. R. (2026, June 15). Enhancing Node.js Application Security with 
  Environment Variables. Retrieved from MoldStud: 
  https://moldstud.com/articles/p-enhancing-nodejs-application-security-with
  environment-variables 

- Dennis Temoye Charity. (2024, April 3). How to Hash Passwords with bcrypt in Node.js. 
  Retrieved from freeCodeCamp: https://www.freecodecamp.org/news/how-to
  hash-passwords-with-bcrypt-in-nodejs/ 

- Dhananjaya, K. (2025, February 8). Implementing Security in a Node.js Express Server: 
  An OWASP Guide. Retrieved from Medium: 
  https://medium.com/@kumar62.shivu/implementing-security-in-a-node-js
  express-server-an-owasp-guide-8d4c62733164 

- express. (2026, January 1). Home Page. Retrieved from expressjs: 
  https://expressjs.com/ 

- geeksforgeeks. (2026, June 3). MERN Stack. Retrieved from geeksforgeeks: 
  https://www.geeksforgeeks.org/mern/understand-mern-stack/ 

- geeksforgeeks. (2026, June 29). React Introduction. Retrieved from geeksforgeeks: 
  https://www.geeksforgeeks.org/reactjs/reactjs-introduction/ 

- MongoDB. (2026, January 1). MongoDB Atlas: Multi-Cloud Database Service. Retrieved 
  from MongoDB: https://www.mongodb.com/docs/ 

- mozilla. (2026, January 1). Cross-Origin Resource Sharing (CORS). Retrieved from 
  mozilla: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS 

- Node.js. (2026, January 1). Introduction to Node.js. Retrieved from Node.js: 
  https://nodejs.org/learn/getting-started/introduction-to-nodejs#introduction-to
  nodejs 

- Patel, R. (2024, November 27). Top 5 Ways to Secure Your Express.js APIs. Retrieved 
  from DEV: https://dev.to/rigalpatel001/top-5-ways-to-secure-your-expressjs
  apis-13i5 

- Tanner, M. (2025, August 25). Node.js SQL Injection Guide: Examples and Prevention. 
  Retrieved from StackHawk: https://www.stackhawk.com/blog/node-js-sql
  injection-guide-examples-and-prevention/ 
