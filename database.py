import mysql.connector


def add_user(name: str, email: str, password: str):
    db_config = {
        "host": "Dell_Eyal",
        "user": "eyalahat",
        "password": "Eyallahat1??",
        "database": "flower_users"
    }

    # connect to mySQL server
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

    except mysql.connector.Error as err:
        print("Error in connection to SQL Server \n {err}")

    cursor.execute("USE flower_users")

    # insert user into database
    try:
        query = "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)"
        values = (name, email, password)
        cursor.execute(query, values)
        connection.commit()

    except:
        print("Error, can't add user to database.")

    cursor.close()
    connection.close()

