#!/bin/bash
# 双击启动 Demo:本地静态服务 dist/ 并打开浏览器(无需 node/npm)
cd "$(dirname "$0")"
PORT=4173
if [ ! -f dist/index.html ]; then
  echo "dist/ 不存在,请先构建 (npm run build)"; read -n 1; exit 1
fi
if ! lsof -i :$PORT >/dev/null 2>&1; then
  (python3 -m http.server $PORT --directory dist >/dev/null 2>&1 &)
  sleep 1
fi
open "http://localhost:$PORT"
