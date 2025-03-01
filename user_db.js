const mysql = require('mysql2');

// Function to add a user to the database
function addUser(name, email, password) {
    const dbConfig = {
        host: "Dell_Eyal",
        user: "eyalahat",
        password: "Eyallahat1??",
        database: "flower_users"
    };

    // Create a connection to MySQL
    const connection = mysql.createConnection(dbConfig);

    connection.connect((err) => {
        if (err) {
            console.error("Error in connection to SQL Server:", err.message);
            return;
        }
        console.log("Connected to MySQL!");

        // Insert user into the database
        const query = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
        const values = [name, email, password];

        connection.query(query, values, (error, results) => {
            if (error) {
                console.error("Error, can't add user to database:", error.message);
            } else {
                console.log("User added successfully! ID:", results.insertId);
            }

            // Close connection
            connection.end();
        });
    });
}
