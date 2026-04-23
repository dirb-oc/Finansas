import os
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from pydrive.auth import GoogleAuth
from pydrive.drive import GoogleDrive
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

MAX_BACKUPS = 5
DIAS_MINIMO = 3

PG_USER = os.getenv("PG_USER")
PG_PASSWORD = os.getenv("PG_PASSWORD")
PG_HOST = os.getenv("PG_HOST")
PG_PORT = os.getenv("PG_PORT")
DB_NAME = os.getenv("DB_NAME")

GOOGLE_SECRET_PATH = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_TOKEN_PATH = os.getenv("GOOGLE_TOKEN_JSON")
DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID")

RESPALDO_DIR = Path(os.getenv("CARPETA_RESPALDO"))

# Funciones
def autenticar_drive():
    gauth = GoogleAuth()
    gauth.LoadClientConfigFile(GOOGLE_SECRET_PATH)

    gauth.settings['get_refresh_token'] = True
    gauth.settings['oauth_scope'] = [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file"
    ]

    if os.path.exists(GOOGLE_TOKEN_PATH):
        gauth.LoadCredentialsFile(GOOGLE_TOKEN_PATH)

    try:
        if gauth.credentials is None:
            print("🔑 No se encontró token, iniciando autenticación...")
            gauth.LocalWebserverAuth()
            gauth.SaveCredentialsFile(GOOGLE_TOKEN_PATH)

        elif gauth.access_token_expired:
            print("♻️ Token caducado, intentando refrescar...")
            gauth.Refresh()
            gauth.SaveCredentialsFile(GOOGLE_TOKEN_PATH)

    except Exception as e:
        print(f"⚠️ Error con el token: {e}")
        print("🗑️ Eliminando token roto y solicitando autenticación nueva...")
        if os.path.exists(GOOGLE_TOKEN_PATH):
            os.remove(GOOGLE_TOKEN_PATH)

        # 🚨 Resetear credenciales para evitar que PyDrive intente refrescar de nuevo
        gauth.credentials = None  

        gauth.LocalWebserverAuth()
        gauth.SaveCredentialsFile(GOOGLE_TOKEN_PATH)

    print("✅ Autenticación con Google Drive lista")
    return GoogleDrive(gauth)

def obtener_backups_local():
    return sorted(RESPALDO_DIR.glob("*.backup"), key=os.path.getmtime)

def obtener_backups_drive(drive):
    query = f"'{DRIVE_FOLDER_ID}' in parents and trashed=false and title contains '.backup'"
    archivos = drive.ListFile({'q': query}).GetList()
    return sorted(archivos, key=lambda f: f['createdDate'])

def eliminar_backup_drive(archivo):
    print(f"🗑️ Eliminando de Google Drive: {archivo['title']}")
    archivo.Delete()

def eliminar_backup_local(archivo):
    print(f"🗑️ Eliminando backup local: {archivo.name}")
    archivo.unlink()

def backup_es_antiguo(archivo_local):
    mod_time = datetime.fromtimestamp(archivo_local.stat().st_mtime)
    return datetime.now() - mod_time > timedelta(days=DIAS_MINIMO)

def crear_backup():
    fecha_str = datetime.now().strftime("%Y%m%d")
    nombre_archivo = RESPALDO_DIR / f"{DB_NAME}_{fecha_str}.backup"

    comando = [
        "pg_dump",
        "-U", PG_USER,
        "-h", PG_HOST,
        "-p", PG_PORT,
        "-F", "c",
        "-f", str(nombre_archivo),
        DB_NAME
    ]

    env = os.environ.copy()
    env["PGPASSWORD"] = PG_PASSWORD

    try:
        subprocess.run(comando, env=env, check=True)
        print(f"✅ Backup local creado: {nombre_archivo}")
        subir_a_drive(nombre_archivo)
    except subprocess.CalledProcessError as e:
        print(f"❌ Error al crear backup: {e}")

def subir_a_drive(ruta_archivo):
    drive = autenticar_drive()
    archivo_drive = drive.CreateFile({
        'title': ruta_archivo.name,
        'parents': [{'id': DRIVE_FOLDER_ID}]
    })
    archivo_drive.SetContentFile(str(ruta_archivo))
    archivo_drive.Upload()
    print(f"☁️ Backup subido a Google Drive: {ruta_archivo.name}")

# BLOQUE 1: Verificar carpetas
if not RESPALDO_DIR.exists():
    RESPALDO_DIR.mkdir(parents=True, exist_ok=True)
    print(f"📂 Carpeta local creada: {RESPALDO_DIR}")
else:
    print(f"📂 Carpeta local: {RESPALDO_DIR}")

drive = autenticar_drive()

# BLOQUE 2: Mantener máximo de backups

# Local
backups_local = obtener_backups_local()
while len(backups_local) > MAX_BACKUPS:
    eliminar_backup_local(backups_local.pop(0))

# Drive
backups_drive = obtener_backups_drive(drive)
while len(backups_drive) > MAX_BACKUPS:
    eliminar_backup_drive(backups_drive.pop(0))

# BLOQUE 3: Crear backup si es necesario
backups_local = obtener_backups_local()

if not backups_local:
    crear_backup()
else:
    backup_reciente = backups_local[-1]
    if backup_es_antiguo(backup_reciente):
        crear_backup()
    else:
        print(f"⏳ Último backup ({backup_reciente.name}) es reciente, no se crea uno nuevo.")
