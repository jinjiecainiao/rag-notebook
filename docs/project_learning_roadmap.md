# RAG NoteBook 项目学习路线

> 目标：用 4 周时间完整掌握本项目，从本地运行、认证链路、笔记业务、知识库/RAG 到调试与交付能力。建议每天投入 1-2 小时，每周至少完成一次端到端实践。

## 0. 学习成果标准

完成这份路线后，你应能做到：

1. 独立启动 `front`、`backend`、`DjangoUserService` 三个服务，并解释端口、代理和环境变量如何协作。
2. 解释注册、登录、JWT 签发、JWT 校验、前端路由守卫、Redis 黑名单之间的完整关系。
3. 追踪一次笔记列表、新建笔记、编辑笔记、知识库上传、RAG 问答、AI 聊天请求的完整调用链。
4. 通过浏览器 DevTools、FastAPI 日志、Django 日志、Redis、数据库定位常见问题。
5. 独立完成一个小型 bugfix 或功能改动，并提供明确的运行时验证证据。

## 1. 项目全景

### 1.1 三端职责


| 模块          | 目录                  | 主要技术                                  | 职责                         |
| ----------- | ------------------- | ------------------------------------- | -------------------------- |
| 前端          | `front`             | Vue 3、Vite、Vant、Pinia、Vue Router      | 页面展示、路由跳转、登录态保存、调用 API     |
| FastAPI 后端  | `backend`           | FastAPI、LangChain、ChromaDB、SQLAlchemy | 笔记、知识库、RAG、聊天、回顾、JWT 校验    |
| Django 用户服务 | `DjangoUserService` | Django、DRF、JWT、Redis                  | 注册、登录、用户资料、文件服务、JWT 签发和黑名单 |


### 1.2 优先阅读文件

按这个顺序读，不要一开始按文件树从上到下读：

1. `README.md`：了解项目定位、特性、启动方式、环境变量。
2. `docs/project_develop.md`：理解项目为什么从基础 RAG 转成 RAG NoteBook。
3. `DjangoUserService/api.md`：理解注册、登录、用户信息、文件接口。
4. `front/src/config/api.js`：看前端有哪些 API 入口。
5. `front/vite.config.js`：理解前端如何代理到 `8000` 和 `8001`。
6. `backend/main.py`：看 FastAPI 应用、中间件、路由注册。
7. `DjangoUserService/DjangoUserService/urls.py`：看 Django 用户服务路由入口。

## 2. 第 1 周：环境、目录和认证链路

### 第 1 天：建立项目地图

**目标**：知道项目每个目录大概负责什么。

**具体步骤**：

1. 打开 `README.md`，只读三部分：项目简介、快速开始、项目结构。
2. 在终端列出顶层目录：
  ```bash
   find . -maxdepth 2 -type d | sort
  ```
3. 对照下面路径做标记：
  - 前端页面：`front/src/views`
  - 前端路由：`front/src/router/index.js`
  - 前端状态：`front/src/store`
  - 前端 API 配置：`front/src/config/api.js`
  - FastAPI 路由：`backend/app/router`
  - FastAPI 业务服务：`backend/app/services`
  - FastAPI 模型：`backend/app/models`
  - RAG 核心：`backend/app/rag`
  - Agent：`backend/app/agent`
  - Django 用户：`DjangoUserService/apps/user`
  - Django 文件：`DjangoUserService/apps/file`
4. 建议在自己的笔记里画一张最小结构图：
  ```text
   front -> vite proxy -> backend:8000 -> MySQL/Redis/Chroma/LLM
                     -> DjangoUserService:8001 -> 用户库/Redis
  ```

**验收标准**：

- 能说明 `front`、`backend`、`DjangoUserService` 各自职责。
- 能说出前端请求 `/note/list` 最终会进入哪个后端模块。

### 第 2 天：跑通本地服务

**目标**：启动三端服务，确认浏览器能访问前端和 API 文档。

**具体步骤**：

1. 检查依赖版本：
  ```bash
   python --version
   node --version
   uv --version
  ```
2. 安装 FastAPI 后端依赖：
  ```bash
   cd backend
   uv sync
  ```
3. 安装 Django 用户服务依赖：
  ```bash
   cd DjangoUserService
   uv sync
  ```
4. 安装前端依赖：
  ```bash
   cd front
   pnpm install
  ```
5. 准备环境变量：
  - `backend/.env` 参考 `README.md` 的后端环境变量。
  - `DjangoUserService/.env` 参考 `README.md` 的用户服务环境变量。
  - 重点确认：`backend/.env` 的 `SECRET_KEY` 要和 `DjangoUserService/.env` 的 `JWT_SECRET_KEY` 一致。
6. 启动依赖服务：MySQL、Redis、模型服务或阿里云模型配置。
7. 启动 Django 迁移：
  ```bash
   cd DjangoUserService
   python manage.py migrate
  ```
8. 分别启动服务：
  - Django 用户服务：通常监听 `8001`。
  - FastAPI 后端：通常监听 `8000`。
  - 前端：
    ```bash
    cd front
    pnpm dev
    ```
9. 浏览器检查：
  - 前端：`http://localhost:3000`
  - FastAPI 文档：`http://localhost:8000/docs`

**验收标准**：

- 前端首页可打开。
- FastAPI `/docs` 可打开。
- 注册/登录请求能发到 `localhost:3000/user/...` 并被代理到 Django 服务。

### 第 3 天：理解 Vite 代理和前端 API

**目标**：知道前端为什么请求 `localhost:3000/note/list`，却会到 FastAPI。

**具体步骤**：

1. 阅读 `front/src/config/api.js`。
2. 找出这几类端点：
  - 登录：`/user/login/`
  - 注册：`/user/register/`
  - 笔记列表：`/note/list`
  - 知识库：`/knowledge/...`
  - 聊天：`/chat/...`
3. 阅读 `front/vite.config.js`。
4. 对照代理规则理解：
  - `/user`、`/file` 代理到 Django 用户服务。
  - `/note/`、`/knowledge/`、`/chat/...` 代理到 FastAPI 后端。
5. 打开浏览器 DevTools 的 Network，刷新笔记页，观察：
  - Request URL 是 `http://localhost:3000/note/list?...`
  - 实际由 Vite 代理转发到 `127.0.0.1:8000`。

**验收标准**：

- 能解释为什么浏览器里看到的是 `localhost:3000`，后端日志里看到的是 `127.0.0.1:8000`。
- 能指出修改代理目标应该改 `front/vite.config.js`。

### 第 4 天：注册与登录链路

**目标**：完整理解用户注册、登录和前端登录态保存。

**具体步骤**：

1. 阅读前端页面：
  - `front/src/views/Register.vue`
  - `front/src/views/Login.vue`
2. 阅读用户状态：
  - `front/src/store/user.js`
3. 阅读 Django 用户接口：
  - `DjangoUserService/apps/user/views.py`
  - `DjangoUserService/apps/user/authentications.py`
  - `DjangoUserService/apps/user/urls.py`
4. 画出登录链路：
  ```text
   Login.vue -> userStore.login -> /user/login/ -> Django LoginView -> JWTTokenGenerator.generate_token -> 前端保存 jwt_token
  ```
5. 浏览器 Console 验证：
  ```js
   localStorage.getItem('jwt_token')
  ```
6. 手动清 token：
  ```js
   localStorage.removeItem('jwt_token')
   location.href = '/notes'
  ```
7. 观察是否跳到 `/login?redirect=/notes`。

**验收标准**：

- 能说清楚 token 是 Django 签发、前端保存、FastAPI 校验。
- 能解释注册后是否应该自动登录，以及当前项目选择的行为。

### 第 5 天：JWT 校验和 401 排查

**目标**：掌握“token 无效”的根因定位方法。

**具体步骤**：

1. 阅读 FastAPI 鉴权代码：
  - `backend/app/utils/auth_utils.py`
2. 重点看：
  - `SECRET_KEY = os.getenv("SECRET_KEY")`
  - `ALGORITHM = os.getenv("ALGORITHM")`
  - `jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])`
  - `get_current_user_id()`
3. 阅读 401 统一处理：
  - `backend/app/core/failed_response.py`
4. 对照 `.env`：
  - `backend/.env`：`SECRET_KEY`、`ALGORITHM`
  - `DjangoUserService/.env`：`JWT_SECRET_KEY`
5. 验证密钥是否一致时不要打印真实值，只比较是否相等：
  ```bash
   python - <<'PY'
   from pathlib import Path
   def load_env(path):
       data = {}
       for line in Path(path).read_text().splitlines():
           line = line.strip()
           if not line or line.startswith('#') or '=' not in line:
               continue
           k, v = line.split('=', 1)
           data[k.strip()] = v.strip().strip('"').strip("'")
       return data
   b = load_env('backend/.env')
   d = load_env('DjangoUserService/.env')
   print('SECRET_KEY equal:', b.get('SECRET_KEY') == d.get('JWT_SECRET_KEY'))
   print('ALGORITHM:', b.get('ALGORITHM'))
   PY
  ```
6. 用 Network 看 `/note/list` 的 Request Headers，确认是否有：
  ```http
   Authorization: Bearer <token>
  ```

**验收标准**：

- 能区分三类 401：没带 token、token 格式空、JWT 解码失败。
- 能说出为什么 `Authorization: Bearer` 是前端空 token 问题。

### 第 6-7 天：第 1 周实战任务

**任务**：写一份“认证链路排查记录”。

**具体步骤**：

1. 清空浏览器 token。
2. 访问 `/notes`。
3. 记录页面跳转结果。
4. 登录。
5. 记录 `localStorage.jwt_token` 是否存在。
6. 刷新 `/notes`。
7. 记录 `/note/list` 请求头和响应。
8. 在 FastAPI 日志里找到对应请求。
9. 写下你对下面问题的答案：
  - token 从哪里来？从 **Django 用户服务**来。当用户提交账号密码，Django 的 `LoginView` 验证成功后，调用 `JWTTokenGenerator.generate_token()` 方法，使用 `SECRET_KEY` 和 `HS256` 算法，将用户的 uuid、用户名以及
  - token 存在哪里？前端将 Token 存在两个地方：Pinia Store（内存中）供组件快速读取；同时通过 `pinia-plugin-persistedstate` 序列化存储在浏览器的 **localStorage（硬盘中）**，以保证页面刷新后状态不丢失。
  - FastAPI 怎么知道当前用户是谁？通过 **Token 解码与反向查询**。当请求到达 FastAPI 时，拦截器 `get_current_user_id` 会读取请求头中的 `Authorization`。它利用与 Django 共享的同一个 `SECRET_KEY` 解密 Token。解密成功后，从中提取出 `user_id`。如果需要更详细的用户资料，FastAPI 会以这个 ID 为键去 Redis 查询（旁路缓存），如果没命中，再携带此 Token 发起 HTTP 请求去调用 Django 的 `/user/detail/` 接口获取。
  - Redis 黑名单在哪一步参与？在**网关验签成功之后，业务处理之前**参与。无论是在 Django (`authentications.py`) 还是 FastAPI (`auth_utils.py`) 中，当 JWT 的密码学签名验证通过后，程序都会提取出 Payload 中的 `jti` 字段，去 Redis 中查询是否存在以 `blacklist:{jti}` 为键的记录。如果存在，立刻抛出 401 异常，阻断后续所有业务流程。

**验收标准**：

- 能独立解释一次完整认证链路。
- 能定位一次 401 的具体原因，而不是只说“token 无效”。

## 3. 第 2 周：笔记与用户业务

### 第 8 天：笔记列表链路

**目标**：掌握从前端笔记页到 FastAPI note service 的调用链。

**具体步骤**：

1. 阅读前端笔记列表：
  - `front/src/views/NoteList.vue`
2. 找到：
  - `fetchNotes()`
  - `apiConfig.endpoints.noteList`
  - `getHeaders()`
3. 阅读 FastAPI 路由：
  - `backend/app/router/note_router.py`
4. 找到：
  - `@note_router.get("/list")`
  - `Depends(get_current_user_id)`
  - `note_service.list_notes(...)`
5. 阅读业务服务：
  - `backend/app/services/note_service.py`
6. 阅读模型：
  - `backend/app/models/note.py`
7. 用 Network 访问 `/notes`，记录请求参数：
  - `page`
  - `page_size`
  - `category`
  - `tag`

**验收标准**：

- 能画出：`NoteList.vue -> /note/list -> note_router.py -> note_service.py -> note.py`。
- 能解释分页参数在哪里生成、在哪里消费。

### 第 9 天：新建和编辑笔记

**目标**：理解笔记编辑器、保存接口、标签生成入口。

**具体步骤**：

1. 阅读：
  - `front/src/views/NoteEditor.vue`
  - `front/src/components/MarkdownEditor.vue`
2. 找到保存笔记的函数和请求路径。
3. 阅读：
  - `backend/app/router/note_router.py`
  - `backend/app/services/note_service.py`
4. 观察新建和更新是否走不同接口：
  - `/note/create`
  - `/note/{noteId}`
5. 浏览器实际操作：
  - 登录。
  - 新建一条笔记。
  - 编辑标题和正文。
  - 保存。
  - 返回列表确认出现。
6. 在 Network 中记录 create/update 请求体和响应体。

**验收标准**：

- 能解释笔记的 `title`、`content`、`category`、`tags` 如何在前后端传递。
- 能说出新增和更新的区别。

### 第 10 天：标签、分类和相关笔记

**目标**：理解笔记标签、分类、相关笔记推荐如何工作。

**具体步骤**：

1. 阅读组件：
  - `front/src/components/TagBadge.vue`
  - `front/src/components/RelatedNotes.vue`
2. 阅读编辑页里如何引用相关笔记组件。
3. 在 `backend/app/router/note_router.py` 中查找：
  - `auto-tag`
  - `related`
  - `search`
4. 在 `backend/app/services/note_service.py` 中找到对应函数。
5. 实际操作：
  - 创建两条内容相近的笔记。
  - 打开编辑页。
  - 观察相关笔记请求和返回。
6. 记录相关笔记来源是笔记库、知识库，还是两者都有。

**验收标准**：

- 能说出标签是展示字段还是模型生成字段。
- 能说明“相关笔记”请求从哪个组件发出，后端如何处理。

### 第 11 天：每日回顾

**目标**：理解间隔重复回顾模块。

**具体步骤**：

1. 阅读前端页面：
  - `front/src/views/DailyReview.vue`
  - `front/src/components/ReviewCard.vue`
2. 阅读后端路由：
  - `backend/app/router/review_router.py`
3. 阅读服务：
  - `backend/app/services/review_service.py`
4. 阅读模型：
  - `backend/app/models/review_record.py`
5. 实际操作：
  - 创建或找到一条笔记。
  - 进入每日回顾页。
  - 点击完成回顾。
  - 观察 `/review/today` 和 `/review/done/{noteId}` 请求。

**验收标准**：

- 能解释回顾记录和笔记之间的关系。
- 能说出下一次回顾时间在哪里计算。

### 第 12 天：用户资料与头像/文件

**目标**：理解用户信息从 Django 服务到前端的链路。

**具体步骤**：

1. 阅读前端：
  - `front/src/views/Profile.vue`
  - `front/src/views/My.vue`
  - `front/src/store/user.js`
2. 阅读 Django：
  - `DjangoUserService/apps/user/views.py`
  - `DjangoUserService/apps/file/views.py`
3. 对照 `DjangoUserService/api.md` 的用户详情和文件上传接口。
4. 实际操作：
  - 登录。
  - 进入“我的”。
  - 进入个人信息。
  - 修改用户信息。
  - 如果环境支持文件服务，上传头像。
5. 记录哪些请求走 `8001`，哪些走 `8000`。

**验收标准**：

- 能解释为什么用户资料不在 FastAPI 主服务里处理。
- 能说明用户服务和 RAG 服务的边界。

### 第 13 天：进阶思考：结构化/非结构化数据治理与多租户隔离

**目标**：在掌握笔记和知识库业务的同时，理解真实 RAG 系统最容易被追问的数据治理问题：MySQL 里的结构化业务数据和 ChromaDB 里的非结构化向量数据如何保持一致，以及如何避免用户之间的数据串读。

**具体步骤**：

1. 回顾本周已经读过的笔记模型和服务：
  - `backend/app/models/note.py`
  - `backend/app/services/note_service.py`
  - `backend/app/router/note_router.py`
2. 对照第 3 周会深入学习的知识库模块，先预读：
  - `backend/app/router/knowledge_router.py`
  - `backend/app/router/knowledge_service.py`
  - `backend/app/rag/md5_manager`
  - `backend/app/rag/retrievers`
3. 画出两类数据的生命周期：
  ```text
   笔记：MySQL note 表 -> note_service 增删改查 -> 前端展示
   知识库：上传文件 -> 切片 -> 向量化 -> ChromaDB -> 检索
  ```
4. 思考一致性问题：
  - 如果 MySQL 中一条笔记被删除，对应的向量是否也应该删除？
  - 如果知识库文件重复上传，如何避免 ChromaDB 中出现重复向量？
  - 如果切片成功但写入向量库失败，系统应该如何回滚或标记失败？
5. 思考多租户隔离问题：
  - 每个请求如何拿到 `user_id`？
  - `user_id` 是否进入了 MySQL 查询条件？
  - `user_id` 是否进入了向量检索过滤条件？
  - 如果漏掉 `user_id` 过滤，用户 A 可能在哪些页面看到用户 B 的数据？
6. 写一份 500 字以内的“数据治理风险清单”，至少包含：
  - 结构化数据和向量数据不一致的场景。
  - 多用户数据串读的风险点。
  - 删除、更新、重复上传时应如何同步清理向量。

**验收标准**：

- 能解释 MySQL 和 ChromaDB 在项目中分别保存什么。
- 能说出“删除业务数据时也要考虑向量数据清理”的原因。
- 能回答：如果项目推广给大量用户，向量检索阶段如何确保用户 A 绝对无法检索到用户 B 的私有知识库切片。

### 第 14 天：第 2 周实战任务

**任务**：追踪“新建笔记后出现在列表中”的完整链路。

**具体步骤**：

1. 登录并清空 Network。
2. 新建一条带明确标题的笔记。
3. 保存。
4. 截取 create 请求：请求 URL、请求体、响应体。
5. 回到列表页。
6. 截取 list 请求：请求 URL、请求头、响应体。
7. 在后端代码里标注：
  - 前端发起请求的位置。
  - FastAPI 路由入口。
  - service 函数。
  - 数据模型。
8. 写下如果保存失败，你会检查哪些地方。

**验收标准**：

- 能用自己的话复述整个链路。
- 能定位保存失败或列表不刷新时优先检查哪些文件。

## 4. 第 3 周：知识库与 RAG

### 第 15 天：知识库页面和上传接口

**目标**：理解文件上传和知识库管理的前端链路。

**具体步骤**：

1. 阅读：
  - `front/src/views/KnowledgeBase.vue`
2. 找到上传单文件、上传多文件、获取图片、删除/清理知识库相关函数。
3. 阅读 API 配置：
  - `front/src/config/api.js`
4. 阅读后端路由：
  - `backend/app/router/knowledge_router.py`
5. 实际操作：
  - 登录。
  - 上传一个小的 `.txt` 或 `.md` 文件。
  - 在 Network 中记录上传请求。
6. 如果上传失败，检查：
  - 文件类型。
  - 文件大小。
  - 后端日志。
  - `docs/troubleshooting.md` 的文件上传部分。

**验收标准**：

- 能说明知识库上传请求从哪个页面发出、进入哪个 FastAPI 路由。
- 能解释为什么请求需要 token。

### 第 16 天：文档处理和切片

**目标**：理解上传文件如何被解析、切片并准备向量化。

**具体步骤**：

1. 阅读 RAG 文档处理目录：
  - `backend/app/rag/document_handler`
2. 阅读 Chroma 配置：
  - `backend/app/config/chroma.yaml`
3. 重点理解配置项：
  - `persist_directory`
  - `allow_knowledge_file_types`
  - `chunk_size`
  - `chunk_overlap`
  - `separators`
4. 上传一个短文档。
5. 在后端日志中查找文档处理、切片、向量化相关输出。
6. 如果支持切片详情页面，查看切片结果是否符合预期。

**验收标准**：

- 能解释 chunk size 和 overlap 对检索效果的影响。
- 能说明为什么同一个文件重复上传可能需要 MD5 去重。

### 第 17 天：向量库与检索

**目标**：理解 ChromaDB、向量检索和用户隔离。

**具体步骤**：

1. 阅读：
  - `backend/app/rag/retrievers`
  - `backend/app/rag/md5_manager`
2. 阅读知识库相关 service：
  - `backend/app/router/knowledge_service.py`
3. 找到检索时如何传入用户信息。
4. 实际操作：
  - 用户 A 上传文档。
  - 用同一个用户提问相关问题。
  - 观察是否能检索到该文档。
5. 思考用户隔离：
  - 检索条件里是否包含 user_id。
  - 如果不包含，会有什么安全问题。

**验收标准**：

- 能解释“向量库不是数据库替代品”，它保存的是可检索语义片段。
- 能说出用户隔离为什么是 RAG 应用的安全底线。

### 第 18 天：RAG 问答链路

**目标**：理解一次 RAG 问答从问题到答案的完整过程。

**具体步骤**：

1. 阅读前端聊天页面：
  - `front/src/views/AIChat.vue`
2. 找到 RAG/Agent 请求函数。
3. 阅读后端聊天路由：
  - `backend/app/router/chat.py`
  - `backend/app/router/chat_service.py`
4. 阅读 RAG 相关目录：
  - `backend/app/rag`
  - `backend/app/prompt`
5. 实际操作：
  - 上传一个文档。
  - 在 AI 聊天中询问文档内容。
  - 观察流式响应或普通响应。
  - 记录请求路径、请求体、响应格式。
6. 画出链路：
  ```text
   AIChat.vue -> /chat/... -> chat router/service -> retriever -> prompt -> LLM -> response stream
  ```

**验收标准**：

- 能解释 RAG 的四步：切片、向量化、检索、生成。
- 能说出项目里 prompt 放在哪里。

### 第 19 天：重排序模型和模型配置

**目标**：理解嵌入模型、重排序模型和 LLM 配置。

**具体步骤**：

1. 阅读：
  - `docs/modelscope_model.md`
  - `docs/troubleshooting.md` 中模型相关部分。
2. 阅读 `.env` 里的模型配置：
  - `LLM_TYPE`
  - `ALIYUN_BASE_URL`
  - `CHAT_MODEL_NAME`
  - `EMBED_MODEL_TYPE`
  - `TEXT_EMBEDDING_MODEL_NAME`
  - `RERANKER_MODEL_PATH`
3. 在后端启动日志中寻找模型加载信息。
4. 故意检查一个错误配置会导致什么日志，但不要把错误配置提交。
5. 理解重排序的作用：先召回多个候选，再排序取更相关的结果。

**验收标准**：

- 能解释 LLM、embedding、reranker 三者区别。
- 能说出模型路径错误时优先看哪个文档和日志。

### 第 20 天：进阶思考：召回精度、重排序与多模态 RAG

**目标**：在跑通知识库和 RAG 链路后，进一步理解检索质量为什么不能只靠调 `chunk_size` 和 `chunk_overlap`，以及纯文本 RAG 面对图表、图片、多光谱报告等复杂材料时应该如何演进。

**具体步骤**：

1. 回顾本周已经读过的 RAG 关键路径：
  - `backend/app/rag/document_handler`
  - `backend/app/rag/retrievers`
  - `backend/app/router/knowledge_service.py`
  - `backend/app/router/chat_service.py`
2. 对照 `backend/app/config/chroma.yaml`，写下当前切片配置：
  - `chunk_size`
  - `chunk_overlap`
  - `separators`
  - 允许上传的文件类型
3. 画出当前检索链路：
  ```text
   用户问题 -> 向量检索粗召回 -> reranker 精排 -> 拼接 prompt -> LLM 生成
  ```
4. 思考为什么需要“向量粗召回 + reranker 精排”：
  - 向量检索适合快速找到语义相近候选。
  - reranker 更适合在少量候选中判断问题和片段的真实相关性。
  - 只扩大召回数量可能带来更多噪声，不一定提升答案质量。
5. 总结只调切片参数无法解决的检索失效：
  - 问题和原文表达差异太大。
  - 答案分散在多个章节，需要跨片段综合。
  - 表格、图片、公式中的关键信息没有进入文本。
  - OCR 或解析阶段已经丢失信息。
  - query 本身太短或意图不明确。
6. 做一次小型对比实验：
  - 准备一份包含标题、列表、表格说明的 Markdown 文档。
  - 上传后提 2 个事实型问题和 1 个综合型问题。
  - 记录哪些问题能命中，哪些问题回答不稳定。
  - 不要求立刻改配置，重点是定位失败发生在解析、切片、召回、精排还是生成。
7. 设计一个多模态 RAG 演进草图：
  ```text
   文件上传 -> 文本解析/OCR/图像描述 -> 文本向量库
            -> 图片特征提取/多模态 embedding -> 图像向量库
            -> metadata 关联原文件、页码、user_id -> 统一检索和重排序
  ```
8. 思考如果用户上传包含大量图表或多光谱图像分析报告，现有架构至少要补哪些能力：
  - 图片和表格解析。
  - 图像 caption 或多模态 embedding。
  - 文本片段和图片片段的 metadata 对齐。
  - 检索阶段继续按 `user_id` 做隔离。
  - 回答时能引用原始页码、图表或图片来源。
9. 写一份 500 字以内的“RAG 调优与多模态演进说明”，回答：
  - 为什么不能只靠调 chunk 参数解决所有召回问题？
  - reranker 在系统中解决了什么问题？
  - 多模态 RAG 相比纯文本 RAG 多了哪些数据治理难点？

**验收标准**：

- 能解释向量召回和 reranker 精排的职责边界。
- 能举例说明 chunk size/overlap 无法解决的检索失败。
- 能画出纯文本 RAG 向多模态 RAG 演进时新增的数据流和隔离点。

### 第 21 天：第 3 周实战任务

**任务**：从上传文档到 RAG 回答做一次完整追踪。

**具体步骤**：

1. 准备一份 5-10 行的 Markdown 文档，内容包含一个明确事实。
2. 登录并上传文档。
3. 在后端日志中记录上传处理是否成功。
4. 在 AI 聊天中询问这个事实。
5. 记录请求路径、请求体、响应内容。
6. 如果没有答对，按顺序排查：
  - 文档是否上传成功。
  - 文档类型是否允许。
  - 是否成功切片。
  - 是否写入向量库。
  - 检索 query 是否相关。
  - reranker 是否加载成功。
  - LLM 配置是否可用。
7. 写一段 300 字总结：这个项目的 RAG 链路和基础问答有什么不同。本项目的 RAG 链路与普通问答不同。普通问答主要依赖 LLM 自身参数知识和上下文，而 RAG 会先把用户上传的文档解析、切片、向量化后写入 ChromaDB。用户提问时，系统会将问题向量化，并按 user_id 从向量库中检索相关片段，再经过 BM25/向量混合检索和 reranker 重排序，选出最相关的内容放入 prompt，最后由 LLM 基于参考资料生成答案。
  如果回答错误，不能只认为是模型不够好。需要逐层排查：文档是否上传成功、文件类型是否允许、切片是否包含答案、向量写入是否成功、检索是否命中相关 chunk、reranker 是否正常加载、LLM 配置是否可用，以及当前 AI 问答是否真的触发了 RAG 工具。尤其在 Agent 模式下，模型可能不主动调用知识库工具，因此需要通过 prompt 或明确指令保证涉及用户私有知识的问题先检索再回答。

**验收标准**：

- 能独立跑通上传文档到问答。
- 能解释回答错误时不是只怪模型，而是逐层排查。

## 5. 第 4 周：AI 聊天、调试和交付能力

### 第 22 天：会话管理

**目标**：理解聊天会话如何保存和恢复。

**具体步骤**：

1. 阅读前端：
  - `front/src/views/AIChat.vue`
  - `front/src/views/Sessions.vue`
  - `front/src/store/session.js`
2. 阅读后端：
  - `backend/app/models/chat_history.py`
  - `backend/app/services/database_session_manager.py`
  - `backend/app/router/chat.py`
3. 实际操作：
  - 发起一次聊天。
  - 打开会话列表。
  - 点击历史会话。
  - 删除一个会话。
4. 记录每个操作对应的 API。

**验收标准**：

- 能说明会话 ID 从哪里来。
- 能解释会话列表和聊天内容的存储关系。

### 第 23 天：流式响应和前端渲染

**目标**：理解 AI 响应如何流式展示。

**具体步骤**：

1. 在 `front/src/views/AIChat.vue` 中查找：
  - `stream`
  - `fetch`
  - `ReadableStream`
  - `EventSource`
2. 在 `backend/app/router/chat.py` 中查找：
  - `StreamingResponse`
  - `stream`
3. 实际操作：
  - 发送一个较长问题。
  - 观察答案是否逐步出现。
  - 在 Network 中查看响应类型。
4. 如果流式响应中断，优先检查：
  - 代理是否支持 stream。
  - 后端是否抛异常。
  - 前端是否正确读取 chunk。

**验收标准**：

- 能解释流式响应和普通 JSON 响应的区别。
- 能说出前端如何把增量内容追加到页面。

### 第 24 天：异常处理和日志

**目标**：掌握项目的错误处理方式。

**具体步骤**：

1. 阅读：
  - `backend/app/core/failed_response.py`
  - `backend/app/core/failed_response_register.py`
  - `backend/app/core/logger_handler.py`
2. 触发几个错误：
  - 未登录访问受保护接口。
  - 请求不存在路由。
  - 上传不支持文件类型。
3. 观察：
  - 浏览器响应体。
  - FastAPI 日志。
  - 前端 toast 或错误提示。
4. 对比 HTTP 状态码和业务 message。

**验收标准**：

- 能解释为什么很多 401 都显示同一句“请先登录或确保您的token有效”。
- 能判断错误应该在前端拦截、后端返回，还是全局异常处理。

### 第 25 天：进阶思考：高并发、高可用与系统观测性

**目标**：在掌握异常处理和日志后，进一步理解 AI 应用的性能瓶颈通常不只在业务代码，而会同时出现在网络 I/O、数据库、Redis、向量库、模型服务和显存资源上。

**具体步骤**：

1. 回顾当前请求链路中可能变慢的位置：
  ```text
   浏览器 -> Vite 代理 -> FastAPI/Django -> MySQL/Redis/ChromaDB -> embedding/reranker/LLM -> 响应返回
  ```
2. 阅读和性能相关的代码入口：
  - `backend/main.py`
  - `backend/app/router/chat.py`
  - `backend/app/router/knowledge_router.py`
  - `backend/app/db/redis_config.py`
  - `backend/app/core/logger_handler.py`
3. 思考 FastAPI `async` 的作用：
  - LLM API 调用、数据库查询、Redis 查询、文件处理都可能等待 I/O。
  - `async` 可以在等待期间释放事件循环处理其他请求。
  - 如果内部调用了阻塞式 CPU/GPU 推理或同步 I/O，仍然可能卡住服务。
4. 画出一次 RAG 问答的耗时拆分：
  ```text
   请求排队时间 + 鉴权时间 + 检索时间 + reranker 时间 + 首 token 时间 + tokens/s 生成速度 + 前端渲染时间
  ```
5. 假设遇到突发高并发，逐层判断最先可能崩溃的位置：
  - 前端代理连接数。
  - FastAPI worker 或事件循环。
  - MySQL 连接池。
  - Redis 连接或慢命令。
  - ChromaDB 检索延迟。
  - embedding/reranker/LLM 服务限流或显存不足。
6. 设计一套最小 Prometheus/Grafana 观测指标清单：
  - 主机：CPU、内存、磁盘、网络。
  - API：QPS、P50/P95/P99 延迟、错误率、401/500 数量。
  - 数据库：连接数、慢查询、查询耗时。
  - Redis：命中率、连接数、慢命令、内存。
  - RAG：文档切片耗时、向量写入耗时、检索耗时、reranker 耗时。
  - 模型：首 token 延迟、tokens/s、超时率、限流次数。
7. 做一次手动观测练习：
  - 上传文档或发起一次 AI 聊天。
  - 在 Network 中记录请求总耗时。
  - 在后端日志中记录对应请求的开始、结束和错误信息。
  - 如果日志缺少关键阶段耗时，写下应该补哪些埋点，但不要为了学习路线直接改代码。
8. 写一份 500 字以内的“慢请求排查路径”，回答：
  - 用户说“系统回复很慢”时，你先看哪些指标？
  - 如何判断是数据库慢、检索慢、模型慢，还是前端渲染慢？
  - 为什么 AI 应用需要单独关注首 token 时间和 tokens/s？

**验收标准**：

- 能解释 FastAPI `async` 对高 I/O 场景的价值和边界。
- 能列出 RAG 问答链路中至少 5 个可能的性能瓶颈。
- 能设计一套从主机、接口、数据库到模型生成速度的基础观测指标。

### 第 26 天：数据库、Redis 和状态排查

**目标**：能排查用户、会话、token 黑名单、缓存问题。

**具体步骤**：

1. 确认 MySQL 中至少有：
  - 用户服务数据库。
  - 聊天/笔记相关数据库。
2. 确认 Redis 中至少涉及：
  - JWT 黑名单。
  - 用户缓存。
  - Celery 相关数据。
3. 登录后退出，再观察 Redis 是否出现 blacklist 相关 key。
4. 阅读：
  - `backend/app/db/redis_config.py`
  - `DjangoUserService/apps/user/authentications.py`
5. 排查顺序：
  - 浏览器 localStorage。
  - 请求头 Authorization。
  - Django 签发 token。
  - FastAPI 解码 token。
  - Redis 黑名单。
  - 数据库用户是否存在。

**验收标准**：

- 能说明 Redis 在项目中至少承担哪些职责。
- 能独立判断一个 token 是缺失、过期、签名错，还是被拉黑。

### 第 27 天：进阶思考：从 RAG 链到 Agent 工具化

**目标**：在理解聊天、会话、RAG、数据库和状态排查后，进一步思考如何把固定的 RAG 问答链升级为能主动选择工具的 Agent，以及如何设计长期记忆来降低多轮对话中的上下文丢失和幻觉。

**具体步骤**：

1. 回顾当前 AI 聊天链路：
  - `front/src/views/AIChat.vue`
  - `backend/app/router/chat.py`
  - `backend/app/router/chat_service.py`
  - `backend/app/rag/retrievers`
  - `backend/app/prompt`
2. 画出当前固定 RAG 链：
  ```text
   用户问题 -> 固定调用知识库检索 -> prompt 拼接上下文 -> LLM 生成答案
  ```
3. 对比 Agent 工具化后的动态链路：
  ```text
   用户问题 -> LLM 判断意图 -> 选择工具 -> 执行工具 -> 观察结果 -> 继续推理或回答
  ```
4. 设计三个候选 Tool 的职责边界：
  - 知识库检索 Tool：回答用户上传文档、笔记、资料中的内容。
  - 数据库 SQL 查询 Tool：回答结构化统计问题，例如笔记数量、分类分布、会话历史。
  - 联网搜索 Tool：回答项目外部、实时性较强的问题。
5. 思考 Tool 路由判断规则：
  - 问题是否明确引用“我的文档”“我的笔记”“刚上传的资料”？优先知识库检索。
  - 问题是否要求计数、排序、筛选、统计？可能需要 SQL 查询。
  - 问题是否要求最新外部事实？可能需要联网搜索。
  - 如果涉及用户私有数据，必须先鉴权并带上 `user_id`。
6. 思考长期记忆机制：
  - 不直接无限拼接 `BufferMemory`，避免上下文过长和旧信息污染。
  - 对多轮对话定期总结，提取用户目标、关键实体、偏好和未完成任务。
  - 将摘要写入可检索存储，并保留来源会话和时间。
  - 检索长期记忆时要区分事实、偏好和模型推测，避免把幻觉固化为记忆。
7. 设计一条“记忆写入前校验”规则：
  - 只有用户明确表达或系统可验证的事实才能写入长期记忆。
  - 模型自己猜测的内容不能写入。
  - 过期或冲突记忆需要更新或废弃。
8. 写一份 500 字以内的“RAG 到 Agent 演进说明”，回答：
  - 固定 RAG 链和 Agent 动态路由的区别是什么？
  - Agent 如何判断调用知识库、SQL 还是联网搜索？
  - 长期记忆为什么不能只是把历史对话越拼越长？

**验收标准**：

- 能解释 RetrievalQA 这类固定链和 Agent 工具调用的核心区别。
- 能为知识库检索、SQL 查询、联网搜索划出清晰边界。
- 能说明长期记忆的写入、检索、过期和幻觉抑制原则。

### 第 28 天：小改动交付与最终综合演练

**目标**：完成一次小型真实改动，并从 0 到 1 跑通完整用户旅程，检验自己是否真正掌握前端、Django 用户服务、FastAPI、数据库/Redis、RAG 和调试链路。

**推荐小改动三选一**：

1. 给一个页面补未登录提示。
2. 给一个接口补更清晰的错误信息。
3. 给一个请求补运行时验证脚本或手动验证清单。

**具体步骤**：

1. 先写下小改动的预期行为。
2. 找到对应前端入口和后端入口。
3. 做最小修改，不顺手重构无关代码。
4. 运行相关命令：
  - 前端构建：`pnpm --dir front build`
  - 如果是浏览器行为，必须打开页面实际操作。
5. 记录小改动验证证据：
  - Network 请求。
  - 页面截图。
  - 终端输出。
  - 日志片段。
6. 清空浏览器 token。
7. 注册新用户。
8. 确认注册后进入登录页。
9. 登录。
10. 新建一条笔记。
11. 上传一份知识库文档。
12. 在 AI 聊天中提问。
13. 查看会话列表。
14. 进入每日回顾。
15. 退出登录。
16. 再访问 `/notes`，确认被拦到登录页。
17. 写一份最终复盘，回答：
  - 哪些请求走 Django？
    - 哪些请求走 FastAPI？
    - 哪些请求需要 token？
    - token 在哪里签发、保存、校验？
    - RAG 回答至少经过哪些步骤？
    - 如果回答不准确，你会从哪几层排查？
    - 如果系统回复很慢，你会先看哪些指标？
    - 如果升级成 Agent，哪些问题适合知识库检索、SQL 查询或联网搜索？

**验收标准**：

- 能说出小改动修改了哪些文件、为什么改这些文件。
- 能提供“运行后的证据”，而不是只说代码看起来没问题。
- 能完整演示项目主要功能。
- 能解释每个关键页面背后的前后端代码路径。
- 能定位一个跨前端、后端、数据库/Redis、RAG/模型服务的问题。

## 6. 常用排查清单

### 6.1 前端页面不对

1. 看 `front/src/router/index.js` 是否路由到了预期组件。
2. 看 `front/src/views/<Page>.vue` 是否实际发请求。
3. 看浏览器 Console 是否报错。
4. 看 Network 请求是否发出。
5. 看 `front/vite.config.js` 代理是否匹配。

### 6.2 接口 401

1. 浏览器 Console：
  ```js
   localStorage.getItem('jwt_token')
  ```
2. Network Request Headers 是否有：
  ```http
   Authorization: Bearer <token>
  ```
3. 如果是 `Authorization: Bearer`，说明前端 token 为空。
4. 比对 `backend/.env SECRET_KEY` 和 `DjangoUserService/.env JWT_SECRET_KEY`。
5. 看 Redis 是否有黑名单 key。
6. 看 FastAPI `backend/app/utils/auth_utils.py` 解码逻辑。

### 6.3 RAG 回答不准

1. 文档是否上传成功。
2. 文件类型是否被允许。
3. 文档是否成功切片。
4. 是否写入 ChromaDB。
5. query 是否能检索到相关片段。
6. reranker 是否加载成功。
7. prompt 是否包含检索内容。
8. LLM 配置是否可用。

### 6.4 会话列表异常

1. 看 `front/src/store/session.js` 请求路径。
2. 看 `backend/app/router/chat.py` 会话接口。
3. 看 `backend/app/models/chat_history.py` 表结构。
4. 看数据库连接配置。
5. 看请求是否带 token。

## 7. 建议产出物

学习过程中建议沉淀这些文档或笔记：

1. `认证链路.md`：注册、登录、JWT、路由守卫、401 排查。
2. `笔记链路.md`：列表、新建、编辑、标签、相关笔记。
3. `RAG链路.md`：上传、切片、向量化、检索、重排序、生成。
4. `调试手册.md`：浏览器、日志、Redis、数据库、常见错误。
5. `最终复盘.md`：完整用户旅程和代码路径地图。

## 8. 最小代码路径索引

### 认证

- 前端登录：`front/src/views/Login.vue`
- 前端注册：`front/src/views/Register.vue`
- 前端用户状态：`front/src/store/user.js`
- 前端路由守卫：`front/src/router/index.js`
- 前端鉴权工具：`front/src/utils/auth.js`
- Django 登录/注册：`DjangoUserService/apps/user/views.py`
- Django JWT：`DjangoUserService/apps/user/authentications.py`
- FastAPI JWT 校验：`backend/app/utils/auth_utils.py`
- FastAPI 401 处理：`backend/app/core/failed_response.py`

### 笔记

- 笔记列表：`front/src/views/NoteList.vue`
- 笔记编辑：`front/src/views/NoteEditor.vue`
- Markdown 编辑器：`front/src/components/MarkdownEditor.vue`
- 相关笔记：`front/src/components/RelatedNotes.vue`
- 笔记路由：`backend/app/router/note_router.py`
- 笔记服务：`backend/app/services/note_service.py`
- 笔记模型：`backend/app/models/note.py`

### 知识库与 RAG

- 知识库页面：`front/src/views/KnowledgeBase.vue`
- 知识库路由：`backend/app/router/knowledge_router.py`
- 知识库服务：`backend/app/router/knowledge_service.py`
- RAG 目录：`backend/app/rag`
- Prompt：`backend/app/prompt`
- Chroma 配置：`backend/app/config/chroma.yaml`

### 聊天和会话

- AI 聊天页面：`front/src/views/AIChat.vue`
- 会话页面：`front/src/views/Sessions.vue`
- 会话 store：`front/src/store/session.js`
- 聊天路由：`backend/app/router/chat.py`
- 聊天服务：`backend/app/router/chat_service.py`
- 会话模型：`backend/app/models/chat_history.py`
- 会话管理：`backend/app/services/database_session_manager.py`

## 9. 学习方法建议

1. 每次只追一条业务链路，不要同时看多个模块。
2. 先从浏览器 Network 找请求，再反查前端代码和后端路由。
3. 遇到问题先定位在哪一层：前端状态、代理、后端路由、业务服务、数据库、Redis、模型。
4. 不要只读代码，必须实际操作页面并记录请求和响应。
5. 每周至少做一次“从页面到数据库/模型”的完整追踪。
