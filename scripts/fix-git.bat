@echo off
echo Reparando indice do Git...
if exist .git\index del /f /q .git\index
git reset
echo Indice do Git reparado com sucesso!
pause
