# Versión para Windows/PowerShell de setup.sh: crea el .env de la raíz que usa
# docker-compose.yml, con JWT_SECRET y clave de Postgres aleatorios.
# Se corre UNA sola vez desde la raíz del repo. No pisa un .env que ya exista.
#
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1
#   docker compose up -d --build

Set-Location $PSScriptRoot

if (Test-Path .env) {
    Write-Host ".env ya existe; no se toca. Bórralo si quieres generarlo de nuevo."
    exit 0
}

function Get-Aleatorio([int]$bytes) {
    $buffer = New-Object byte[] $bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
    return ($buffer | ForEach-Object { $_.ToString('x2') }) -join ''
}

$publicUrl = Read-Host "URL pública donde se abrirá el sistema [http://localhost]"
if ([string]::IsNullOrWhiteSpace($publicUrl)) { $publicUrl = 'http://localhost' }
$httpPort = Read-Host "Puerto HTTP [80]"
if ([string]::IsNullOrWhiteSpace($httpPort)) { $httpPort = '80' }

$fecha = Get-Date -Format 'yyyy-MM-dd HH:mm'
$contenido = @"
# Generado por setup.ps1 el $fecha. NO subir a GitHub.

# Dónde se abre el sistema (se usa para CORS y para los enlaces de correo).
PUBLIC_URL=$publicUrl
HTTP_PORT=$httpPort

# Secretos generados al azar para esta máquina.
JWT_SECRET=$(Get-Aleatorio 32)
POSTGRES_PASSWORD=$(Get-Aleatorio 16)

# Contraseña de los usuarios de prueba que crea el seed.
SEED_PASSWORD=uajs2026
JWT_EXPIRES_IN=8h

# Opcional: recuperación de contraseña por correo (contraseña de aplicación de Google).
EMAIL_USER=
EMAIL_PASS=
"@

# UTF-8 sin BOM para que docker compose lea bien la primera variable.
[System.IO.File]::WriteAllText((Join-Path $PSScriptRoot '.env'), $contenido, (New-Object System.Text.UTF8Encoding $false))

Write-Host ""
Write-Host "Listo: .env creado con PUBLIC_URL=$publicUrl y secretos nuevos."
Write-Host "Ahora corre:  docker compose up -d --build"
