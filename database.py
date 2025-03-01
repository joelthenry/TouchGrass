import mysql.connector


def add_user(name: str, email: str, password: str):
    query = "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)"
    values = (name, email, password)
    cursor.execute(query, values)
    connection.commit()


db_config = {
    "host": "Dell_Eyal",
    "user": "eyalahat",
    "password": "Eyallahat1??",
    "database": "flower_users"
}

connection = mysql.connector.connect(**db_config)
cursor = connection.cursor()


def main():
    add_user("Curtis Predum", "curtis.predom@gmail.com", "CUh11")
    cursor.execute("USE flower_users")
    cursor.close()
    connection.close()


if __name__ == "__main__":
    main()
