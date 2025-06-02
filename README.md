
# django-react-bridge

[![npm version](https://img.shields.io/npm/v/django-react-bridge.svg)](https://www.npmjs.com/package/django-react-bridge)  
[![License: MIT](https://img.shields.io/npm/l/django-react-bridge.svg)](LICENSE)

[Link to NPM-Package](https://www.npmjs.com/package/django-react-bridge?activeTab=readme)

> The `django-react-bridge` npm package is a lightweight and flexible API client designed to streamline communication between a React frontend and a Django backend. It simplifies HTTP requests, manages JWT-based authentication, and includes features like caching and automatic retries, making it an ideal tool for integrating React applications with Django RESTful APIs.



## Table of Contents

1. [Overview](#overview)  
2. [Features](#features)  
3. [Installation](#installation)  


---

## Overview

`django-react-bridge` is intended to be the **minimal boilerplate** you need to:

- Perform authenticated HTTP requests (GET, POST, PUT, PATCH, DELETE) against a Django REST API  
- Automatically attach JWT tokens (or any bearer token) to outgoing requests  
- Offer transparent request retry mechanisms for transient failures  
- Provide an optional in-memory caching layer to reduce redundant network calls  

Whether your React application is built with Create React App, Next.js, or any other bundler, this package aims to keep your frontend code concise and focused on rendering—while it handles the plumbing of communicating with Django.

---

## Features

- **HTTP Request Wrappers**  
  - Promisified methods for `get()`, `post()`, `put()`, `patch()`, and `delete()`.  
  - Automatic JSON serialization/deserialization.  

- **JWT / Bearer Token Support**  
  - Pass a JWT (or any bearer token) once, and it will be attached under the `Authorization: Bearer <token>` header on every request.  

- **Automatic Retries**  
  - Built-in retry logic for network or 5xx errors.  
  - Configurable number of retries and backoff strategy.  

- **Simple In-Memory Caching**  
  - Optional caching layer keyed by endpoint URL + query params.  
  - Time-to-live (TTL) configuration.  

- **TypeScript Types Included**  
  - Fully typed interfaces for request options, response shapes, and configuration.  
  - Improves autocomplete in editors that support TS.  

---

## Installation

```bash
# Using npm
npm install django-react-bridge

# Or using Yarn
yarn add django-react-bridge
