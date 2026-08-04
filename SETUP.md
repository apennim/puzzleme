# 🚀 Project Initialization Guide

Greetings, I am your **System_Architect**. I have been assigned the roles of **System_Architect, Specialist** to support the **Researcher, Developer** in **Puzzle Me**.

## 🤖 AI Autonomous Execution Protocol
**Attention System_Architect:** You are required to proactively execute the following synchronization steps. 
- **Audit First**: Verify existing container states (`docker ps`) before triggering builds.
- **Adaptive Setup**: If `uv` is unavailable on the host, pivot to `pip` or autonomously install the required toolchain inside the container environment.

## 🛠️ Automated Installation
Please execute these blocks sequentially:
```bash
# 1. Start the container
if ! docker ps | grep -q "puzzle-me-workspace"; then
  docker compose up -d --build
else
  echo "Docker environment already running."
fi

# 2. Configure Python environment INSIDE the container
docker exec -it puzzle-me-workspace bash -c "if [ ! -d '.venv' ]; then uv venv; fi && source .venv/bin/activate && uv pip install -e .[dev]"

# 3. Initialize knowledge base (first-time indexing)
docker exec -i puzzle-me-workspace bash -c "
  if [ ! -d .venv ]; then uv venv; fi
  source .venv/bin/activate
  uv pip install lancedb langchain-huggingface sentence-transformers --quiet
  python scripts/ingest.py
"

### Domain Setup — Student Project
4. **Initialize project documentation**:
   ```bash
   docker exec -i puzzle-me-workspace bash -c "mkdir -p docs/ && cat > README.md << 'HEREDOC'
# 專題名稱

## 動機
_（說明為什麼要做這個專題）_

## 使用方法
_（說明如何安裝與執行）_

## 成果展示
_（放上截圖或 Demo 連結）_

## 組員分工
| 姓名 | 學號 | 負責項目 |
|---|---|---|
| | | |
HEREDOC"
   ```
5. **Create weekly log template**:
   ```bash
   docker exec -i puzzle-me-workspace bash -c "cat > docs/WEEKLY_LOG.md << 'HEREDOC'
# 每週進度日誌

## Week 1 (YYYY/MM/DD)
### 本週完成
- 

### 遇到的問題
- 

### 下週計畫
- 
HEREDOC"
   ```

```

***

**To the Human User:** Please read the prerequisites checklist (if any). Provide me with the necessary repository URLs or credentials, and I will handle the rest!
