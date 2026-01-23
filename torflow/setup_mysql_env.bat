@echo off
echo Setting up Torflow Database...
echo Please enter your MySQL ROOT password when prompted.

"C:\Program Files\MySQL\MySQL Server 9.5\bin\mysql.exe" -u root -p -e "CREATE DATABASE IF NOT EXISTS torflow; CREATE USER IF NOT EXISTS 'torflow'@'localhost' IDENTIFIED WITH mysql_native_password BY 'torflow'; ALTER USER 'torflow'@'localhost' IDENTIFIED WITH mysql_native_password BY 'torflow'; GRANT ALL PRIVILEGES ON torflow.* TO 'torflow'@'localhost'; FLUSH PRIVILEGES;"

if %errorlevel% neq 0 (
    echo Database setup failed. Please check your password.
    pause
    exit /b %errorlevel%
)

echo.
echo Database created. Running ingest script...
call node bin/ingest data/sample

echo.
echo Setup complete! You can now run 'npm start'.
pause
