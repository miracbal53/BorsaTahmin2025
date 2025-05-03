import psycopg2

def connect_db(config):
    """Veritabanına bağlanma"""
    conn = psycopg2.connect(
        host=config['DB_HOST'],
        database=config['DB_NAME'],
        user=config['DB_USER'],
        password=config['DB_PASSWORD'],
        options="-c client_encoding=UTF8"
    )
    return conn