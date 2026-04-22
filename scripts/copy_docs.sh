#!/usr/bin/env bash
# Copia o conteúdo de docs/html para docs/
set -euo pipefail

SRC="docs/html"
DST="docs"

if [ ! -d "$SRC" ]; then
  echo "Fonte não encontrada: $SRC"
  exit 1
fi

echo "Copiando $SRC -> $DST"
mkdir -p "$DST"
# copia preservando atributos, sobrescreve
cp -r "$SRC"/* "$DST"/
echo "Cópia concluída. Conteúdo de $DST:" 
ls -la "$DST" | sed -n '1,200p'
