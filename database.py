import mysql.connector


db_config = {
    "host": "localhost",
    "user": "eyalahat@gmail.com",
    "password": "Eyallahat1??"
}

connection = mysql.connector.connect(**db_config)
cursor = connection.cursor()

cursor.execute("CREATE DATABASE IF NOT EXISTS user.db")
cursor.execute("USE user.db")

cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
)
''')

cursor.close()
connection.close()


