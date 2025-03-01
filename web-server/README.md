# Node Web Server

This project is a simple web server built using Node.js. It serves static files and handles HTTP requests through defined routes.

## Project Structure

```
node-web-server
├── src
│   ├── server.js          # Entry point of the application
│   ├── routes             # Contains route definitions
│   │   └── index.js
│   ├── controllers        # Contains request handling logic
│   │   └── index.js
│   ├── middlewares        # Contains middleware functions
│   │   └── index.js
│   └── utils              # Contains utility functions
│       └── index.js
├── public                 # Contains static files
│   ├── css
│   │   └── styles.css     # CSS styles for the web application
│   ├── js
│   │   └── main.js        # Client-side JavaScript
│   └── index.html         # Main HTML file
├── views                  # Contains view templates
│   └── layouts
│       └── main.js        # Layout-related functions
├── config                 # Configuration settings
│   └── config.js
├── package.json           # npm configuration file
└── README.md              # Project documentation
```

## Getting Started

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd node-web-server
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Start the server:
   ```
   npm start
   ```

## Features

- Static file serving
- Route handling
- Middleware support
- Utility functions for common tasks

## License

This project is licensed under the MIT License.