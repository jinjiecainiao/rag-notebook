# RAG Notebook 项目设计说明

RAG Notebook 面向课程资料、课件文档和个人笔记分散的学习场景。项目将知识沉淀、跨源关联、Agent 问答与间隔回顾组织成一条连续的使用流程。

## 跨源知识关联

MySQL 保存笔记原文、分类、标签和用户归属，ChromaDB 保存笔记与知识库文档的向量索引。两类内容复用统一的 Embedding 模型，分别存放于 `notes_collection` 和 `rag_collection`。

用户查看一篇笔记时，服务以当前笔记全文为 Query，在当前用户范围内检索两个 Collection，排除当前笔记后合并候选，按向量距离排序并返回 Top-K。结果保留笔记或知识库来源，帮助用户发现表述不同但语义相关的资料。

代码入口：`backend/app/services/note_service.py` 中的 `get_related_notes`。

## 间隔回顾闭环

回顾服务采用 `1 / 2 / 4 / 7 / 15 / 30` 天的递增间隔。MySQL 持久化回顾次数、上次回顾时间与下次回顾时间。笔记创建后通过进程内异步任务初始化回顾记录，按到期时间筛选任务，完成后更新下一次日期。

到期查询与完成标记同时封装为 Agent Tools，支持在聊天中查看与完成回顾。该策略采用固定递增间隔，不依赖对记忆难度的动态估计。

代码入口：`backend/app/services/review_service.py` 与 `backend/app/agent/agent_tools.py`。

## Agent 问答与资料管理

FastAPI 承载笔记、知识库、回顾和聊天接口。LangChain Agent 通过工具调用检索个人资料、管理笔记和处理回顾任务；SSE 向前端发送增量内容和任务进度。Vue 3 提供编辑、关联推荐、每日回顾与聊天页面，Django 服务负责用户认证。

## 当前实现边界

- MySQL 是笔记和回顾状态的事实来源，ChromaDB 是语义索引。
- 向量写入和后台标签任务依赖进程内异步机制，仍有持久化任务队列与失败补偿的改进空间。
- 跨源关联采用向量距离合并；RAG 问答链路另外提供重排序能力。
- 当前公开代码维护于 `main` 分支，具体环境配置和启动命令见 README。
