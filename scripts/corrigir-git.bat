@echo off
echo ==============================================
echo   Corrigindo erro de indice corrompido do Git...
echo ==============================================
if exist " .git\index\ (del /f /q \.git\index\)
git reset HEAD
echo ==============================================
echo Git reparado com sucesso!
echo ==============================================
pause
